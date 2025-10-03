#!/usr/bin/env node

/**
 * Script to analyze payment methods in feeds that don't use customValue="01dor7UwNfuBgODLSMLmWT"
 */

const fs = require('fs');
const path = require('path');
const { DOMParser } = require('@xmldom/xmldom');

const TARGET_CUSTOM_VALUE = '01dor7UwNfuBgODLSMLmWT';

// Load feeds from feeds.json
const feedsPath = path.join(__dirname, '..', 'data', 'feeds.json');
const feedsData = JSON.parse(fs.readFileSync(feedsPath, 'utf8'));

// Load results from previous analysis
const resultsPath = path.join(__dirname, '..', 'data', 'custom-value-01dor7UwNfuBgODLSMLmWT-results.json');
const targetResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

// Get list of feeds that have the target custom value
const feedsWithTarget = new Set(targetResults.map(r => r.feedTitle));

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

function analyzeFeedPayments(xmlText, feedUrl, feedTitle) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  
  const analysis = {
    feedUrl,
    feedTitle,
    hasValue: false,
    valueType: null,
    valueMethod: null,
    recipients: [],
    customValues: new Set(),
    customKeys: new Set(),
    addresses: new Set(),
    recipientNames: new Set(),
    funding: [],
    errorNotes: []
  };
  
  // Check for parsing errors
  const parserError = xmlDoc.getElementsByTagName('parsererror')[0];
  if (parserError) {
    analysis.errorNotes.push('XML parsing error');
    return analysis;
  }
  
  // Get channel info
  const channels = xmlDoc.getElementsByTagName('channel');
  if (!channels || channels.length === 0) {
    analysis.errorNotes.push('No channel found');
    return analysis;
  }
  const channel = channels[0];
  
  // Check for funding links
  const fundingElements = [
    ...Array.from(channel.getElementsByTagName('podcast:funding')),
    ...Array.from(channel.getElementsByTagName('funding'))
  ];
  
  fundingElements.forEach(funding => {
    const url = funding.getAttribute('url') || funding.textContent?.trim();
    if (url) {
      analysis.funding.push(url);
    }
  });
  
  // Analyze channel-level podcast:value
  const channelValueElements = [
    ...Array.from(channel.getElementsByTagName('podcast:value')),
    ...Array.from(channel.getElementsByTagName('value'))
  ];
  
  if (channelValueElements.length > 0) {
    analysis.hasValue = true;
    const valueElement = channelValueElements[0];
    analysis.valueType = valueElement.getAttribute('type');
    analysis.valueMethod = valueElement.getAttribute('method');
    
    const recipients = [
      ...Array.from(valueElement.getElementsByTagName('podcast:valueRecipient')),
      ...Array.from(valueElement.getElementsByTagName('valueRecipient'))
    ];
    
    recipients.forEach(recipient => {
      const recipientData = {
        type: recipient.getAttribute('type'),
        address: recipient.getAttribute('address'),
        split: recipient.getAttribute('split'),
        name: recipient.getAttribute('name'),
        customKey: recipient.getAttribute('customKey'),
        customValue: recipient.getAttribute('customValue'),
        fee: recipient.getAttribute('fee')
      };
      
      analysis.recipients.push(recipientData);
      
      if (recipientData.customValue) {
        analysis.customValues.add(recipientData.customValue);
      }
      if (recipientData.customKey) {
        analysis.customKeys.add(recipientData.customKey);
      }
      if (recipientData.address) {
        analysis.addresses.add(recipientData.address);
      }
      if (recipientData.name) {
        analysis.recipientNames.add(recipientData.name);
      }
    });
  }
  
  // Also check item-level values
  const items = xmlDoc.getElementsByTagName('item');
  Array.from(items).forEach(item => {
    const itemValueElements = [
      ...Array.from(item.getElementsByTagName('podcast:value')),
      ...Array.from(item.getElementsByTagName('value'))
    ];
    
    itemValueElements.forEach(valueElement => {
      if (!analysis.hasValue) {
        analysis.hasValue = true;
        analysis.valueType = valueElement.getAttribute('type');
        analysis.valueMethod = valueElement.getAttribute('method');
      }
      
      const recipients = [
        ...Array.from(valueElement.getElementsByTagName('podcast:valueRecipient')),
        ...Array.from(valueElement.getElementsByTagName('valueRecipient'))
      ];
      
      recipients.forEach(recipient => {
        const customValue = recipient.getAttribute('customValue');
        const customKey = recipient.getAttribute('customKey');
        const address = recipient.getAttribute('address');
        const name = recipient.getAttribute('name');
        
        if (customValue) analysis.customValues.add(customValue);
        if (customKey) analysis.customKeys.add(customKey);
        if (address) analysis.addresses.add(address);
        if (name) analysis.recipientNames.add(name);
      });
    });
  });
  
  // Convert Sets to Arrays for JSON serialization
  analysis.customValues = Array.from(analysis.customValues);
  analysis.customKeys = Array.from(analysis.customKeys);
  analysis.addresses = Array.from(analysis.addresses);
  analysis.recipientNames = Array.from(analysis.recipientNames);
  
  return analysis;
}

