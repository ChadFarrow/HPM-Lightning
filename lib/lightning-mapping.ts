/**
 * Lightning payment recipient mapping utilities
 */

import type { LightningRecipientsMapping, RecipientDetails, CustomValueMapping } from '@/types/lightning-mapping';
import mappingData from '@/data/lightning-recipients-mapping.json';

// Type-safe mapping data
const lightningMapping = mappingData as LightningRecipientsMapping;

/**
 * Get Lightning address from custom value
 */
export function getLightningAddressFromCustomValue(customValue: string): string | null {
  const mappings = lightningMapping.customValueToAddress[customValue];
  if (!mappings || mappings.length === 0) return null;
  
  // Return the primary (first) Lightning address
  return mappings[0].lightningAddress;
}

/**
 * Get Lightning address from node address
 */
export function getLightningAddressFromNode(nodeAddress: string): string | null {
  return lightningMapping.nodeToLightningAddress[nodeAddress] || null;
}

/**
 * Get recipient details by custom value
 */
export function getRecipientDetails(customValue: string): RecipientDetails | null {
  return lightningMapping.recipientDetails[customValue] || null;
}

/**
 * Get custom value and Lightning address from custom key
 */
export function getMappingFromCustomKey(customKey: string): {
  customValue: string;
  nodeAddress: string;
  lightningAddress: string;
} | null {
  return lightningMapping.customKeyMapping[customKey] || null;
}

/**
 * Check if a custom value exists in the mapping
 */
export function hasCustomValue(customValue: string): boolean {
  return customValue in lightningMapping.customValueToAddress;
}

/**
 * Get all custom values that map to a specific Lightning address
 */
export function getCustomValuesForAddress(lightningAddress: string): string[] {
  const customValues: string[] = [];
  
  Object.entries(lightningMapping.customValueToAddress).forEach(([customValue, mappings]) => {
    if (mappings.some(m => m.lightningAddress === lightningAddress)) {
      customValues.push(customValue);
    }
  });
  
  return customValues;
}

/**
 * Get formatted recipient display name
 */
export function getRecipientDisplayName(customValue: string): string {
  const details = getRecipientDetails(customValue);
  if (!details) return 'Unknown Recipient';
  
  // If we have a primary Lightning address, use it
  if (details.primaryAddress) {
    return details.primaryAddress;
  }
  
  // Otherwise, use the most common recipient name
  if (details.recipients.length > 0) {
    const sorted = [...details.recipients].sort((a, b) => b.occurrences - a.occurrences);
    return sorted[0].name;
  }
  
  return 'Unknown Recipient';
}

/**
 * Get statistics about the mapping coverage
 */
export function getMappingStatistics() {
  return lightningMapping.statistics;
}

/**
 * Format recipient info for display
 */
export function formatRecipientInfo(recipient: {
  customValue?: string;
  address?: string;
  name?: string;
  split?: number;
}): {
  displayName: string;
  lightningAddress: string | null;
  splitPercentage: string;
} {
  let displayName = recipient.name || 'Unknown';
  let lightningAddress: string | null = null;
  
  // Try to get Lightning address from custom value
  if (recipient.customValue) {
    lightningAddress = getLightningAddressFromCustomValue(recipient.customValue);
    if (!recipient.name && lightningAddress) {
      displayName = lightningAddress;
    }
  }
  
  // Try to get Lightning address from node address
  if (!lightningAddress && recipient.address) {
    lightningAddress = getLightningAddressFromNode(recipient.address);
    if (!recipient.name && lightningAddress) {
      displayName = lightningAddress;
    }
  }
  
  // Format split percentage
  const splitPercentage = recipient.split ? `${(recipient.split / 100).toFixed(1)}%` : '0%';
  
  return {
    displayName,
    lightningAddress,
    splitPercentage
  };
}

/**
 * Check if the mapping data is available
 */
export function isMappingAvailable(): boolean {
  return Boolean(
    lightningMapping && 
    lightningMapping.customValueToAddress &&
    Object.keys(lightningMapping.customValueToAddress).length > 0
  );
}