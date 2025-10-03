#!/usr/bin/env node

/**
 * Script to generate complete mapping for all custom values found in feeds
 */

const fs = require('fs');
const path = require('path');

// Load analysis results
const analysisPath = path.join(__dirname, '..', 'data', 'other-payment-methods-analysis.json');
const analysisData = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));

// Load previous mapping
const existingMappingPath = path.join(__dirname, '..', 'data', 'lightning-recipients-mapping.json');
const existingMapping = JSON.parse(fs.readFileSync(existingMappingPath, 'utf8'));

console.log('🔧 Generating complete Lightning mapping for all custom values...\n');

// Mapping from CSV analysis
const csvMappings = {
  'x3VXZtbcfIBVLIUqzWKV': {
    nodeAddress: '03a2cb3058309f7a0355b9583fc4347d82b251ee94997aec4d4e5573b181a49657',
    lightningAddress: 'reflex.livewire.io',
    foundInMapping: true
  },
  '019YN1dx5XDHYbiEv4ZOyw': {
    nodeAddress: '03b6f613e88bd874177c28c6ad83b3baba43c4c656f56be1f8df84669556054b79',
    lightningAddress: 'thetrustedband@fountain.fm',
    foundInMapping: true
  },
  'aBpWlXR7oKOAYjr21Elk': {
    nodeAddress: '030a58b8653d32b99200a2334cfe913e51dc7d155aa0116c176657a4f1722677a3',
    lightningAddress: null, // Not found in mapping
    name: 'Phantom Power Media',
    foundInMapping: false
  },
  'N0HNqVxJkVxhBIWWTrFw': {
    nodeAddress: '030a58b8653d32b99200a2334cfe913e51dc7d155aa0116c176657a4f1722677a3',
    lightningAddress: null, // Not found in mapping
    name: 'The Velvicks',
    foundInMapping: false
  }
};

// Create comprehensive mapping
const completeMapping = {
  generated: new Date().toISOString(),
  description: "Complete Lightning payment recipient mapping for HPM site - all custom values",
  
  // Enhanced mapping: customValue -> Lightning address/details
  customValueToAddress: { ...existingMapping.customValueToAddress },
  
  // Node address to Lightning address mapping
  nodeToLightningAddress: { ...existingMapping.nodeToLightningAddress },
  
  // Custom key mapping (for additional validation)
  customKeyMapping: { ...existingMapping.customKeyMapping },
  
  // Recipient details by custom value
  recipientDetails: { ...existingMapping.recipientDetails },
  
  // Statistics
  statistics: {
    totalCustomValues: 0,
    totalNodeAddresses: 0,
    mappedCustomValues: 0,
    unmappedCustomValues: 0,
    feedCoverage: {}
  },
  
  // New section: unmapped custom values
  unmappedCustomValues: {}
};

// Add new mappings from analysis
Object.entries(csvMappings).forEach(([customValue, mapping]) => {
  // Add to custom value mapping
  if (!completeMapping.customValueToAddress[customValue]) {
    completeMapping.customValueToAddress[customValue] = [];
  }
  
  const feedsUsing = analysisData.customValues[customValue] || [];
  
  completeMapping.customValueToAddress[customValue].push({
    nodeAddress: mapping.nodeAddress,
    lightningAddress: mapping.lightningAddress,
    customKey: customValue === 'x3VXZtbcfIBVLIUqzWKV' ? '696969' : '906608', // From analysis
    occurrences: feedsUsing.length,
    foundInMapping: mapping.foundInMapping
  });
  
  // Add to node mapping if Lightning address exists
  if (mapping.lightningAddress) {
    completeMapping.nodeToLightningAddress[mapping.nodeAddress] = mapping.lightningAddress;
  }
  
  // Add recipient details
  completeMapping.recipientDetails[customValue] = {
    primaryAddress: mapping.lightningAddress,
    nodeAddress: mapping.nodeAddress,
    customKey: customValue === 'x3VXZtbcfIBVLIUqzWKV' ? '696969' : '906608',
    foundInMapping: mapping.foundInMapping,
    recipients: [{
      name: mapping.lightningAddress || mapping.name || 'Unknown',
      occurrences: feedsUsing.length,
      type: mapping.lightningAddress ? 'lightning-address' : 'label'
    }],
    feedDistribution: {}
  };
  
  // Count feed distribution by artist
  feedsUsing.forEach(feedTitle => {
    const artistMatch = feedTitle.match(/^([^-]+)/);
    const artist = artistMatch ? artistMatch[1].trim() : 'Unknown';
    
    if (!completeMapping.recipientDetails[customValue].feedDistribution[artist]) {
      completeMapping.recipientDetails[customValue].feedDistribution[artist] = 0;
    }
    completeMapping.recipientDetails[customValue].feedDistribution[artist]++;
  });
  
  // Track unmapped values
  if (!mapping.foundInMapping) {
    completeMapping.unmappedCustomValues[customValue] = {
      nodeAddress: mapping.nodeAddress,
      name: mapping.name,
      feedCount: feedsUsing.length,
      feeds: feedsUsing
    };
  }
});

