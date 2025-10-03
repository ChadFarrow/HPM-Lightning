'use client';

import React, { useState } from 'react';
import { 
  makeEnhancedLightningPayment,
  getPaymentMethodPreference 
} from '@/utils/enhanced-payment-utils';
import { useLightningAddress } from '@/hooks/useLightningMapping';

interface PaymentRecipient {
  address: string;
  split: number;
  name?: string;
  customValue?: string;
  type?: string;
}

export function EnhancedPaymentDemo() {
  const [amount, setAmount] = useState(100);
  const [message, setMessage] = useState('Test payment with Lightning address priority');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);

  // Example recipients with different payment methods
  const exampleRecipients: PaymentRecipient[] = [
    {
      address: '03b6f613e88bd874177c28c6ad83b3baba43c4c656f56be1f8df84669556054b79',
      split: 60,
      name: 'Circle the Earth',
      customValue: '01dor7UwNfuBgODLSMLmWT',
      type: 'node'
    },
    {
      address: '03a2cb3058309f7a0355b9583fc4347d82b251ee94997aec4d4e5573b181a49657',
      split: 25,
      name: 'RSS Blue',
      customValue: 'x3VXZtbcfIBVLIUqzWKV',
      type: 'node'
    },
    {
      address: '030a58b8653d32b99200a2334cfe913e51dc7d155aa0116c176657a4f1722677a3',
      split: 15,
      name: 'Phantom Power Media',
      customValue: 'aBpWlXR7oKOAYjr21Elk',
      type: 'node'
    }
  ];

  const handlePayment = async () => {
    setIsProcessing(true);
    setResults(null);

    try {
      const result = await makeEnhancedLightningPayment({
        amount,
        description: message,
        recipients: exampleRecipients,
        fallbackRecipient: exampleRecipients[0].address,
        boostMetadata: {
          title: 'Enhanced Payment Demo',
          artist: 'HPM Lightning',
          message,
          senderName: 'Demo User',
          appName: 'HPM Lightning Demo'
        }
      });

      setResults(result);
    } catch (error) {
      setResults({
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Enhanced Lightning Payment Demo</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          This demo shows how the site prioritizes Lightning addresses over keysend for better UX.
        </p>

        {/* Payment Configuration */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Amount (sats)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
              placeholder="Optional message"
            />
          </div>
        </div>

        {/* Recipients Preview */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Payment Recipients</h3>
          <div className="space-y-3">
            {exampleRecipients.map((recipient, index) => {
              const preference = getPaymentMethodPreference(recipient);
              const recipientAmount = Math.floor((amount * recipient.split) / 100);
              
              return (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{recipient.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {recipientAmount} sats ({recipient.split}%)
                      </div>
                      <div className="text-xs text-gray-500">
                        Node: {recipient.address.substring(0, 20)}...
                      </div>
                      {recipient.customValue && (
                        <div className="text-xs text-gray-500">
                          Custom Value: {recipient.customValue}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {preference.preferredMethod === 'lightning-address' ? (
                        <div className="text-green-600 dark:text-green-400">
                          <div className="font-medium">⚡ Lightning Address</div>
                          <div className="text-xs">{preference.lightningAddress}</div>
                          <div className="text-xs text-gray-500">{preference.reason}</div>
                        </div>
                      ) : (
                        <div className="text-yellow-600 dark:text-yellow-400">
                          <div className="font-medium">🔗 Keysend</div>
                          <div className="text-xs">{preference.reason}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          disabled={isProcessing || amount <= 0}
          className={`w-full py-3 px-4 rounded-md font-medium ${
            isProcessing || amount <= 0
              ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isProcessing ? 'Processing Payment...' : `Send ${amount} sats`}
        </button>

        {/* Results */}
        {results && (
          <div className="mt-6 p-4 rounded-md bg-gray-50 dark:bg-gray-800">
            <h3 className="font-semibold mb-3">Payment Results</h3>
            {results.success ? (
              <div className="space-y-3">
                <div className="text-green-600 dark:text-green-400 font-medium">
                  ✅ Payment Successful!
                </div>
                
                {results.paymentSummary && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Lightning Addresses: {results.paymentSummary.lightningAddresses}</div>
                    <div>Keysend Payments: {results.paymentSummary.keysendPayments}</div>
                    <div>Total Recipients: {results.paymentSummary.recipients}</div>
                    <div>Total Amount: {results.paymentSummary.totalAmount} sats</div>
                  </div>
                )}

                {results.results && (
                  <div className="space-y-2">
                    <div className="font-medium">Individual Results:</div>
                    {results.results.map((result: any, index: number) => (
                      <div key={index} className="text-sm bg-white dark:bg-gray-900 p-2 rounded">
                        <div className="font-medium">{result.recipient}</div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {result.amount} sats via {result.method}
                        </div>
                        {result.preimage && (
                          <div className="text-xs text-gray-500 font-mono">
                            Preimage: {result.preimage.substring(0, 20)}...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-600 dark:text-red-400">
                ❌ Payment Failed: {results.error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Information Panel */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">How Enhanced Payments Work</h3>
        <div className="space-y-2 text-sm">
          <div>
            <strong>1. Lightning Address Priority:</strong> The system first tries to resolve Lightning addresses from custom values or node mappings.
          </div>
          <div>
            <strong>2. LNURL-Pay Protocol:</strong> Lightning addresses use the LNURL-pay protocol for better user experience.
          </div>
          <div>
            <strong>3. Keysend Fallback:</strong> If Lightning address fails or isn&apos;t available, falls back to keysend.
          </div>
          <div>
            <strong>4. Automatic Retry:</strong> Failed Lightning address payments automatically retry with keysend.
          </div>
          <div>
            <strong>5. Payment Metadata:</strong> Boost metadata is included for both payment methods.
          </div>
        </div>
      </div>
    </div>
  );
}