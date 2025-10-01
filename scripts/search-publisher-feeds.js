const crypto = require('crypto');

const API_KEY = 'CM9M48BRFRTRMUCAWV82';
const API_SECRET = 'WbB4Yx7zFLWbUvCYccb8YsKVeN5Zd2SgS4tEQjet';
const API_URL = 'https://api.podcastindex.org/api/1.0';

// Generate auth headers for Podcast Index API
function generateAuthHeaders() {
  const apiHeaderTime = Math.floor(Date.now() / 1000);
  const sha1Hash = crypto.createHash('sha1')
    .update(API_KEY + API_SECRET + apiHeaderTime)
    .digest('hex');

  return {
    'X-Auth-Date': apiHeaderTime.toString(),
    'X-Auth-Key': API_KEY,
    'Authorization': sha1Hash,
    'User-Agent': 'HPM-Lightning/1.0'
  };
}

// Search for publisher/artist feeds
async function searchPublisherFeeds(artist) {
  try {
    const headers = generateAuthHeaders();
    
    // Search for regular podcast feeds (might include publisher feeds)
    const searchUrl = `${API_URL}/search/byterm?q=${encodeURIComponent(artist)}&max=50`;
    
    console.log(`Searching for ${artist} publisher/artist feeds...`);
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const feeds = data.feeds || [];
    
    // Filter for potential publisher/artist feeds
    const publisherFeeds = feeds.filter(feed => {
      const title = feed.title?.toLowerCase() || '';
      const author = feed.author?.toLowerCase() || '';
      const description = feed.description?.toLowerCase() || '';
      const medium = feed.medium?.toLowerCase() || '';
      
      // Check if it's a music/publisher feed
      const isMusic = medium === 'music' || 
                      feed.categories?.hasOwnProperty('1') || // Music category
                      title.includes('music') ||
                      description.includes('music');
      
      // Check if it might be a publisher/collection feed
      const mightBePublisher = !title.includes('single') && 
                              !title.includes('remix') &&
                              !title.includes('(live)') &&
                              (title.includes(artist.toLowerCase()) || 
                               author.includes(artist.toLowerCase()));
      
      return isMusic || mightBePublisher;
    });
    
    return publisherFeeds;
  } catch (error) {
    console.error('Error fetching feeds:', error);
    return [];
  }
}

// Main function
async function main() {
  const artists = ['Circle the Earth', 'The Trusted', 'MOOKY'];
  
  for (const artist of artists) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Searching for ${artist}`);
    console.log('='.repeat(50));
    
    const feeds = await searchPublisherFeeds(artist);
    
    if (feeds.length === 0) {
      console.log(`No publisher feeds found for ${artist}`);
      continue;
    }
    
    console.log(`\nFound ${feeds.length} potential feed(s) for ${artist}:\n`);
    
    feeds.forEach((feed, index) => {
      console.log(`${index + 1}. ${feed.title}`);
      console.log(`   URL: ${feed.url}`);
      console.log(`   Author: ${feed.author || 'N/A'}`);
      console.log(`   Medium: ${feed.medium || 'N/A'}`);
      console.log(`   Item Count: ${feed.itemCount || 'N/A'}`);
      console.log(`   Categories: ${feed.categories ? Object.values(feed.categories).join(', ') : 'N/A'}`);
      
      // Check if this looks like a publisher feed (has multiple items)
      if (feed.itemCount > 1) {
        console.log(`   >>> POTENTIAL PUBLISHER FEED (${feed.itemCount} items)`);
      }
      console.log('');
    });
  }
}

main();