// Update statistics
completeMapping.statistics.totalCustomValues = Object.keys(completeMapping.customValueToAddress).length;
completeMapping.statistics.totalNodeAddresses = Object.keys(completeMapping.nodeToLightningAddress).length;
completeMapping.statistics.mappedCustomValues = Object.keys(completeMapping.customValueToAddress).filter(
  cv => completeMapping.customValueToAddress[cv].some(m => m.lightningAddress)
).length;
completeMapping.statistics.unmappedCustomValues = Object.keys(completeMapping.unmappedCustomValues).length;

// Calculate coverage
const totalFeeds = 53; // From original analysis
const feedsWithCustomValues = 40 + analysisData.summary.totalAnalyzed; // All feeds have custom values
completeMapping.statistics.feedCoverage = {
  totalFeeds,
  feedsWithCustomValues,
  coveragePercentage: ((feedsWithCustomValues / totalFeeds) * 100).toFixed(1) + '%'
};

// Save the complete mapping
const outputPath = path.join(__dirname, '..', 'data', 'lightning-recipients-complete-mapping.json');
fs.writeFileSync(outputPath, JSON.stringify(completeMapping, null, 2));

console.log('✅ Complete Lightning mapping generated!\n');
console.log('📊 Summary:');
console.log(`   - Total custom values: ${completeMapping.statistics.totalCustomValues}`);
console.log(`   - Mapped to Lightning addresses: ${completeMapping.statistics.mappedCustomValues}`);
console.log(`   - Unmapped custom values: ${completeMapping.statistics.unmappedCustomValues}`);
console.log(`   - Total node addresses: ${completeMapping.statistics.totalNodeAddresses}`);
console.log(`   - Feed coverage: ${completeMapping.statistics.feedCoverage.coveragePercentage}`);

console.log('\n📋 CUSTOM VALUE BREAKDOWN:');
console.log('-'.repeat(80));

// Show breakdown by custom value
Object.entries(completeMapping.customValueToAddress).forEach(([customValue, mappings]) => {
  if (mappings && mappings.length > 0) {
    const mapping = mappings[0]; // Take first mapping
    const details = completeMapping.recipientDetails[customValue];
    
    console.log(`\n🏷️  ${customValue}`);
    console.log(`   Lightning Address: ${mapping?.lightningAddress || 'NOT MAPPED'}`);
    console.log(`   Node: ${mapping?.nodeAddress?.substring(0, 20)}...`);
    console.log(`   Custom Key: ${mapping?.customKey || 'N/A'}`);
    console.log(`   Feeds: ${mapping?.occurrences || 0}`);
    console.log(`   Found in Mapping: ${mapping?.foundInMapping ? '✅' : '❌'}`);
    
    if (details?.feedDistribution) {
      const artists = Object.keys(details.feedDistribution);
      if (artists.length > 0) {
        console.log(`   Artists: ${artists.join(', ')}`);
      }
    }
  }
});

console.log('\n❌ UNMAPPED CUSTOM VALUES (need Lightning addresses):');
console.log('-'.repeat(80));
Object.entries(completeMapping.unmappedCustomValues).forEach(([customValue, details]) => {
  console.log(`\n${customValue}`);
  console.log(`   Node: ${details.nodeAddress.substring(0, 20)}...`);
  console.log(`   Name: ${details.name}`);
  console.log(`   Used by ${details.feedCount} feeds`);
  console.log(`   Feeds: ${details.feeds.slice(0, 3).join(', ')}${details.feeds.length > 3 ? '...' : ''}`);
});

console.log(`\n💾 Complete mapping saved to: ${outputPath}`);

// Generate summary report
const summaryReport = {
  totalFeeds: 53,
  feedsAnalyzed: 53,
  customValueCoverage: {
    '01dor7UwNfuBgODLSMLmWT': {
      lightningAddress: 'bit_ish@fountain.fm',
      feeds: 40,
      artists: ['Circle the Earth', 'MOOKY', 'Hash Power Music', 'Cannabis Records', 'The Velvicks', 'The Retrograde', 'Kazuki Tokaji']
    },
    '019YN1dx5XDHYbiEv4ZOyw': {
      lightningAddress: 'thetrustedband@fountain.fm',
      feeds: 10,
      artists: ['The Trusted']
    },
    'x3VXZtbcfIBVLIUqzWKV': {
      lightningAddress: 'reflex.livewire.io',
      feeds: 13,
      artists: ['The Trusted', 'The Velvicks']
    },
    'aBpWlXR7oKOAYjr21Elk': {
      lightningAddress: null,
      name: 'Phantom Power Media',
      feeds: 8,
      artists: ['The Trusted']
    },
    'N0HNqVxJkVxhBIWWTrFw': {
      lightningAddress: null,
      name: 'The Velvicks',
      feeds: 3,
      artists: ['The Velvicks']
    }
  }
};

const summaryPath = path.join(__dirname, '..', 'data', 'custom-values-summary.json');
fs.writeFileSync(summaryPath, JSON.stringify(summaryReport, null, 2));
console.log(`📋 Summary report saved to: ${summaryPath}`);