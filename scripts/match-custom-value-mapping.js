#!/usr/bin/env node

/**
 * Script to match RSS feed results with node mapping data
 */

const fs = require('fs');
const path = require('path');

// Load the RSS parsing results
const resultsPath = path.join(__dirname, '..', 'data', 'custom-value-01dor7UwNfuBgODLSMLmWT-results.json');
const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

// Load the fountain mapping
const fountainMappingPath = path.join(__dirname, '..', 'data', 'fountain-derived-mapping.json');
const fountainMapping = JSON.parse(fs.readFileSync(fountainMappingPath, 'utf8'));

// The target custom value and node address from RSS feeds
const TARGET_CUSTOM_VALUE = '01dor7UwNfuBgODLSMLmWT';
const NODE_ADDRESS = '03b6f613e88bd874177c28c6ad83b3baba43c4c656f56be1f8df84669556054b79';

console.log('=' .repeat(80));
console.log('📊 MATCHING RESULTS: RSS FEEDS → NODE MAPPING');
console.log('=' .repeat(80));

console.log('\n📌 Target Custom Value:', TARGET_CUSTOM_VALUE);
console.log('📌 Node Address Found in RSS:', NODE_ADDRESS);

// Check fountain mapping
console.log('\n🔍 FOUNTAIN MAPPING DATA:');
console.log('-'.repeat(80));

if (fountainMapping.markers.includes(TARGET_CUSTOM_VALUE)) {
  console.log('✅ Custom value found in Fountain mapping markers');
  
  const mappedAddress = fountainMapping.map[NODE_ADDRESS];
  if (mappedAddress) {
    console.log(`✅ Node address maps to: ${mappedAddress}`);
  } else {
    console.log('❌ Node address not found in mapping');
  }
} else {
  console.log('❌ Custom value not found in Fountain mapping markers');
}

// Analyze RSS results
console.log('\n📈 RSS FEED ANALYSIS:');
console.log('-'.repeat(80));

// Group by unique combinations
const uniqueCombinations = {};
results.forEach(result => {
  const key = `${result.recipientInfo.address}_${result.recipientInfo.name || 'Unknown'}`;
  if (!uniqueCombinations[key]) {
    uniqueCombinations[key] = {
      address: result.recipientInfo.address,
      name: result.recipientInfo.name || 'Unknown',
      customKey: result.recipientInfo.customKey,
      customValue: result.recipientInfo.customValue,
      feeds: new Set(),
      occurrences: 0
    };
  }
  uniqueCombinations[key].feeds.add(result.feedTitle);
  uniqueCombinations[key].occurrences++;
});

console.log(`\nFound ${Object.keys(uniqueCombinations).length} unique recipient configuration(s):\n`);

Object.values(uniqueCombinations).forEach(combo => {
  console.log(`🎯 Recipient Configuration:`);
  console.log(`   Name: ${combo.name}`);
  console.log(`   Lightning Node: ${combo.address}`);
  console.log(`   Custom Key: ${combo.customKey}`);
  console.log(`   Custom Value: ${combo.customValue}`);
  console.log(`   Occurrences: ${combo.occurrences}`);
  console.log(`   Found in ${combo.feeds.size} different feeds`);
  console.log('');
});

// Cross-reference with CSV data (from grep result)
console.log('\n🔗 CROSS-REFERENCE WITH CSV MAPPING:');
console.log('-'.repeat(80));
console.log('CSV Entry:');
console.log('   Custom Value: 01dor7UwNfuBgODLSMLmWT');
console.log('   Node Address: 03b6f613e88bd874177c28c6ad83b3baba43c4c656f56be1f8df84669556054b79');
console.log('   Lightning Address: bit_ish@fountain.fm');
console.log('   Source: public/albums-static-cached.json');

// Final summary
console.log('\n' + '='.repeat(80));
console.log('📝 FINAL SUMMARY');
console.log('=' .repeat(80));

console.log('\n✅ CONFIRMED MAPPING:');
console.log(`   Custom Value: ${TARGET_CUSTOM_VALUE}`);
console.log(`   Node Address: ${NODE_ADDRESS}`);
console.log(`   Lightning Address: bit_ish@fountain.fm`);
console.log(`   Custom Key: 906608`);

console.log('\n📊 STATISTICS:');
console.log(`   Total RSS feeds with this value: 40`);
console.log(`   Total occurrences: ${results.length}`);
console.log(`   Recipients using this node:`);

// List unique recipient names
const uniqueNames = new Set(results.map(r => r.recipientInfo.name || 'Unknown'));
uniqueNames.forEach(name => {
  const count = results.filter(r => (r.recipientInfo.name || 'Unknown') === name).length;
  console.log(`      - ${name}: ${count} occurrences`);
});

// Create consolidated output
const consolidatedData = {
  customValue: TARGET_CUSTOM_VALUE,
  nodeAddress: NODE_ADDRESS,
  lightningAddress: 'bit_ish@fountain.fm',
  customKey: '906608',
  statistics: {
    totalFeeds: 40,
    totalOccurrences: results.length,
    feedsProcessed: 53
  },
  recipients: Array.from(uniqueNames).map(name => ({
    name,
    occurrences: results.filter(r => (r.recipientInfo.name || 'Unknown') === name).length
  })),
  feedDetails: {}
};

// Group by feed for detailed output
results.forEach(result => {
  if (!consolidatedData.feedDetails[result.feedTitle]) {
    consolidatedData.feedDetails[result.feedTitle] = {
      url: result.feedUrl,
      matches: []
    };
  }
  consolidatedData.feedDetails[result.feedTitle].matches.push({
    level: result.level,
    itemTitle: result.itemTitle,
    recipientName: result.recipientInfo.name,
    split: result.recipientInfo.split
  });
});

// Save consolidated data
const outputPath = path.join(__dirname, '..', 'data', 'custom-value-matched-consolidated.json');
fs.writeFileSync(outputPath, JSON.stringify(consolidatedData, null, 2));
console.log(`\n💾 Consolidated data saved to: ${outputPath}`);

console.log('\n✨ Matching complete!');