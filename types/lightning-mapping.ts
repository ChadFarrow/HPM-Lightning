// Auto-generated Lightning recipient mapping types
// Generated: 2025-10-03T11:45:26.186Z

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
