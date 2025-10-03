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

// Search for The Velvicks
async function searchTheVelvicks() {
  try {
    const headers = generateAuthHeaders();

    const searchUrl = `${API_URL}/search/byterm?q=The%20Velvicks&max=50`;

    console.log('Searching for The Velvicks...');

    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const feeds = data.feeds || [];

    console.log(`Found ${feeds.length} feed(s) for The Velvicks:\n`);

    feeds.forEach((feed, index) => {
      console.log(`${index + 1}. ${feed.title}`);
      console.log(`   URL: ${feed.url}`);
      console.log(`   Author: ${feed.author || 'N/A'}`);
      console.log(`   Medium: ${feed.medium || 'N/A'}`);
      console.log(`   Item Count: ${feed.itemCount || 'N/A'}`);
      console.log(`   Categories: ${feed.categories ? Object.values(feed.categories).join(', ') : 'N/A'}`);
      console.log(`   Has Value Block: ${feed.value ? 'Yes' : 'No'}`);
      console.log('');
    });

    // Output JSON for further processing
    console.log('\nFull JSON data:');
    console.log(JSON.stringify(feeds, null, 2));
  } catch (error) {
    console.error('Error fetching feeds:', error);
  }
}

searchTheVelvicks();