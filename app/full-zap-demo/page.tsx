'use client';

import { useState } from 'react';
import { getBoostToNostrService } from '@/lib/boost-to-nostr-service';
import { WebLNService } from '@/lib/webln-service';
import { Zap, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function FullZapDemoPage() {
  const [lnAddress, setLnAddress] = useState('sir@getalby.com'); // Example Lightning Address
  const [amount, setAmount] = useState(21);
  const [comment, setComment] = useState('Great episode! Love the podcast 🎧');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const addStatus = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : '📝';
    setStatus(prev => [...prev, `${emoji} ${message}`]);
  };

  const executeFullZap = async () => {
    setLoading(true);
    setStatus([]);
    setResult(null);
    setError('');

    try {
      const service = getBoostToNostrService();
      
      // Generate or use existing keys
      if (!service.hasKeys()) {
        addStatus('Generating Nostr keys...');
        service.generateKeys();
      }

      // Check WebLN availability
      addStatus('Checking Lightning wallet...');
      const hasWallet = await WebLNService.checkAndPromptWallet();
      if (!hasWallet) {
        throw new Error('Lightning wallet not available');
      }

      // Enable WebLN
      addStatus('Connecting to Lightning wallet...');
      await WebLNService.enable();
      addStatus('Wallet connected!', 'success');

      // Example podcast metadata
      const trackMetadata = {
        title: 'Episode 42: The Future of Podcasting',
        artist: 'Example Podcast',
        album: 'Season 2',
        podcastFeedGuid: 'c90e609a-df1e-596a-bd5e-57bcc8aad6cc',
        itemGuid: 'd98d189b-dc7b-45b1-8720-d4b98690f31f',
        feedUrl: 'https://example.com/feed.xml',
        imageUrl: 'https://example.com/episode-art.jpg',
        timestamp: 1234,
        duration: 3600
      };

      // Example recipient pubkey (you'd get this from their Nostr profile)
      const recipientPubkey = '82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2';

      addStatus('Starting zap process...');
      
      // Execute the full zap flow
      const zapResult = await service.executeZap(lnAddress, {
        amount: amount * 1000, // Convert to millisats
        recipientPubkey,
        comment,
        relays: ['wss://relay.damus.io', 'wss://relay.nostr.band'],
        track: trackMetadata
      });

      if (zapResult.paymentPreimage) {
        addStatus('Payment successful!', 'success');
        addStatus(`Preimage: ${zapResult.paymentPreimage.substring(0, 16)}...`);
      }

      if (zapResult.receipt) {
        addStatus('Zap receipt received!', 'success');
        addStatus(`Receipt amount: ${zapResult.receipt.amount / 1000} sats`);
      } else {
        addStatus('Waiting for zap receipt (may take a moment)...', 'info');
      }

      // Post a boost note about the zap
      addStatus('Posting boost note to Nostr...');
      const boostResult = await service.postBoostWithZap({
        amount,
        comment,
        track: trackMetadata,
        recipientPubkey,
        lnurlOrAddress: lnAddress,
        zapReceipt: zapResult.receipt
      });

      if (boostResult.success) {
        addStatus('Boost note posted successfully!', 'success');
        addStatus(`Note ID: ${boostResult.eventId.substring(0, 16)}...`);
      }

      setResult({
        zapRequest: zapResult.zapRequest,
        invoice: zapResult.invoice,
        paymentPreimage: zapResult.paymentPreimage,
        receipt: zapResult.receipt,
        boostNote: boostResult.event
      });

    } catch (err) {
      console.error('Zap failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      addStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <Zap className="text-yellow-500" />
        Full NIP-57/NIP-73 Zap Flow Demo
      </h1>

      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Requirements
        </h2>
        <ul className="text-sm space-y-1 ml-7">
          <li>• Lightning wallet browser extension (Alby, etc.)</li>
          <li>• Some sats in your wallet</li>
          <li>• Valid Lightning Address or LNURL</li>
        </ul>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Zap Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Lightning Address / LNURL
            </label>
            <input
              type="text"
              value={lnAddress}
              onChange={(e) => setLnAddress(e.target.value)}
              className="w-full px-3 py-2 bg-black text-white rounded border border-gray-700 focus:border-yellow-500 focus:outline-none"
              placeholder="user@getalby.com or LNURL..."
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Amount (sats)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-black text-white rounded border border-gray-700 focus:border-yellow-500 focus:outline-none"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 bg-black text-white rounded border border-gray-700 focus:border-yellow-500 focus:outline-none"
              rows={2}
            />
          </div>
        </div>

        <button
          onClick={executeFullZap}
          disabled={loading || !lnAddress}
          className="mt-6 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Send Zap with Full Flow
            </>
          )}
        </button>
      </div>

      {status.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Process Status</h2>
          <div className="space-y-2 font-mono text-sm">
            {status.map((msg, i) => (
              <div key={i} className="text-gray-300">{msg}</div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Zap Complete!
            </h2>

            {result.zapRequest && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">1. Zap Request (Kind 9734)</h3>
                <pre className="bg-black p-4 rounded text-xs overflow-x-auto">
                  {JSON.stringify(result.zapRequest.event, null, 2)}
                </pre>
              </div>
            )}

            {result.invoice && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">2. Lightning Invoice</h3>
                <div className="bg-black p-4 rounded">
                  <p className="text-xs break-all font-mono text-gray-400">
                    {result.invoice.substring(0, 100)}...
                  </p>
                </div>
              </div>
            )}

            {result.paymentPreimage && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">3. Payment Proof</h3>
                <div className="bg-black p-4 rounded">
                  <p className="text-sm text-gray-400 mb-1">Preimage:</p>
                  <p className="font-mono text-xs break-all text-green-400">
                    {result.paymentPreimage}
                  </p>
                </div>
              </div>
            )}

            {result.receipt && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">4. Zap Receipt (Kind 9735)</h3>
                <div className="bg-black p-4 rounded space-y-2">
                  <p className="text-sm">
                    <span className="text-gray-400">Amount:</span>{' '}
                    <span className="text-yellow-400 font-bold">
                      {result.receipt.amount / 1000} sats
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-400">Receipt ID:</span>{' '}
                    <span className="font-mono text-xs">{result.receipt.id}</span>
                  </p>
                </div>
              </div>
            )}

            {result.boostNote && (
              <div>
                <h3 className="text-lg font-semibold mb-2">5. Boost Note (Kind 1)</h3>
                <pre className="bg-black p-4 rounded text-xs overflow-x-auto">
                  {JSON.stringify(result.boostNote, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Full NIP-57/NIP-73 Flow Complete!
            </h3>
            <p className="text-sm text-gray-300">
              The zap has been sent with podcast metadata, payment completed, 
              receipt verified, and boost note posted to Nostr.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}