async function main() {
  console.log(`\n🔍 Analyzing payment methods in feeds WITHOUT customValue="${TARGET_CUSTOM_VALUE}"...\n`);
  
  const feedsWithoutTarget = feedsData.feeds.filter(feed => 
    feed.status === 'active' && !feedsWithTarget.has(feed.title)
  );
  
  console.log(`Found ${feedsWithoutTarget.length} feeds without the target custom value\n`);
  
  const allAnalysis = [];
  
  for (const feed of feedsWithoutTarget) {
    const xmlText = await fetchFeed(feed.originalUrl);
    if (xmlText) {
      const analysis = analyzeFeedPayments(xmlText, feed.originalUrl, feed.title);
      allAnalysis.push(analysis);
      
      if (analysis.hasValue) {
        console.log(`✅ ${feed.title}: HAS podcast:value`);
        if (analysis.customValues.length > 0) {
          console.log(`   Custom Values: ${analysis.customValues.join(', ')}`);
        }
      } else if (analysis.funding.length > 0) {
        console.log(`💰 ${feed.title}: Funding links only`);
      } else {
        console.log(`❌ ${feed.title}: NO payment info`);
      }
    }
  }
  
  // Analyze results
  console.log('\n' + '='.repeat(80));
  console.log(`📊 ANALYSIS SUMMARY`);
  console.log('='.repeat(80));
  
  const feedsWithValue = allAnalysis.filter(a => a.hasValue);
  const feedsWithFunding = allAnalysis.filter(a => a.funding.length > 0);
  const feedsWithNoPayment = allAnalysis.filter(a => !a.hasValue && a.funding.length === 0);
  
  console.log(`\nTotal feeds analyzed: ${allAnalysis.length}`);
  console.log(`Feeds with podcast:value: ${feedsWithValue.length}`);
  console.log(`Feeds with funding only: ${feedsWithFunding.length}`);
  console.log(`Feeds with no payment info: ${feedsWithNoPayment.length}`);
  
  // Aggregate custom values
  const allCustomValues = new Map();
  const allCustomKeys = new Map();
  const allAddresses = new Map();
  
  feedsWithValue.forEach(feed => {
    feed.customValues.forEach(cv => {
      if (!allCustomValues.has(cv)) {
        allCustomValues.set(cv, []);
      }
      allCustomValues.get(cv).push(feed.feedTitle);
    });
    
    feed.customKeys.forEach(ck => {
      if (!allCustomKeys.has(ck)) {
        allCustomKeys.set(ck, []);
      }
      allCustomKeys.get(ck).push(feed.feedTitle);
    });
    
    feed.addresses.forEach(addr => {
      if (!allAddresses.has(addr)) {
        allAddresses.set(addr, []);
      }
      allAddresses.get(addr).push(feed.feedTitle);
    });
  });
  
  console.log('\n📌 CUSTOM VALUES FOUND:');
  console.log('-'.repeat(80));
  if (allCustomValues.size === 0) {
    console.log('No custom values found in these feeds');
  } else {
    Array.from(allCustomValues.entries()).forEach(([value, feeds]) => {
      console.log(`\nCustom Value: ${value}`);
      console.log(`Used by ${feeds.length} feed(s):`);
      feeds.forEach(f => console.log(`  - ${f}`));
    });
  }
  
  console.log('\n🔑 CUSTOM KEYS FOUND:');
  console.log('-'.repeat(80));
  if (allCustomKeys.size === 0) {
    console.log('No custom keys found in these feeds');
  } else {
    Array.from(allCustomKeys.entries()).forEach(([key, feeds]) => {
      console.log(`\nCustom Key: ${key}`);
      console.log(`Used by ${feeds.length} feed(s):`);
      feeds.slice(0, 3).forEach(f => console.log(`  - ${f}`));
      if (feeds.length > 3) {
        console.log(`  ... and ${feeds.length - 3} more`);
      }
    });
  }
  
  console.log('\n⚡ NODE ADDRESSES FOUND:');
  console.log('-'.repeat(80));
  const uniqueAddresses = Array.from(allAddresses.keys());
  console.log(`Total unique node addresses: ${uniqueAddresses.length}`);
  uniqueAddresses.slice(0, 5).forEach(addr => {
    const feeds = allAddresses.get(addr);
    console.log(`\n${addr.substring(0, 20)}...`);
    console.log(`Used by ${feeds.length} feed(s)`);
  });
  if (uniqueAddresses.length > 5) {
    console.log(`\n... and ${uniqueAddresses.length - 5} more addresses`);
  }
  
  console.log('\n📋 FEEDS WITH NO PAYMENT METHODS:');
  console.log('-'.repeat(80));
  if (feedsWithNoPayment.length === 0) {
    console.log('All feeds have some form of payment method');
  } else {
    feedsWithNoPayment.forEach(feed => {
      console.log(`  - ${feed.feedTitle}`);
    });
  }
  
  // Save detailed results
  const outputPath = path.join(__dirname, '..', 'data', 'other-payment-methods-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    analyzed: new Date().toISOString(),
    summary: {
      totalAnalyzed: allAnalysis.length,
      withPodcastValue: feedsWithValue.length,
      withFundingOnly: feedsWithFunding.length,
      withNoPayment: feedsWithNoPayment.length
    },
    customValues: Object.fromEntries(allCustomValues),
    customKeys: Object.fromEntries(allCustomKeys),
    nodeAddresses: Object.fromEntries(allAddresses),
    feeds: allAnalysis
  }, null, 2));
  
  console.log(`\n💾 Detailed results saved to: ${outputPath}`);
}

main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});