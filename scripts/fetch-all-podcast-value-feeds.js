#!/usr/bin/env node

/**
 * Script to fetch and analyze ALL Podcast Index feeds with value tags
 * Fetches all 28,713+ feeds and analyzes payment methods (keysend vs lnaddress)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const PODCAST_INDEX_BASE_URL = 'https://api.podcastindex.org/api/1.0';
const PODCAST_INDEX_API_KEY = process.env.PODCAST_INDEX_API_KEY || '';
const PODCAST_INDEX_API_SECRET = process.env.PODCAST_INDEX_API_SECRET || '';
const MAX_FEEDS_PER_REQUEST = 1000;
const REQUEST_DELAY_MS = 100; // Delay between requests to be respectful
const MAX_RETRIES = 3;

// Check if API credentials are available
if (!PODCAST_INDEX_API_KEY || !PODCAST_INDEX_API_SECRET) {
  console.error('❌ Error: Podcast Index API credentials not found!');
  console.error('Please set PODCAST_INDEX_API_KEY and PODCAST_INDEX_API_SECRET environment variables');
  console.error('You can get these from: https://podcastindex.org/api');
  process.exit(1);
}

class PodcastIndexFetcher {
  constructor() {
    this.allFeeds = [];
    this.stats = {
      totalFeeds: 0,
      feedsWithValue: 0,
      keysendFeeds: 0,
      lnaddressFeeds: 0,
      mixedFeeds: 0,
      otherFeeds: 0,
      keysendDestinations: 0,
      lnaddressDestinations: 0,
      otherDestinations: 0,
      apiCalls: 0,
      errors: 0,
      startTime: Date.now()
    };
  }

  /**
   * Generate authentication headers for Podcast Index API
   */
  generateAuthHeaders() {
    const apiHeaderTime = Math.floor(Date.now() / 1000);
    const hash = crypto.createHash('sha1');
    hash.update(PODCAST_INDEX_API_KEY + PODCAST_INDEX_API_SECRET + apiHeaderTime);
    const hashString = hash.digest('hex');

    return {
      'X-Auth-Key': PODCAST_INDEX_API_KEY,
      'X-Auth-Date': apiHeaderTime.toString(),
      'Authorization': hashString,
      'User-Agent': 'HPM-Lightning-Analysis/1.0'
    };
  }

  /**
   * Fetch feeds from Podcast Index API with pagination
   */
  async fetchFeedsPage(startAt = 1, max = MAX_FEEDS_PER_REQUEST) {
    const url = `${PODCAST_INDEX_BASE_URL}/podcasts/bytag?podcast-value=&max=${max}&start_at=${startAt}`;
    
    console.log(`📡 Fetching feeds ${startAt} to ${startAt + max - 1}...`);
    
    try {
      const response = await fetch(url, {
        headers: this.generateAuthHeaders()
      });

      this.stats.apiCalls++;

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.feeds || !Array.isArray(data.feeds)) {
        throw new Error('Invalid API response format');
      }

      console.log(`✅ Fetched ${data.feeds.length} feeds (${data.count} total in this batch)`);
      
      return {
        feeds: data.feeds,
        nextStartAt: data.nextStartAt,
        total: data.total,
        hasMore: data.feeds.length === max && data.nextStartAt
      };
    } catch (error) {
      console.error(`❌ Error fetching feeds page ${startAt}:`, error.message);
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Fetch all feeds with pagination and rate limiting
   */
  async fetchAllFeeds() {
    console.log('🚀 Starting to fetch all Podcast Index feeds with value tags...\n');
    
    let startAt = 1;
    let hasMore = true;
    let totalFeeds = 0;

    while (hasMore) {
      try {
        const result = await this.fetchFeedsPage(startAt);
        
        this.allFeeds.push(...result.feeds);
        totalFeeds = result.total;
        hasMore = result.hasMore;
        startAt = result.nextStartAt || startAt + MAX_FEEDS_PER_REQUEST;

        // Rate limiting - be respectful to the API
        if (hasMore) {
          console.log(`⏳ Waiting ${REQUEST_DELAY_MS}ms before next request...`);
          await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS));
        }

        // Progress update every 10 requests
        if (this.stats.apiCalls % 10 === 0) {
          console.log(`📊 Progress: ${this.allFeeds.length} feeds fetched so far...`);
        }

      } catch (error) {
        console.error(`❌ Failed to fetch page starting at ${startAt}:`, error.message);
        
        // Retry logic
        let retries = 0;
        while (retries < MAX_RETRIES) {
          retries++;
          console.log(`🔄 Retrying (${retries}/${MAX_RETRIES})...`);
          
          try {
            await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Exponential backoff
            const result = await this.fetchFeedsPage(startAt);
            
            this.allFeeds.push(...result.feeds);
            totalFeeds = result.total;
            hasMore = result.hasMore;
            startAt = result.nextStartAt || startAt + MAX_FEEDS_PER_REQUEST;
            break;
          } catch (retryError) {
            console.error(`❌ Retry ${retries} failed:`, retryError.message);
            if (retries === MAX_RETRIES) {
              console.error(`❌ Max retries reached for page ${startAt}, skipping...`);
              hasMore = false;
            }
          }
        }
      }
    }

    console.log(`\n🎉 Fetching complete!`);
    console.log(`📊 Total feeds fetched: ${this.allFeeds.length}`);
    console.log(`📊 API calls made: ${this.stats.apiCalls}`);
    console.log(`📊 Errors encountered: ${this.stats.errors}`);
    console.log(`📊 Expected total: ${totalFeeds}`);
  }

  /**
   * Analyze payment methods in all fetched feeds
   */
  analyzePaymentMethods() {
    console.log('\n🔍 Analyzing payment methods...');
    
    this.stats.totalFeeds = this.allFeeds.length;
    
    this.allFeeds.forEach((feed, index) => {
      if (index % 1000 === 0 && index > 0) {
        console.log(`📊 Analyzed ${index} feeds...`);
      }
      
      if (!feed.value || !feed.value.destinations) {
        return;
      }
      
      this.stats.feedsWithValue++;
      
      const destinations = feed.value.destinations;
      let hasKeysend = false;
      let hasLnaddress = false;
      let hasOther = false;
      
      destinations.forEach(dest => {
        if (dest.type === 'node') {
          this.stats.keysendDestinations++;
          hasKeysend = true;
        } else if (dest.type === 'lnaddress' || (dest.address && dest.address.includes('@'))) {
          this.stats.lnaddressDestinations++;
          hasLnaddress = true;
        } else {
          this.stats.otherDestinations++;
          hasOther = true;
        }
      });
      
      // Categorize the feed
      if (hasKeysend && hasLnaddress) {
        this.stats.mixedFeeds++;
      } else if (hasKeysend) {
        this.stats.keysendFeeds++;
      } else if (hasLnaddress) {
        this.stats.lnaddressFeeds++;
      } else if (hasOther) {
        this.stats.otherFeeds++;
      }
    });
    
    console.log(`✅ Analysis complete!`);
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    const duration = Date.now() - this.stats.startTime;
    const durationMinutes = Math.round(duration / 60000);
    
    console.log('\n📊 COMPREHENSIVE PAYMENT METHOD ANALYSIS');
    console.log('==========================================\n');
    
    console.log(`📈 OVERVIEW:`);
    console.log(`   Total feeds analyzed: ${this.stats.totalFeeds.toLocaleString()}`);
    console.log(`   Feeds with value tags: ${this.stats.feedsWithValue.toLocaleString()}`);
    console.log(`   Feeds without value tags: ${(this.stats.totalFeeds - this.stats.feedsWithValue).toLocaleString()}`);
    console.log(`   Analysis duration: ${durationMinutes} minutes\n`);
    
    console.log(`💰 PAYMENT METHODS:`);
    console.log(`   Keysend-only feeds: ${this.stats.keysendFeeds.toLocaleString()} (${((this.stats.keysendFeeds / this.stats.feedsWithValue) * 100).toFixed(1)}%)`);
    console.log(`   LNAddress-only feeds: ${this.stats.lnaddressFeeds.toLocaleString()} (${((this.stats.lnaddressFeeds / this.stats.feedsWithValue) * 100).toFixed(1)}%)`);
    console.log(`   Mixed payment feeds: ${this.stats.mixedFeeds.toLocaleString()} (${((this.stats.mixedFeeds / this.stats.feedsWithValue) * 100).toFixed(1)}%)`);
    console.log(`   Other payment types: ${this.stats.otherFeeds.toLocaleString()} (${((this.stats.otherFeeds / this.stats.feedsWithValue) * 100).toFixed(1)}%)\n`);
    
    console.log(`🎯 DESTINATION BREAKDOWN:`);
    console.log(`   Keysend destinations: ${this.stats.keysendDestinations.toLocaleString()}`);
    console.log(`   LNAddress destinations: ${this.stats.lnaddressDestinations.toLocaleString()}`);
    console.log(`   Other destinations: ${this.stats.otherDestinations.toLocaleString()}\n`);
    
    console.log(`🔧 TECHNICAL STATS:`);
    console.log(`   API calls made: ${this.stats.apiCalls}`);
    console.log(`   Errors encountered: ${this.stats.errors}`);
    console.log(`   Success rate: ${((this.stats.apiCalls - this.stats.errors) / this.stats.apiCalls * 100).toFixed(1)}%\n`);
    
    console.log(`💡 KEY INSIGHTS:`);
    console.log(`   • ${this.stats.keysendFeeds.toLocaleString()} feeds use keysend (Lightning node addresses)`);
    console.log(`   • ${this.stats.lnaddressFeeds.toLocaleString()} feeds use LNAddress (email-like addresses)`);
    console.log(`   • ${this.stats.mixedFeeds.toLocaleString()} feeds support both payment methods`);
    console.log(`   • Keysend destinations: ${this.stats.keysendDestinations.toLocaleString()}`);
    console.log(`   • LNAddress destinations: ${this.stats.lnaddressDestinations.toLocaleString()}`);
    
    if (this.stats.keysendFeeds > this.stats.lnaddressFeeds) {
      console.log(`   • Keysend is the dominant payment method`);
    } else if (this.stats.lnaddressFeeds > this.stats.keysendFeeds) {
      console.log(`   • LNAddress is the dominant payment method`);
    } else {
      console.log(`   • Keysend and LNAddress are equally popular`);
    }
  }

  /**
   * Save results to files
   */
  async saveResults() {
    const timestamp = new Date().toISOString();
    const dataDir = path.join(__dirname, '..', 'data');
    
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Save raw data
    const rawDataPath = path.join(dataDir, `podcast-value-feeds-${timestamp.split('T')[0]}.json`);
    const rawData = {
      timestamp,
      totalFeeds: this.stats.totalFeeds,
      feedsWithValue: this.stats.feedsWithValue,
      feeds: this.allFeeds,
      stats: this.stats
    };
    
    fs.writeFileSync(rawDataPath, JSON.stringify(rawData, null, 2));
    console.log(`\n💾 Raw data saved to: ${rawDataPath}`);
    
    // Save summary report
    const summaryPath = path.join(dataDir, `payment-method-summary-${timestamp.split('T')[0]}.json`);
    const summary = {
      timestamp,
      analysis: this.stats,
      insights: {
        dominantMethod: this.stats.keysendFeeds > this.stats.lnaddressFeeds ? 'keysend' : 'lnaddress',
        keysendPercentage: ((this.stats.keysendFeeds / this.stats.feedsWithValue) * 100).toFixed(1),
        lnaddressPercentage: ((this.stats.lnaddressFeeds / this.stats.feedsWithValue) * 100).toFixed(1),
        mixedPercentage: ((this.stats.mixedFeeds / this.stats.feedsWithValue) * 100).toFixed(1)
      }
    };
    
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`💾 Summary report saved to: ${summaryPath}`);
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      await this.fetchAllFeeds();
      this.analyzePaymentMethods();
      this.generateReport();
      await this.saveResults();
      
      console.log('\n🎉 Analysis complete! Check the data/ directory for saved results.');
    } catch (error) {
      console.error('\n❌ Fatal error:', error.message);
      process.exit(1);
    }
  }
}

// Run the analysis
const fetcher = new PodcastIndexFetcher();
fetcher.run();
