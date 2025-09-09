'use client';

import { useState } from 'react';
import { BitcoinConnectPayment } from './BitcoinConnect';

/**
 * Demo component showing how to use BitcoinConnect with NIP-57 zaps
 */
export function ZapBoostDemo() {
  const [amount, setAmount] = useState(100);
  const [comment, setComment] = useState('Great track! 🎵');
  const [enableBoosts, setEnableBoosts] = useState(true);

  // Example track metadata (Fountain-style)
  const trackMetadata = {
    title: 'Example Song',
    artist: 'Example Artist',
    album: 'Example Album',
    url: 'https://example.com/song.mp3',
    imageUrl: 'https://example.com/cover.jpg',
    timestamp: 45,
    duration: 180,
    podcastFeedGuid: 'example-guid-123',
    itemGuid: 'item-guid-456',
    feedUrl: 'https://example.com/feed.xml'
  };

  // Example recipients for value splits
  const recipients = [
    { address: '031ce2f133b570edf1c776e571e27d22a715dc6ea73956f0e79f4272d81d9dc0d5', split: 70, name: 'Artist' },
    { address: '031ce2f133b570edf1c776e571e27d22a715dc6ea73956f0e79f4272d81d9dc0d5', split: 20, name: 'Producer' },
    { address: '035ad2c954e264004986da2d9499e1732e5175e1dcef2453c921c6cdcc3536e9d8', split: 10, name: 'Platform' }
  ];

  const handleSuccess = (response: any) => {
    console.log('✅ Fountain-style boost successful!', response);
    alert(`Successfully boosted with ${amount} sats! ${enableBoosts ? 'Boost note will appear on Nostr with podcast metadata.' : 'Standard keysend payments sent.'}`);
  };

  const handleError = (error: string) => {
    console.error('❌ Boost failed:', error);
    alert(`Boost failed: ${error}`);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-900 rounded-lg border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        ⚡ Zap Boost Demo
      </h2>
      
      <div className="space-y-4">
        {/* Track Info */}
        <div className="bg-gray-800 p-3 rounded">
          <h3 className="text-white font-semibold">{trackMetadata.title}</h3>
          <p className="text-gray-300 text-sm">by {trackMetadata.artist}</p>
          <p className="text-gray-400 text-xs">{trackMetadata.album}</p>
          <div className="mt-2">
            <div className="bg-gray-700 rounded-full h-1 overflow-hidden">
              <div 
                className="bg-yellow-500 h-full"
                style={{ width: `${(trackMetadata.timestamp / trackMetadata.duration) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.floor(trackMetadata.timestamp / 60)}:{(trackMetadata.timestamp % 60).toString().padStart(2, '0')} / 
              {Math.floor(trackMetadata.duration / 60)}:{(trackMetadata.duration % 60).toString().padStart(2, '0')}
            </p>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-white text-sm font-medium mb-1">
            Amount (sats)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
            min="1"
          />
        </div>

        {/* Comment Input */}
        <div>
          <label className="block text-white text-sm font-medium mb-1">
            Comment (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
            rows={2}
            placeholder="Add a comment to your boost..."
          />
        </div>

        {/* Boost Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="enableBoosts"
            checked={enableBoosts}
            onChange={(e) => setEnableBoosts(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="enableBoosts" className="text-white text-sm">
            Enable Fountain-style Boosts (creates boost notes on Nostr)
          </label>
        </div>

        {/* Recipients Info */}
        <div className="bg-gray-800 p-3 rounded">
          <h4 className="text-white text-sm font-medium mb-2">Value Split:</h4>
          <div className="space-y-1">
            {recipients.map((recipient, index) => {
              const recipientAmount = Math.floor((amount * recipient.split) / 100);
              return (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-gray-300">{recipient.name}</span>
                  <span className="text-gray-400">{recipient.split}% ({recipientAmount} sats)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Button */}
        <BitcoinConnectPayment
          amount={amount}
          description={comment || `Boost for ${trackMetadata.title} by ${trackMetadata.artist}`}
          recipients={recipients}
          boostMetadata={enableBoosts ? trackMetadata : undefined}
          onSuccess={handleSuccess}
          onError={handleError}
          className="w-full justify-center"
        />

        {/* Info */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>• {enableBoosts ? '🎵 Fountain-style boosts: Creates Kind 1 notes with podcast metadata' : '💸 Keysend mode: Standard Lightning payments'}</p>
          <p>• Payments split across {recipients.length} recipients</p>
          <p>• {enableBoosts ? 'Boost notes will be visible on Nostr with NIP-73 i tags' : 'No Nostr posts generated'}</p>
        </div>
      </div>
    </div>
  );
}

export default ZapBoostDemo;