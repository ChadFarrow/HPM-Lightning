#!/usr/bin/env node

/**
 * Script to parse all RSS feeds and find items with customValue="01dor7UwNfuBgODLSMLmWT"
 */

const fs = require('fs');
const path = require('path');
const { DOMParser } = require('@xmldom/xmldom');

const TARGET_CUSTOM_VALUE = '01dor7UwNfuBgODLSMLmWT';

// Load feeds from feeds.json
const feedsPath = path.join(__dirname, '..', 'data', 'feeds.json');
const feedsData = JSON.parse(fs.readFileSync(feedsPath, 'utf8'));

async function fetchFeed(feedUrl) {
  try {
    console.log(`Fetching: ${feedUrl}`);
    const response = await fetch(feedUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Error fetching ${feedUrl}:`, error.message);
    return null;
  }
}

function parseFeedForCustomValue(xmlText, feedUrl, feedTitle) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  
  const results = [];
  
  // Check for parsing errors
  const parserError = xmlDoc.getElementsByTagName('parsererror')[0];
  if (parserError) {
    console.error(`XML parsing error for ${feedUrl}`);
    return results;
  }
  
  // Get channel info
  const channels = xmlDoc.getElementsByTagName('channel');
  if (!channels || channels.length === 0) {
    console.error(`No channel found in ${feedUrl}`);
    return results;
  }
  const channel = channels[0];
  
  // Check channel-level podcast:value
  const channelValueElements = [
    ...Array.from(channel.getElementsByTagName('podcast:value')),
    ...Array.from(channel.getElementsByTagName('value'))
  ];
  
  channelValueElements.forEach(valueElement => {
    const recipients = [
      ...Array.from(valueElement.getElementsByTagName('podcast:valueRecipient')),
      ...Array.from(valueElement.getElementsByTagName('valueRecipient'))
    ];
    
    recipients.forEach(recipient => {
      const customValue = recipient.getAttribute('customValue');
      if (customValue === TARGET_CUSTOM_VALUE) {
        results.push({
          feedUrl,
          feedTitle,
          level: 'channel',
          itemTitle: null,
          recipientInfo: {
            type: recipient.getAttribute('type'),
            address: recipient.getAttribute('address'),
            split: recipient.getAttribute('split'),
            name: recipient.getAttribute('name'),
            customKey: recipient.getAttribute('customKey'),
            customValue: customValue,
            fee: recipient.getAttribute('fee')
          }
        });
      }
    });
  });
  
  // Check item-level podcast:value
  const items = xmlDoc.getElementsByTagName('item');
  Array.from(items).forEach(item => {
    const itemTitle = item.getElementsByTagName('title')[0]?.textContent?.trim() || 'Unknown Item';
    
    const itemValueElements = [
      ...Array.from(item.getElementsByTagName('podcast:value')),
      ...Array.from(item.getElementsByTagName('value'))
    ];
    
    itemValueElements.forEach(valueElement => {
      const recipients = [
        ...Array.from(valueElement.getElementsByTagName('podcast:valueRecipient')),
        ...Array.from(valueElement.getElementsByTagName('valueRecipient'))
      ];
      
      recipients.forEach(recipient => {
        const customValue = recipient.getAttribute('customValue');
        if (customValue === TARGET_CUSTOM_VALUE) {
          results.push({
            feedUrl,
            feedTitle,
            level: 'item',
            itemTitle,
            recipientInfo: {
              type: recipient.getAttribute('type'),
              address: recipient.getAttribute('address'),
              split: recipient.getAttribute('split'),
              name: recipient.getAttribute('name'),
              customKey: recipient.getAttribute('customKey'),
              customValue: customValue,
              fee: recipient.getAttribute('fee')
            }
          });
        }
      });
    });
  });
  
  return results;
}

async function main() {
  console.log(`\n🔍 Searching for customValue="${TARGET_CUSTOM_VALUE}" in all RSS feeds...\n`);
  
  const allResults = [];
  let feedsProcessed = 0;
  let feedsWithMatches = 0;
  
  for (const feed of feedsData.feeds) {
    if (feed.status !== 'active') {
      console.log(`⏭️ Skipping inactive feed: ${feed.title}`);
      continue;
    }
    
    const xmlText = await fetchFeed(feed.originalUrl);
    if (xmlText) {
      const results = parseFeedForCustomValue(xmlText, feed.originalUrl, feed.title);
      if (results.length > 0) {
        feedsWithMatches++;
        allResults.push(...results);
        console.log(`✅ Found ${results.length} match(es) in ${feed.title}`);
      } else {
        console.log(`❌ No matches in ${feed.title}`);
      }
      feedsProcessed++;
    }
  }
  
  // Display results
  console.log('\n' + '='.repeat(80));
  console.log(`📊 RESULTS SUMMARY`);
  console.log('='.repeat(80));
  console.log(`Total feeds processed: ${feedsProcessed}`);
  console.log(`Feeds with matches: ${feedsWithMatches}`);
  console.log(`Total matches found: ${allResults.length}`);
  
  if (allResults.length > 0) {
    console.log('\n📋 DETAILED RESULTS:');
    console.log('-'.repeat(80));
    
    // Group by feed
    const groupedByFeed = {};
    allResults.forEach(result => {
      if (!groupedByFeed[result.feedTitle]) {
        groupedByFeed[result.feedTitle] = [];
      }
      groupedByFeed[result.feedTitle].push(result);
    });
    
    Object.entries(groupedByFeed).forEach(([feedTitle, results]) => {
      console.log(`\n🎵 ${feedTitle}`);
      console.log(`   URL: ${results[0].feedUrl}`);
      
      results.forEach(result => {
        console.log(`   📍 Level: ${result.level}`);
        if (result.itemTitle) {
          console.log(`      Track: ${result.itemTitle}`);
        }
        console.log(`      Recipient: ${result.recipientInfo.name || 'Unknown'}`);
        console.log(`      Address: ${result.recipientInfo.address}`);
        console.log(`      Split: ${result.recipientInfo.split}%`);
        console.log(`      Type: ${result.recipientInfo.type}`);
        if (result.recipientInfo.customKey) {
          console.log(`      Custom Key: ${result.recipientInfo.customKey}`);
        }
        console.log('');
      });
    });
    
    // Save results to file
    const outputPath = path.join(__dirname, '..', 'data', `custom-value-${TARGET_CUSTOM_VALUE}-results.json`);
    fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
    console.log(`\n💾 Results saved to: ${outputPath}`);
  } else {
    console.log(`\n❌ No RSS feeds found with customValue="${TARGET_CUSTOM_VALUE}"`);
  }
}

main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});