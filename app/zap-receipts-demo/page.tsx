'use client';

import { useState } from 'react';
import { ZapReceiptDisplay } from '@/components/ZapReceiptDisplay';
import { Zap, Info, Code, FileText } from 'lucide-react';

export default function ZapReceiptsDemo() {
  const [inputType, setInputType] = useState<'pubkey' | 'event'>('pubkey');
  const [pubkeyInput, setPubkeyInput] = useState('');
  const [eventIdInput, setEventIdInput] = useState('');
  const [activePubkey, setActivePubkey] = useState('');
  const [activeEventId, setActiveEventId] = useState('');

  // Example pubkeys and event IDs for demo
  const examplePubkeys = [
    { name: 'jack', pubkey: '82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2' },
    { name: 'fiatjaf', pubkey: '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d' },
    { name: 'jb55', pubkey: '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245' }
  ];

  const handleViewReceipts = () => {
    if (inputType === 'pubkey' && pubkeyInput) {
      setActivePubkey(pubkeyInput);
      setActiveEventId('');
    } else if (inputType === 'event' && eventIdInput) {
      setActiveEventId(eventIdInput);
      setActivePubkey('');
    }
  };

  const handleExampleClick = (pubkey: string) => {
    setPubkeyInput(pubkey);
    setInputType('pubkey');
    setActivePubkey(pubkey);
    setActiveEventId('');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
            <Zap className="w-10 h-10 text-yellow-500" />
            Nostr Zap Receipts (Kind 9735)
          </h1>
          <p className="text-gray-400 text-lg">
            View and monitor Lightning zap receipts from the Nostr network
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="space-y-2 text-sm text-gray-300">
              <p>
                <strong>Kind 9735</strong> events are zap receipts created by Lightning nodes when a zap payment is completed.
                They provide cryptographic proof of payment and link the payment to the original zap request.
              </p>
              <p>
                Zap receipts contain the paid invoice, payment proof (preimage), amount, sender, recipient, and optional comments.
              </p>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">View Zap Receipts</h2>
          
          {/* Input Type Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setInputType('pubkey')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                inputType === 'pubkey' 
                  ? 'bg-yellow-500 text-black' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              By Pubkey
            </button>
            <button
              onClick={() => setInputType('event')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                inputType === 'event' 
                  ? 'bg-yellow-500 text-black' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              By Event ID
            </button>
          </div>

          {/* Input Field */}
          <div className="space-y-4">
            {inputType === 'pubkey' ? (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Nostr Pubkey (hex)
                </label>
                <input
                  type="text"
                  value={pubkeyInput}
                  onChange={(e) => setPubkeyInput(e.target.value)}
                  placeholder="Enter a Nostr pubkey in hex format..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Nostr Event ID
                </label>
                <input
                  type="text"
                  value={eventIdInput}
                  onChange={(e) => setEventIdInput(e.target.value)}
                  placeholder="Enter a Nostr event ID..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            )}

            <button
              onClick={handleViewReceipts}
              disabled={inputType === 'pubkey' ? !pubkeyInput : !eventIdInput}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold rounded-lg transition-colors"
            >
              View Zap Receipts
            </button>
          </div>

          {/* Example Pubkeys */}
          {inputType === 'pubkey' && (
            <div className="mt-6">
              <p className="text-sm text-gray-400 mb-3">Try these example pubkeys:</p>
              <div className="space-y-2">
                {examplePubkeys.map(({ name, pubkey }) => (
                  <button
                    key={pubkey}
                    onClick={() => handleExampleClick(pubkey)}
                    className="w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <span className="text-yellow-500 font-medium">{name}</span>
                    <span className="text-gray-500 text-xs ml-2 font-mono">
                      {pubkey.slice(0, 16)}...
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Zap Receipt Display */}
        {(activePubkey || activeEventId) && (
          <div className="mb-8">
            <ZapReceiptDisplay
              pubkey={activePubkey || undefined}
              eventId={activeEventId || undefined}
              showLiveUpdates={true}
              maxDisplay={20}
            />
          </div>
        )}

        {/* Technical Details */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Code className="w-5 h-5 text-green-500" />
            Technical Implementation
          </h3>
          <div className="space-y-4 text-sm text-gray-300">
            <div>
              <h4 className="font-medium text-white mb-1">Service Architecture</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>ZapReceiptService class for fetching and parsing kind 9735 events</li>
                <li>Support for both historical queries and live subscriptions</li>
                <li>Automatic receipt validation and amount calculation</li>
                <li>Connection to multiple Nostr relays for redundancy</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-1">React Integration</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>useZapReceipts hook for easy component integration</li>
                <li>Automatic updates via WebSocket subscriptions</li>
                <li>Built-in formatting utilities for amounts and timestamps</li>
                <li>Optimistic UI updates for real-time feel</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-white mb-1">Event Structure (NIP-57)</h4>
              <pre className="bg-gray-800 p-3 rounded-lg overflow-x-auto">
{`{
  "kind": 9735,
  "pubkey": "<lightning_node_pubkey>",
  "created_at": <unix_timestamp>,
  "tags": [
    ["p", "<recipient_pubkey>"],
    ["e", "<event_id>"],  // optional
    ["bolt11", "<paid_invoice>"],
    ["preimage", "<payment_proof>"],
    ["description", "<zap_request_json>"]
  ],
  "content": "",
  "sig": "<signature>"
}`}
              </pre>
            </div>
          </div>
        </div>

        {/* Usage Example */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-500" />
            Usage Example
          </h3>
          <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
{`import { ZapReceiptDisplay } from '@/components/ZapReceiptDisplay';
import { useZapReceipts } from '@/hooks/useZapReceipts';

// Display component
<ZapReceiptDisplay
  pubkey="82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2"
  showLiveUpdates={true}
  maxDisplay={20}
/>

// Or use the hook directly
const { receipts, totalAmount, totalCount } = useZapReceipts({
  pubkey: "...",
  autoSubscribe: true,
  limit: 100
});`}
          </pre>
        </div>
      </div>
    </div>
  );
}