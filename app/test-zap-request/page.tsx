'use client';

import { useState, useEffect } from 'react';
import { getBoostToNostrService } from '@/lib/boost-to-nostr-service';
import { nip19 } from 'nostr-tools';

export default function TestZapRequestPage() {
  const [zapRequest, setZapRequest] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [keys, setKeys] = useState<{ pubkey: string; npub: string } | null>(null);

  useEffect(() => {
    // Initialize the service and generate keys
    const service = getBoostToNostrService();
    const generatedKeys = service.generateKeys();
    if (generatedKeys) {
      setKeys({
        pubkey: generatedKeys.publicKey,
        npub: generatedKeys.npub
      });
    }
  }, []);

  const createTestZapRequest = async () => {
    setLoading(true);
    try {
      const service = getBoostToNostrService();
      
      // Example recipient (you can change this to any valid pubkey)
      const recipientPubkey = '82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2';
      
      const result = await service.createZapRequest({
        amount: 21000, // 21 sats in millisats
        recipientPubkey,
        comment: 'Great episode!',
        relays: ['wss://relay.fountain.fm'],
        track: {
          title: 'Example Episode',
          artist: 'Example Podcast',
          podcastFeedGuid: 'c90e609a-df1e-596a-bd5e-57bcc8aad6cc',
          itemGuid: 'd98d189b-dc7b-45b1-8720-d4b98690f31f',
          feedUrl: 'https://fountain.fm/show/p8WM5xdhPOB2YrKmP1Vy',
          publisherGuid: 'publisher-123',
          publisherUrl: 'https://example.com/publisher'
        }
      });

      if (result) {
        setZapRequest(result.event);
        console.log('Zap Request Created:', result.event);
      } else {
        alert('Failed to create zap request');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating zap request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">NIP-73 Zap Request Test</h1>
      
      {keys && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400 mb-2">Test Public Key:</p>
          <p className="font-mono text-xs break-all">{keys.npub}</p>
        </div>
      )}

      <button
        onClick={createTestZapRequest}
        disabled={loading}
        className="mb-6 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
      >
        {loading ? 'Creating...' : 'Create Test Zap Request'}
      </button>

      {zapRequest && (
        <div className="space-y-6">
          <div className="p-4 bg-gray-900 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Generated Zap Request (Kind 9734)</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Event ID:</p>
                <p className="font-mono text-xs break-all text-white bg-black p-2 rounded">{zapRequest.id}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">Kind:</p>
                <p className="font-mono text-yellow-400 text-lg font-bold">{zapRequest.kind}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">Content (Comment):</p>
                <p className="font-mono text-white bg-black p-2 rounded">{zapRequest.content || '(no comment)'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">Public Key:</p>
                <p className="font-mono text-xs break-all text-white bg-black p-2 rounded">{zapRequest.pubkey}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">Created At:</p>
                <p className="font-mono text-white">{new Date(zapRequest.created_at * 1000).toLocaleString()}</p>
              </div>

              <div>
                <h3 className="text-sm text-gray-400 mb-2">Tags:</h3>
                <div className="bg-black p-4 rounded border border-gray-700">
                  {zapRequest.tags.map((tag: string[], index: number) => (
                    <div key={index} className="mb-2 font-mono text-sm">
                      <span className="text-yellow-400 font-bold">[\u0022{tag[0]}\u0022</span>
                      {tag.slice(1).map((value, i) => (
                        <span key={i} className="text-white">
                          , \u0022<span className="text-green-400">{value}</span>\u0022
                        </span>
                      ))}
                      <span className="text-yellow-400 font-bold">]</span>
                      <span className="text-gray-500">{index < zapRequest.tags.length - 1 && ','}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm text-gray-400 mb-2">Full JSON:</h3>
                <pre className="bg-black p-4 rounded border border-gray-700 overflow-x-auto text-xs text-gray-300 font-mono">
                  {JSON.stringify(zapRequest, null, 2)}
                </pre>
              </div>

              <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700 rounded">
                <p className="text-sm text-blue-300 mb-2">✅ This matches the NIP-73 format!</p>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Kind 9734 (Zap Request)</li>
                  <li>• Contains relays tag</li>
                  <li>• Contains amount tag (in millisats)</li>
                  <li>• Contains k tags for podcast metadata types</li>
                  <li>• Contains i tags with podcast GUIDs</li>
                  <li>• Properly signed with id and sig</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}