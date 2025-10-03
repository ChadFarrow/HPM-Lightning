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

// Search for an artist
async function searchArtist(artistName) {
  try {
    const headers = generateAuthHeaders();
    const searchUrl = `${API_URL}/search/byterm?q=${encodeURIComponent(artistName)}&max=50`;

    console.log(`\n${'='.repeat(50)}`);
    console.log(`Searching for ${artistName}...`);
    console.log('='.repeat(50));

    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const feeds = data.feeds || [];

    // Filter for music feeds
    const musicFeeds = feeds.filter(feed =>
      feed.medium === 'music' ||
      (feed.categories && feed.categories['53']) // Music category
    );

    console.log(`Found ${musicFeeds.length} music feed(s) for ${artistName}:\n`);

    const feedData = [];
    musicFeeds.forEach((feed, index) => {
      console.log(`${index + 1}. ${feed.title}`);
      console.log(`   URL: ${feed.url}`);
      console.log(`   Author: ${feed.author || 'N/A'}`);
      console.log(`   Medium: ${feed.medium || 'N/A'}`);
      console.log('');

      feedData.push({
        title: feed.title,
        url: feed.url,
        author: feed.author || artistName,
        medium: feed.medium
      });
    });

    return feedData;
  } catch (error) {
    console.error(`Error fetching feeds for ${artistName}:`, error);
    return [];
  }
}

// Main function
async function main() {
  const artists = ['The Retrograde', 'Kazuki Tokaji'];
  const allFeeds = {};

  for (const artist of artists) {
    const feeds = await searchArtist(artist);
    allFeeds[artist] = feeds;
  }

  // Output summary
  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY - Feeds to Add:');
  console.log('='.repeat(50));

  for (const [artist, feeds] of Object.entries(allFeeds)) {
    if (feeds.length > 0) {
      console.log(`\n${artist}: ${feeds.length} album(s)`);
      feeds.forEach(feed => {
        console.log(`  - ${feed.title} (${feed.url})`);
      });
    }
  }
}

main();