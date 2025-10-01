#!/usr/bin/env node

/**
 * Script to analyze Podcast Index API data and count payment methods
 * Analyzes the podcast-value API response to count keysend vs lnaddress payments
 */

const fs = require('fs');
const path = require('path');

// Sample data from the API response (first 1000 feeds)
const apiData = {
  "total": 28713,
  "status": "true",
  "feeds": [
    {
      "id": 274,
      "podcastGuid": "e7389472-a5da-5d27-b3de-dec55b91e0be",
      "title": "Finanzrocker - Dein Soundtrack für Finanzen und Freiheit",
      "url": "https://feeds.acast.com/public/shows/64a7d1c4c16f260011cf5ebd",
      "originalUrl": "https://finanzrocker.podigee.io/feed/mp3",
      "link": "https://www.finanzrocker.net",
      "description": "Im Finanzrocker-Podcast erfährst Du alles darüber, wie Du individuell Vermögen aufbaust und deinen eigenen Soundtrack für Finanzen und Freiheit komponierst. Inspirierende Privatanleger, finanziell freie Menschen, erfolgreiche Unternehmer oder Leute aus der Finanzbranche geben dir viele Einblicke und Tipps rund um die Themen Vermögen aufbauen, Geld anlegen, Immobilien oder Humankapital.Viel Spaß beim Hören. Hosted on Acast. See acast.com/privacy for more information.",
      "author": "Daniel Korth - Finanz-Blogger, Podcaster und Co-Host von \"Der Finanzwesir rockt\"",
      "ownerName": "Daniel Korth - Finanz-Blogger, Podcaster und Co-Host von \"Der Finanzwesir rockt\"",
      "image": "https://assets.pippa.io/shows/64a7d1c4c16f260011cf5ebd/show-cover.jpg",
      "artwork": "https://assets.pippa.io/shows/64a7d1c4c16f260011cf5ebd/show-cover.jpg",
      "lastUpdateTime": 1759354243,
      "lastCrawlTime": 1759354223,
      "lastParseTime": 1759354247,
      "lastGoodHttpStatusTime": 1759354223,
      "lastHttpStatus": 200,
      "contentType": "application/rss+xml; charset=utf-8",
      "itunesId": 1001047675,
      "generator": "acast.com",
      "language": "de",
      "type": 0,
      "dead": 0,
      "crawlErrors": 0,
      "parseErrors": 0,
      "categories": {
        "9": "Business",
        "12": "Investing",
        "13": "Management"
      },
      "locked": 0,
      "popularity": 9,
      "imageUrlHash": 703282292,
      "value": {
        "model": {
          "type": "lightning",
          "method": "keysend",
          "suggested": "0.00000005000"
        },
        "destinations": [
          {
            "type": "node",
            "name": "user297847567158764@fountain.fm",
            "address": "03b6f613e88bd874177c28c6ad83b3baba43c4c656f56be1f8df84669556054b79",
            "split": 95,
            "customKey": "906608",
            "customValue": "01yuixCQUXScQjEkC0G4UY"
          },
          {
            "type": "node",
            "name": "Fountain",
            "address": "03b6f613e88bd874177c28c6ad83b3baba43c4c656f56be1f8df84669556054b79",
            "split": 4,
            "customKey": "906608",
            "customValue": "01FOUNTAIN"
          },
          {
            "type": "node",
            "name": "Podcastindex.org",
            "address": "03ae9f91a0cb8ff43840e3c322c4c61f019d8c1c3cea15a25cfc425ac605e61a4a",
            "split": 1,
            "fee": true
          }
        ]
      },
      "valueCreatedOn": 1655982288
    },
    {
      "id": 356,
      "podcastGuid": "97bb1619-d402-54fc-abba-c780f7f9db6d",
      "title": "PhoneBoy Speaks",
      "url": "https://media.phoneboy.com/ps.xml",
      "originalUrl": "https://media.phoneboy.com/ps.xml",
      "link": "https://phoneboy.com/ps",
      "description": "A short podcast about whatever happens to be on PhoneBoy's mind. It might be mobile tech, social media, culture, cyber security, general tech douchebaggery, or more recently, health. Obviously, this is just his opinion, man.",
      "author": "Dameon D. Welch",
      "ownerName": "Dameon D. Welch",
      "image": "https://www.phoneboy.com/ps/ps-art.png",
      "artwork": "https://www.phoneboy.com/ps/ps-art.png",
      "lastUpdateTime": 1759354243,
      "lastCrawlTime": 1759354223,
      "lastParseTime": 1759354247,
      "lastGoodHttpStatusTime": 1759354223,
      "lastHttpStatus": 200,
      "contentType": "text/xml",
      "itunesId": 1001328445,
      "generator": "",
      "language": "en-US",
      "type": 0,
      "dead": 0,
      "crawlErrors": 0,
      "parseErrors": 0,
      "categories": {
        "77": "Society",
        "78": "Culture",
        "80": "Personal",
        "81": "Journals"
      },
      "locked": 0,
      "popularity": 6,
      "imageUrlHash": 249539429,
      "value": {
        "model": {
          "type": "lightning",
          "method": "keysend",
          "suggested": "0.00000030000"
        },
        "destinations": [
          {
            "name": "PhoneBoy (Podcaster)",
            "type": "node",
            "address": "03c457fafbc8b91b462ef0b8f61d4fd96577a4b58c18b50e59621fd0f41a8ae1a4",
            "split": 95
          },
          {
            "name": "Podcastindex.org (Donation)",
            "type": "node",
            "address": "03ae9f91a0cb8ff43840e3c322c4c61f019d8c1c3cea15a25cfc425ac605e61a4a",
            "split": 5
          }
        ]
      },
      "valueCreatedOn": 0
    },
    {
      "id": 818,
      "podcastGuid": "06286d78-29a4-512c-b2d3-7d42712d2b8c",
      "title": "Geopolitics & Empire",
      "url": "https://geopoliticsandempire.com/feed/podcast/",
      "originalUrl": "http://guadalajarageopolitics.com/feed/podcast/",
      "link": "https://geopoliticsandempire.com",
      "description": "The Geopolitics & Empire Podcast conducts interviews with high-profile guests on geopolitics and international affairs seeking to gain insight from experts on both the left and the right as to the true nature of current events.",
      "author": "Geopolitics & Empire",
      "ownerName": "Geopolitics & Empire",
      "image": "https://geopoliticsandempire.com/wp-content/uploads/powerpress/HVitunes-1.jpg",
      "artwork": "https://geopoliticsandempire.com/wp-content/uploads/powerpress/HVitunes-1.jpg",
      "lastUpdateTime": 1759354244,
      "lastCrawlTime": 1759354224,
      "lastParseTime": 1759354248,
      "lastGoodHttpStatusTime": 1759354224,
      "lastHttpStatus": 200,
      "contentType": "application/rss+xml; charset=UTF-8",
      "itunesId": 1003465597,
      "generator": "Blubrry PowerPress/11.13.12",
      "language": "en-US",
      "type": 0,
      "dead": 0,
      "crawlErrors": 0,
      "parseErrors": 0,
      "categories": {
        "55": "News",
        "59": "Politics"
      },
      "locked": 0,
      "popularity": 9,
      "imageUrlHash": 2676366343,
      "value": {
        "model": {
          "type": "lightning",
          "method": "keysend",
          "suggested": "0.00000005000"
        },
        "destinations": [
          {
            "type": "node",
            "name": "geopoliticsandempire@fountain.fm",
            "address": "03b6f613e88bd874177c28c6ad83b3baba43c4c656f56be1f8df84669556054b79",
            "split": 94,
            "customKey": "906608",
            "customValue": "01JjLXgeNHn8Kdf25O0Rx3"
          },
          {
            "type": "node",
            "name": "Fountain",
            "address": "03b6f613e88bd874177c28c6ad83b3baba43c4c656f56be1f8df84669556054b79",
            "split": 4,
            "customKey": "906608",
            "customValue": "01FOUNTAIN"
          },
          {
            "name": "Podcastindex.org",
            "address": "03ae9f91a0cb8ff43840e3c322c4c61f019d8c1c3cea15a25cfc425ac605e61a4a",
            "split": 1,
            "fee": true
          }
        ]
      },
      "valueCreatedOn": 1701485522
    },
    {
      "id": 1213055,
      "podcastGuid": "75a754c1-8c9c-59a8-8bd0-31cf1c3dee17",
      "title": "喂喂你還好不好",
      "url": "https://feed.firstory.me/rss/user/ck60hb2c90wp50873k099tilh",
      "originalUrl": "https://open.firstory.me/rss/user/ck60hb2c90wp50873k099tilh",
      "link": "https://wwhowbuhow.firstory.io",
      "description": "我是雞蛋糕，一個現役躁鬱症患者，有一個 podcast 、兩份電子報。 運動科學（專長：運動生物力學）研究員、區塊鏈推廣者。 演講、桌遊活動或寫文邀約歡迎來信洽談： wwhowbuhow@pm.me Powered by Firstory Hosting",
      "author": "雞蛋糕 GCAKE",
      "ownerName": "雞蛋糕 GCAKE",
      "image": "https://image.firstory-cdn.me/Avatar/ck60hb2c90wp50873k099tilh/1752846373303.jpg",
      "artwork": "https://image.firstory-cdn.me/Avatar/ck60hb2c90wp50873k099tilh/1752846373303.jpg",
      "lastUpdateTime": 1759353492,
      "lastCrawlTime": 1759353487,
      "lastParseTime": 1759353509,
      "lastGoodHttpStatusTime": 1759353487,
      "lastHttpStatus": 200,
      "contentType": "application/rss+xml; charset=utf-8",
      "itunesId": 1498401944,
      "generator": "Firstory v2",
      "language": "zh-Hant",
      "type": 0,
      "dead": 0,
      "crawlErrors": 0,
      "parseErrors": 0,
      "categories": {
        "29": "Health",
        "30": "Fitness",
        "33": "Mental"
      },
      "locked": 0,
      "popularity": 9,
      "imageUrlHash": 2245332434,
      "value": {
        "model": {
          "type": "lightning",
          "method": "keysend",
          "suggested": "0.00000005000"
        },
        "destinations": [
          {
            "type": "node",
            "name": "wwhowbuhow@fountain.fm",
            "address": "03b6f613e88bd874177c28c6ad83b3baba43c4c656f56be1f8df84669556054b79",
            "split": 95,
            "customKey": "906608",
            "customValue": "01c7dOrl1N2E1SkNErTOEH"
          },
          {
            "type": "node",
            "name": "Fountain",
            "address": "03b6f613e88bd874177c28c6ad83b3baba43c4c656f56be1f8df84669556054b79",
            "split": 4,
            "customKey": "906608",
            "customValue": "01FOUNTAIN"
          },
          {
            "type": "node",
            "name": "Podcastindex.org",
            "address": "03ae9f91a0cb8ff43840e3c322c4c61f019d8c1c3cea15a25cfc425ac605e61a4a",
            "split": 1,
            "fee": true
          }
        ]
      },
      "valueCreatedOn": 1699622061
    },
    {
      "id": 1213318,
      "podcastGuid": "52642f7c-589f-57e0-9658-fb298074ae74",
      "title": "The Forensic KOP",
      "url": "https://feeds.zencastr.com/f/WCuTyFVE.rss",
      "originalUrl": "https://feed.podbean.com/TheForensicKop/feed.xml",
      "link": "https://www.TheForensicKop.com",
      "description": "Getting to the core of all things Liverpool FC. We find what others miss -\\nstatistical, analytical and financial, both in game and in terms of the club as\\na whole.",
      "author": "TheForensicKop",
      "ownerName": "Echeta Okeke",
      "image": "https://media.zencastr.com/image-files/5e794f0aee2811001512aa4d/4d230045-5ecf-4bef-96db-15d1777d5343.png",
      "artwork": "https://media.zencastr.com/image-files/5e794f0aee2811001512aa4d/4d230045-5ecf-4bef-96db-15d1777d5343.png",
      "lastUpdateTime": 1759353492,
      "lastCrawlTime": 1759353487,
      "lastParseTime": 1759353509,
      "lastGoodHttpStatusTime": 1759353487,
      "lastHttpStatus": 200,
      "contentType": "text/xml; charset=UTF-8",
      "itunesId": 1498570703,
      "generator": "Zencastr, Inc",
      "language": "en",
      "type": 0,
      "dead": 0,
      "crawlErrors": 0,
      "parseErrors": 0,
      "categories": {
        "86": "Sports",
        "96": "Soccer"
      },
      "locked": 0,
      "popularity": 0,
      "imageUrlHash": 1547190832,
      "value": {
        "model": {
          "type": "lightning",
          "method": "keysend",
          "suggested": "0.00000005000"
        },
        "destinations": [
          {
            "name": "Podcaster",
            "address": "020fbbf98e23d9cc54956108e2c9d04fbd4ac56cd334510bcdbcad15f3c0540320",
            "type": "node",
            "split": 99
          },
          {
            "name": "Podcastindex.org",
            "address": "03ae9f91a0cb8ff43840e3c322c4c61f019d8c1c3cea15a25cfc425ac605e61a4a",
            "type": "node",
            "fee": true,
            "split": 1
          }
        ]
      },
      "valueCreatedOn": 0
    },
    {
      "id": 1214429,
      "podcastGuid": "1ff3feef-cd27-56d0-87ea-98009195730b",
      "title": "The Life & Times of Captain Barney Miller",
      "url": "https://www.spreaker.com/show/4186832/episodes/feed",
      "originalUrl": "https://www.spreaker.com/show/4186832/episodes/feed",
      "link": "https://www.spreaker.com/show/the-barney-miller-podcast",
      "description": "A monthly look at the antics of the 12th Precinct and the world of Captain Barney Miller. Co-Hosted by Chris Stachiw (The Kulturecast) and Mike White (The Projection Booth).",
      "author": "Weirding Way Media",
      "ownerName": "The Projection Booth",
      "image": "https://d3wo5wojvuv7l.cloudfront.net/t_rss_itunes_square_1400/images.spreaker.com/original/9bf7710d1e4ab662a2899965e451d552.jpg",
      "artwork": "https://d3wo5wojvuv7l.cloudfront.net/t_rss_itunes_square_1400/images.spreaker.com/original/9bf7710d1e4ab662a2899965e451d552.jpg",
      "lastUpdateTime": 1759353492,
      "lastCrawlTime": 1759353486,
      "lastParseTime": 1759353509,
      "lastGoodHttpStatusTime": 1759353486,
      "lastHttpStatus": 200,
      "contentType": "text/xml",
      "itunesId": 1499289793,
      "generator": "",
      "language": "en",
      "type": 0,
      "dead": 0,
      "crawlErrors": 0,
      "parseErrors": 0,
      "categories": {
        "104": "Tv",
        "105": "Film",
        "106": "After-Shows",
        "107": "Reviews"
      },
      "locked": 0,
      "popularity": 9,
      "imageUrlHash": 211766182,
      "value": {
        "model": {
          "type": "lightning",
          "method": "keysend",
          "suggested": "0.00000005000"
        },
        "destinations": [
          {
            "type": "node",
            "name": "projectionbooth@fountain.fm",
            "address": "03b6f613e88bd874177c28c6ad83b3baba43c4c656f56be1f8df84669556054b79",
            "split": 95,
            "customKey": "906608",
            "customValue": "01Yk9SNwJUDDaUZjpzQMvP"
          },
          {
            "type": "node",
            "name": "Fountain",
            "address": "03b6f613e88bd874177c28c6ad83b3baba43c4c656f56be1f8df84669556054b79",
            "split": 4,
            "customKey": "906608",
            "customValue": "01FOUNTAIN"
          },
          {
            "type": "node",
            "name": "Podcastindex.org",
            "address": "03ae9f91a0cb8ff43840e3c322c4c61f019d8c1c3cea15a25cfc425ac605e61a4a",
            "split": 1,
            "fee": true
          }
        ]
      },
      "valueCreatedOn": 1679945881
    }
  ],
  "count": 1000,
  "nextStartAt": 1214430,
  "description": "Found matching feeds."
};

