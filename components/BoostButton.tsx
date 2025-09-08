'use client';

import { useState, useEffect } from 'react';
import { Zap, Send, Check, AlertCircle, Loader2, Settings } from 'lucide-react';
import { useBoostToNostr } from '@/hooks/useBoostToNostr';
import type { TrackMetadata } from '@/lib/boost-to-nostr-service';

interface BoostButtonProps {
  track: TrackMetadata;
  className?: string;
  showHistory?: boolean;
  defaultAmount?: number;
  customAmounts?: number[];
}

export function BoostButton({
  track,
  className = '',
  showHistory = false,
  defaultAmount = 100,
  customAmounts = [21, 100, 500, 1000, 5000, 10000]
}: BoostButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(defaultAmount);
  const [customAmount, setCustomAmount] = useState('');
  const [comment, setComment] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const {
    postBoost,
    boostHistory,
    isPosting,
    error,
    publicKey,
    generateKeys
  } = useBoostToNostr({ autoGenerateKeys: true });

  const handleBoost = async () => {
    const amount = customAmount ? parseInt(customAmount) : selectedAmount;
    
    if (isNaN(amount) || amount <= 0) {
      return;
    }

    const result = await postBoost(amount, track, comment);
    
    if (result.success) {
      setShowSuccess(true);
      setComment('');
      setCustomAmount('');
      setIsOpen(false);
      
      // Show success for 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const formatAmount = (sats: number) => {
    if (sats >= 1000) {
      return `${(sats / 1000).toFixed(1)}k`;
    }
    return sats.toString();
  };

  if (!publicKey && !showSettings) {
    return (
      <button
        onClick={() => setShowSettings(true)}
        className={`px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg font-semibold transition-colors flex items-center gap-2 ${className}`}
      >
        <Settings className="w-4 h-4" />
        Setup Boost
      </button>
    );
  }

  if (showSettings) {
    return (
      <div className="bg-gray-900 rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-semibold text-white">Setup Nostr Boost</h3>
        <p className="text-sm text-gray-400">
          Generate a Nostr key to start posting boosts. Your key will be saved locally.
        </p>
        <button
          onClick={() => {
            generateKeys();
            setShowSettings(false);
          }}
          className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg font-semibold transition-colors"
        >
          Generate Keys
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Boost Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg font-semibold transition-all flex items-center gap-2 ${className}`}
      >
        <Zap className="w-4 h-4" />
        Boost
        {showSuccess && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </button>

      {/* Boost Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-md w-full p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Boost Track
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Track Info */}
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-white font-medium">{track.title}</p>
              <p className="text-gray-400 text-sm">{track.artist}</p>
              {track.album && (
                <p className="text-gray-500 text-xs mt-1">{track.album}</p>
              )}
            </div>

            {/* Amount Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Select Amount (sats)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {customAmounts.map(amount => (
                  <button
                    key={amount}
                    onClick={() => {
                      setSelectedAmount(amount);
                      setCustomAmount('');
                    }}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      selectedAmount === amount && !customAmount
                        ? 'bg-yellow-500 text-black'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {formatAmount(amount)}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Custom amount..."
                className="w-full mt-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Add Comment (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBoost}
                disabled={isPosting || (!customAmount && !selectedAmount)}
                className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isPosting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Post Boost
                  </>
                )}
              </button>
            </div>

            {/* Info */}
            <p className="text-xs text-gray-500 text-center">
              Your boost will be posted to Nostr with track metadata
            </p>
          </div>
        </div>
      )}

      {/* Recent Boosts */}
      {showHistory && boostHistory.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-400">Recent Boosts</h4>
          {boostHistory.slice(0, 3).map((boost) => (
            <div key={boost.id} className="bg-gray-800 rounded-lg p-2 text-xs">
              <p className="text-gray-300 truncate">{boost.content.split('\n')[0]}</p>
              <p className="text-gray-500">
                {new Date(boost.created_at * 1000).toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}