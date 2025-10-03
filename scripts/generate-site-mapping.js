#!/usr/bin/env node

/**
 * Script to generate site mapping for custom values and Lightning addresses
 */

const fs = require('fs');
const path = require('path');

// Load consolidated data
const consolidatedPath = path.join(__dirname, '..', 'data', 'custom-value-matched-consolidated.json');
const consolidatedData = JSON.parse(fs.readFileSync(consolidatedPath, 'utf8'));

// Load fountain mapping
const fountainMappingPath = path.join(__dirname, '..', 'data', 'fountain-derived-mapping.json');
const fountainMapping = JSON.parse(fs.readFileSync(fountainMappingPath, 'utf8'));

console.log('🔧 Generating site mapping for Lightning payment recipients...\n');

// Create a comprehensive mapping for the site
const siteMapping = {
  // Metadata
  generated: new Date().toISOString(),
  description: "Lightning payment recipient mapping for HPM site",
  
  // Primary mapping: customValue -> Lightning address
  customValueToAddress: {},
  
  // Node address to Lightning address mapping
  nodeToLightningAddress: {},
  
  // Custom key mapping (for additional validation)
  customKeyMapping: {},
  
  // Recipient details by custom value
  recipientDetails: {},
  
  // Statistics
  statistics: {
    totalCustomValues: 0,
    totalNodeAddresses: 0,
    totalRecipients: 0,
    feedCoverage: {}
  }
};

// Process fountain mapping first
fountainMapping.markers.forEach(marker => {
  siteMapping.customValueToAddress[marker] = [];
  siteMapping.recipientDetails[marker] = {
    primaryAddress: null,
    recipients: []
  };
});

// Add node to Lightning address mapping
Object.entries(fountainMapping.map).forEach(([nodeAddress, lightningAddress]) => {
  siteMapping.nodeToLightningAddress[nodeAddress] = lightningAddress;
});

// Process consolidated data
const customValue = consolidatedData.customValue;
const nodeAddress = consolidatedData.nodeAddress;
const lightningAddress = consolidatedData.lightningAddress;
const customKey = consolidatedData.customKey;

// Add to custom value mapping
if (!siteMapping.customValueToAddress[customValue]) {
  siteMapping.customValueToAddress[customValue] = [];
}

siteMapping.customValueToAddress[customValue].push({
  nodeAddress,
  lightningAddress,
  customKey,
  occurrences: consolidatedData.statistics.totalOccurrences
});

// Add custom key mapping
siteMapping.customKeyMapping[customKey] = {
  customValue,
  nodeAddress,
  lightningAddress
};

// Add recipient details
siteMapping.recipientDetails[customValue] = {
  primaryAddress: lightningAddress,
  nodeAddress,
  customKey,
  recipients: consolidatedData.recipients.map(r => ({
    name: r.name,
    occurrences: r.occurrences,
    type: r.name.includes('@') ? 'lightning-address' : 'label'
  })),
  feedDistribution: {}
};

// Count feed distribution
Object.entries(consolidatedData.feedDetails).forEach(([feedTitle, details]) => {
  const artistMatch = feedTitle.match(/^([^-]+)/);
  const artist = artistMatch ? artistMatch[1].trim() : 'Unknown';
  
  if (!siteMapping.recipientDetails[customValue].feedDistribution[artist]) {
    siteMapping.recipientDetails[customValue].feedDistribution[artist] = 0;
  }
  siteMapping.recipientDetails[customValue].feedDistribution[artist]++;
});

// Update statistics
siteMapping.statistics.totalCustomValues = Object.keys(siteMapping.customValueToAddress).length;
siteMapping.statistics.totalNodeAddresses = Object.keys(siteMapping.nodeToLightningAddress).length;
siteMapping.statistics.totalRecipients = consolidatedData.recipients.length;
siteMapping.statistics.feedCoverage = {
  totalFeeds: consolidatedData.statistics.feedsProcessed,
  feedsWithCustomValue: consolidatedData.statistics.totalFeeds,
  coveragePercentage: ((consolidatedData.statistics.totalFeeds / consolidatedData.statistics.feedsProcessed) * 100).toFixed(1) + '%'
};

// Save the site mapping
const outputPath = path.join(__dirname, '..', 'data', 'lightning-recipients-mapping.json');
fs.writeFileSync(outputPath, JSON.stringify(siteMapping, null, 2));

console.log('✅ Site mapping generated successfully!\n');
console.log('📊 Summary:');
console.log(`   - Custom values mapped: ${siteMapping.statistics.totalCustomValues}`);
console.log(`   - Node addresses: ${siteMapping.statistics.totalNodeAddresses}`);
console.log(`   - Total recipients: ${siteMapping.statistics.totalRecipients}`);
console.log(`   - Feed coverage: ${siteMapping.statistics.feedCoverage.coveragePercentage}`);
console.log(`\n💾 Saved to: ${outputPath}`);

// Generate a TypeScript interface file for type safety
const tsInterface = `// Auto-generated Lightning recipient mapping types
// Generated: ${new Date().toISOString()}

export interface LightningRecipient {
  name: string;
  occurrences: number;
  type: 'lightning-address' | 'label';
}

export interface RecipientDetails {
  primaryAddress: string | null;
  nodeAddress?: string;
  customKey?: string;
  recipients: LightningRecipient[];
  feedDistribution: Record<string, number>;
}

export interface CustomValueMapping {
  nodeAddress: string;
  lightningAddress: string;
  customKey: string;
  occurrences: number;
}

export interface LightningRecipientsMapping {
  generated: string;
  description: string;
  customValueToAddress: Record<string, CustomValueMapping[]>;
  nodeToLightningAddress: Record<string, string>;
  customKeyMapping: Record<string, {
    customValue: string;
    nodeAddress: string;
    lightningAddress: string;
  }>;
  recipientDetails: Record<string, RecipientDetails>;
  statistics: {
    totalCustomValues: number;
    totalNodeAddresses: number;
    totalRecipients: number;
    feedCoverage: {
      totalFeeds: number;
      feedsWithCustomValue: number;
      coveragePercentage: string;
    };
  };
}
`;

const tsOutputPath = path.join(__dirname, '..', 'types', 'lightning-mapping.ts');
// Create types directory if it doesn't exist
const typesDir = path.join(__dirname, '..', 'types');
if (!fs.existsSync(typesDir)) {
  fs.mkdirSync(typesDir, { recursive: true });
}
fs.writeFileSync(tsOutputPath, tsInterface);
console.log(`📝 TypeScript types saved to: ${tsOutputPath}`);