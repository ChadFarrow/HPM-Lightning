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

// Search for Circle the Earth feeds
async function fetchCircleTheEarthFeeds() {
  try {
    const headers = generateAuthHeaders();
    
    // Search for music feeds by Circle the Earth
    const searchUrl = `${API_URL}/search/music/byterm?q=circle+the+earth&max=20`;
    
    console.log('Fetching Circle the Earth feeds from Podcast Index...');
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.feeds || data.feeds.length === 0) {
      console.log('No feeds found. Trying regular search...');
      
      // Try regular search as fallback
      const regularSearchUrl = `${API_URL}/search/byterm?q=circle+the+earth&val=music&max=20`;
      const regularResponse = await fetch(regularSearchUrl, {
        method: 'GET',
        headers: generateAuthHeaders()
      });
      
      if (regularResponse.ok) {
        const regularData = await regularResponse.json();
        return regularData.feeds || [];
      }
    }
    
    return data.feeds || [];
  } catch (error) {
    console.error('Error fetching feeds:', error);
    return [];
  }
}

// Main function
async function main() {
  const feeds = await fetchCircleTheEarthFeeds();
  
  if (feeds.length === 0) {
    console.log('No feeds found for Circle the Earth');
    return;
  }
  
  console.log(`\nFound ${feeds.length} feed(s) from Circle the Earth:\n`);
  
  feeds.forEach((feed, index) => {
    console.log(`${index + 1}. ${feed.title}`);
    console.log(`   URL: ${feed.url}`);
    console.log(`   Author: ${feed.author || 'N/A'}`);
    console.log(`   Categories: ${feed.categories ? Object.values(feed.categories).join(', ') : 'N/A'}`);
    console.log(`   Value Enabled: ${feed.value ? 'Yes' : 'No'}`);
    console.log('');
  });
  
  // Create feed objects in our format
  console.log('\n=== Feed objects for feeds.json ===\n');
  feeds.forEach(feed => {
    const feedId = feed.title.toLowerCase()
      .replace(/circle the earth\s*-?\s*/i, 'circle-the-earth-')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const feedObj = {
      id: feedId,
      originalUrl: feed.url,
      type: "album",
      title: feed.title,
      priority: "core",
      status: "active",
      addedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    console.log(JSON.stringify(feedObj, null, 2) + ',');
  });
}

main();