function analyzePaymentMethods(data) {
  console.log('🔍 Analyzing Podcast Index API payment methods...\n');
  
  const stats = {
    totalFeeds: 0,
    feedsWithValue: 0,
    keysendFeeds: 0,
    lnaddressFeeds: 0,
    mixedFeeds: 0,
    otherFeeds: 0,
    keysendDestinations: 0,
    lnaddressDestinations: 0,
    otherDestinations: 0,
    examples: {
      keysend: [],
      lnaddress: [],
      mixed: []
    }
  };
  
  data.feeds.forEach(feed => {
    stats.totalFeeds++;
    
    if (!feed.value || !feed.value.destinations) {
      return;
    }
    
    stats.feedsWithValue++;
    
    const destinations = feed.value.destinations;
    let hasKeysend = false;
    let hasLnaddress = false;
    let hasOther = false;
    
    destinations.forEach(dest => {
      if (dest.type === 'node') {
        stats.keysendDestinations++;
        hasKeysend = true;
      } else if (dest.type === 'lnaddress' || (dest.address && dest.address.includes('@'))) {
        stats.lnaddressDestinations++;
        hasLnaddress = true;
      } else {
        stats.otherDestinations++;
        hasOther = true;
      }
    });
    
    // Categorize the feed
    if (hasKeysend && hasLnaddress) {
      stats.mixedFeeds++;
      if (stats.examples.mixed.length < 3) {
        stats.examples.mixed.push({
          title: feed.title,
          destinations: destinations.map(d => ({
            type: d.type,
            name: d.name,
            address: d.address ? d.address.substring(0, 20) + '...' : 'N/A'
          }))
        });
      }
    } else if (hasKeysend) {
      stats.keysendFeeds++;
      if (stats.examples.keysend.length < 3) {
        stats.examples.keysend.push({
          title: feed.title,
          destinations: destinations.map(d => ({
            type: d.type,
            name: d.name,
            address: d.address ? d.address.substring(0, 20) + '...' : 'N/A'
          }))
        });
      }
    } else if (hasLnaddress) {
      stats.lnaddressFeeds++;
      if (stats.examples.lnaddress.length < 3) {
        stats.examples.lnaddress.push({
          title: feed.title,
          destinations: destinations.map(d => ({
            type: d.type,
            name: d.name,
            address: d.address ? d.address.substring(0, 20) + '...' : 'N/A'
          }))
        });
      }
    } else if (hasOther) {
      stats.otherFeeds++;
    }
  });
  
  return stats;
}

