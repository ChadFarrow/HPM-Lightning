'use client';

import React, { useState } from 'react';
import { 
  LightningRecipientList, 
  RecipientStatistics 
} from '@/components/LightningRecipientInfo';
import { 
  useLightningAddress,
  useRecipientDetails,
  useMappingStatistics 
} from '@/hooks/useLightningMapping';

export default function LightningMappingPage() {
  const [testCustomValue] = useState('01dor7UwNfuBgODLSMLmWT');
  const { lightningAddress, loading: addressLoading } = useLightningAddress(testCustomValue);
  const { details, loading: detailsLoading } = useRecipientDetails(testCustomValue);
  const { stats, loading: statsLoading } = useMappingStatistics();

  // Example recipients for demonstration
  const exampleRecipients = [
    {
      type: 'node' as const,
      address: '03b6f613e88bd874177c28c6ad83b3baba43c4c656f56be1f8df84669556054b79',
      split: 9700,
      name: 'Circle the Earth',
      customKey: '906608',
      customValue: '01dor7UwNfuBgODLSMLmWT',
      fee: false
    },
    {
      type: 'node' as const,
      address: '03b6f613e88bd874177c28c6ad83b3baba43c4c656f56be1f8df84669556054b79',
      split: 4900,
      name: 'Hash Power Music',
      customKey: '906608',
      customValue: '01dor7UwNfuBgODLSMLmWT',
      fee: false
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Lightning Payment Mapping</h1>

      {/* Statistics Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Coverage Statistics</h2>
        {!statsLoading && stats ? (
          <RecipientStatistics />
        ) : (
          <div>Loading statistics...</div>
        )}
      </div>

      {/* Custom Value Lookup */}
      <div className="mb-8 p-6 bg-white dark:bg-gray-900 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Custom Value Lookup</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Test Custom Value
            </label>
            <code className="block p-2 bg-gray-100 dark:bg-gray-800 rounded">
              {testCustomValue}
            </code>
          </div>

          {!addressLoading && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Mapped Lightning Address
              </label>
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                ⚡ {lightningAddress || 'Not found'}
              </div>
            </div>
          )}

          {!detailsLoading && details && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Recipient Details
              </label>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded space-y-2">
                <div><strong>Primary Address:</strong> {details.primaryAddress}</div>
                <div><strong>Node:</strong> <code className="text-xs">{details.nodeAddress?.substring(0, 20)}...</code></div>
                <div><strong>Custom Key:</strong> {details.customKey}</div>
                <div>
                  <strong>Recipients ({details.recipients.length}):</strong>
                  <ul className="ml-4 mt-2">
                    {details.recipients.map((r, i) => (
                      <li key={i} className="text-sm">
                        {r.name} - {r.occurrences} occurrences ({r.type})
                      </li>
                    ))}
                  </ul>
                </div>
                {details.feedDistribution && (
                  <div>
                    <strong>Feed Distribution:</strong>
                    <ul className="ml-4 mt-2">
                      {Object.entries(details.feedDistribution).map(([artist, count]) => (
                        <li key={artist} className="text-sm">
                          {artist}: {count} feeds
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Example Recipients Display */}
      <div className="mb-8 p-6 bg-white dark:bg-gray-900 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Example Recipients Display</h2>
        <LightningRecipientList 
          recipients={exampleRecipients}
          showDetails={true}
        />
      </div>

      {/* API Endpoints */}
      <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">API Endpoints</h2>
        <div className="space-y-2 font-mono text-sm">
          <div className="p-2 bg-white dark:bg-gray-900 rounded">
            GET /api/lightning-mapping
          </div>
          <div className="p-2 bg-white dark:bg-gray-900 rounded">
            GET /api/lightning-mapping?customValue=01dor7UwNfuBgODLSMLmWT
          </div>
          <div className="p-2 bg-white dark:bg-gray-900 rounded">
            GET /api/lightning-mapping?action=stats
          </div>
        </div>
      </div>
    </div>
  );
}