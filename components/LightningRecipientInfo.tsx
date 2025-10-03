'use client';

import React from 'react';
import { 
  getLightningAddressFromCustomValue,
  getRecipientDetails,
  formatRecipientInfo 
} from '@/lib/lightning-mapping';
import { RSSValueRecipient } from '@/lib/rss-parser';

interface LightningRecipientInfoProps {
  recipient: RSSValueRecipient;
  showDetails?: boolean;
  className?: string;
}

export function LightningRecipientInfo({ 
  recipient, 
  showDetails = false,
  className = ''
}: LightningRecipientInfoProps) {
  const formattedInfo = formatRecipientInfo({
    customValue: recipient.customValue,
    address: recipient.address,
    name: recipient.name,
    split: recipient.split
  });

  // Get additional details if custom value exists
  const recipientDetails = recipient.customValue 
    ? getRecipientDetails(recipient.customValue)
    : null;

  return (
    <div className={`lightning-recipient-info ${className}`}>
      <div className="recipient-main">
        <span className="recipient-name font-medium">
          {formattedInfo.displayName}
        </span>
        <span className="recipient-split text-sm text-gray-600 dark:text-gray-400 ml-2">
          {formattedInfo.splitPercentage}
        </span>
      </div>

      {formattedInfo.lightningAddress && formattedInfo.lightningAddress !== formattedInfo.displayName && (
        <div className="recipient-address text-xs text-gray-500 dark:text-gray-500 mt-1">
          ⚡ {formattedInfo.lightningAddress}
        </div>
      )}

      {showDetails && recipientDetails && (
        <div className="recipient-details mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
          <div className="detail-item">
            <span className="font-semibold">Custom Key:</span> {recipient.customKey || 'N/A'}
          </div>
          <div className="detail-item">
            <span className="font-semibold">Type:</span> {recipient.type}
          </div>
          {recipient.fee && (
            <div className="detail-item">
              <span className="font-semibold">Fee:</span> Yes
            </div>
          )}
          {recipientDetails.feedDistribution && Object.keys(recipientDetails.feedDistribution).length > 0 && (
            <div className="detail-item mt-1">
              <span className="font-semibold">Used by:</span>
              <div className="ml-2">
                {Object.entries(recipientDetails.feedDistribution).map(([artist, count]) => (
                  <div key={artist}>{artist} ({count} feeds)</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface RecipientListProps {
  recipients: RSSValueRecipient[];
  showDetails?: boolean;
  className?: string;
}

export function LightningRecipientList({ 
  recipients, 
  showDetails = false,
  className = ''
}: RecipientListProps) {
  if (!recipients || recipients.length === 0) {
    return <div className="text-gray-500 text-sm">No payment recipients configured</div>;
  }

  return (
    <div className={`lightning-recipient-list space-y-2 ${className}`}>
      {recipients.map((recipient, index) => (
        <LightningRecipientInfo
          key={`${recipient.address}-${index}`}
          recipient={recipient}
          showDetails={showDetails}
          className="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0"
        />
      ))}
    </div>
  );
}

/**
 * Component to display aggregated recipient statistics
 */
export function RecipientStatistics() {
  const [stats, setStats] = React.useState<any>(null);

  React.useEffect(() => {
    import('@/lib/lightning-mapping').then(module => {
      const mappingStats = module.getMappingStatistics();
      setStats(mappingStats);
    });
  }, []);

  if (!stats) return null;

  return (
    <div className="recipient-statistics p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">Lightning Payment Coverage</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-item">
          <div className="text-2xl font-bold">{stats.feedCoverage.coveragePercentage}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Feed Coverage</div>
        </div>
        <div className="stat-item">
          <div className="text-2xl font-bold">{stats.totalRecipients}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Recipients</div>
        </div>
        <div className="stat-item">
          <div className="text-2xl font-bold">{stats.feedCoverage.feedsWithCustomValue}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Active Feeds</div>
        </div>
        <div className="stat-item">
          <div className="text-2xl font-bold">{stats.totalCustomValues}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Custom Values</div>
        </div>
      </div>
    </div>
  );
}