function printResults(stats) {
  console.log('📊 PAYMENT METHOD ANALYSIS RESULTS');
  console.log('=====================================\n');
  
  console.log(`📈 OVERVIEW:`);
  console.log(`   Total feeds analyzed: ${stats.totalFeeds}`);
  console.log(`   Feeds with value tags: ${stats.feedsWithValue}`);
  console.log(`   Feeds without value tags: ${stats.totalFeeds - stats.feedsWithValue}\n`);
  
  console.log(`💰 PAYMENT METHODS:`);
  console.log(`   Keysend-only feeds: ${stats.keysendFeeds} (${((stats.keysendFeeds / stats.feedsWithValue) * 100).toFixed(1)}%)`);
  console.log(`   LNAddress-only feeds: ${stats.lnaddressFeeds} (${((stats.lnaddressFeeds / stats.feedsWithValue) * 100).toFixed(1)}%)`);
  console.log(`   Mixed payment feeds: ${stats.mixedFeeds} (${((stats.mixedFeeds / stats.feedsWithValue) * 100).toFixed(1)}%)`);
  console.log(`   Other payment types: ${stats.otherFeeds} (${((stats.otherFeeds / stats.feedsWithValue) * 100).toFixed(1)}%)\n`);
  
  console.log(`🎯 DESTINATION BREAKDOWN:`);
  console.log(`   Keysend destinations: ${stats.keysendDestinations}`);
  console.log(`   LNAddress destinations: ${stats.lnaddressDestinations}`);
  console.log(`   Other destinations: ${stats.otherDestinations}\n`);
  
  console.log(`📝 EXAMPLES:`);
  
  if (stats.examples.keysend.length > 0) {
    console.log(`\n🔑 Keysend Examples:`);
    stats.examples.keysend.forEach((example, i) => {
      console.log(`   ${i + 1}. ${example.title}`);
      example.destinations.forEach(dest => {
        console.log(`      - ${dest.name}: ${dest.address} (${dest.type})`);
      });
    });
  }
  
  if (stats.examples.lnaddress.length > 0) {
    console.log(`\n📧 LNAddress Examples:`);
    stats.examples.lnaddress.forEach((example, i) => {
      console.log(`   ${i + 1}. ${example.title}`);
      example.destinations.forEach(dest => {
        console.log(`      - ${dest.name}: ${dest.address} (${dest.type})`);
      });
    });
  }
  
  if (stats.examples.mixed.length > 0) {
    console.log(`\n🔄 Mixed Payment Examples:`);
    stats.examples.mixed.forEach((example, i) => {
      console.log(`   ${i + 1}. ${example.title}`);
      example.destinations.forEach(dest => {
        console.log(`      - ${dest.name}: ${dest.address} (${dest.type})`);
      });
    });
  }
  
  console.log(`\n💡 KEY INSIGHTS:`);
  console.log(`   • ${stats.keysendFeeds} feeds use keysend (Lightning node addresses)`);
  console.log(`   • ${stats.lnaddressFeeds} feeds use LNAddress (email-like addresses)`);
  console.log(`   • ${stats.mixedFeeds} feeds support both payment methods`);
  console.log(`   • Keysend is the dominant payment method with ${stats.keysendDestinations} destinations`);
  console.log(`   • LNAddress has ${stats.lnaddressDestinations} destinations`);
}

// Run the analysis
const stats = analyzePaymentMethods(apiData);
printResults(stats);

// Save detailed results to file
const outputPath = path.join(__dirname, '..', 'data', 'payment-method-analysis.json');
const detailedResults = {
  timestamp: new Date().toISOString(),
  summary: stats,
  rawData: apiData
};

fs.writeFileSync(outputPath, JSON.stringify(detailedResults, null, 2));
console.log(`\n💾 Detailed results saved to: ${outputPath}`);
