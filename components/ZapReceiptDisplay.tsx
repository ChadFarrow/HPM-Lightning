'use client';

import { useState, useEffect } from 'react';
import { Zap, User, Clock, Hash, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useZapReceipts, useZapFormatter } from '@/hooks/useZapReceipts';
import type { ZapReceipt } from '@/lib/zap-receipt-service';

interface ZapReceiptDisplayProps {
  pubkey?: string;
  eventId?: string;
  showLiveUpdates?: boolean;
  maxDisplay?: number;
  className?: string;
}

export function ZapReceiptDisplay({
  pubkey,
  eventId,
  showLiveUpdates = true,
  maxDisplay = 20,
  className = ''
}: ZapReceiptDisplayProps) {
  const {
    receipts,
    loading,
    error,
    totalAmount,
    totalCount,
    fetchReceipts,
    isSubscribed
  } = useZapReceipts({
    pubkey,
    eventId,
    autoSubscribe: showLiveUpdates,
    limit: maxDisplay
  });

  const { formatSats, formatTime } = useZapFormatter();
  const [expandedReceipts, setExpandedReceipts] = useState<Set<string>>(new Set());

  const toggleExpanded = (receiptId: string) => {
    setExpandedReceipts(prev => {
      const next = new Set(prev);
      if (next.has(receiptId)) {
        next.delete(receiptId);
      } else {
        next.add(receiptId);
      }
      return next;
    });
  };

  if (!pubkey && !eventId) {
    return (
      <div className={`p-4 bg-gray-900 rounded-lg ${className}`}>
        <p className="text-gray-400">No pubkey or event ID provided</p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Zap Receipts
          </h3>
          <button
            onClick={fetchReceipts}
            disabled={loading}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Total Zaps</p>
            <p className="text-xl font-bold text-white">{totalCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Amount</p>
            <p className="text-xl font-bold text-yellow-500">
              {formatSats(totalAmount)}
            </p>
          </div>
        </div>

        {/* Live indicator */}
        {showLiveUpdates && isSubscribed && (
          <div className="mt-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400">Live updates active</span>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 m-4 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && receipts.length === 0 && (
        <div className="p-8 text-center">
          <div className="inline-flex items-center gap-2 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Loading zap receipts...</span>
          </div>
        </div>
      )}

      {/* Receipts list */}
      <div className="divide-y divide-gray-800">
        {receipts.slice(0, maxDisplay).map((receipt) => (
          <ZapReceiptItem
            key={receipt.id}
            receipt={receipt}
            isExpanded={expandedReceipts.has(receipt.id)}
            onToggleExpand={() => toggleExpanded(receipt.id)}
            formatSats={formatSats}
            formatTime={formatTime}
          />
        ))}
      </div>

      {/* Empty state */}
      {!loading && receipts.length === 0 && (
        <div className="p-8 text-center">
          <Zap className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400">No zap receipts found</p>
          <p className="text-sm text-gray-500 mt-1">
            {pubkey ? 'This user hasn\'t received any zaps yet' : 'This event hasn\'t been zapped yet'}
          </p>
        </div>
      )}

      {/* Show more indicator */}
      {receipts.length > maxDisplay && (
        <div className="p-3 text-center border-t border-gray-800">
          <p className="text-sm text-gray-400">
            Showing {maxDisplay} of {receipts.length} receipts
          </p>
        </div>
      )}
    </div>
  );
}

interface ZapReceiptItemProps {
  receipt: ZapReceipt;
  isExpanded: boolean;
  onToggleExpand: () => void;
  formatSats: (amount: number) => string;
  formatTime: (timestamp: number) => string;
}

function ZapReceiptItem({
  receipt,
  isExpanded,
  onToggleExpand,
  formatSats,
  formatTime
}: ZapReceiptItemProps) {
  const [verifiedStatus, setVerifiedStatus] = useState<'checking' | 'verified' | 'unverified'>('checking');

  useEffect(() => {
    // Simple verification: check if we have required fields
    if (receipt.bolt11 && receipt.recipient) {
      setVerifiedStatus('verified');
    } else {
      setVerifiedStatus('unverified');
    }
  }, [receipt]);

  const shortenPubkey = (pubkey: string) => {
    return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
  };

  return (
    <div className="p-4 hover:bg-gray-800/50 transition-colors">
      <div 
        className="flex items-start justify-between cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex-1">
          {/* Main info */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold text-yellow-500">
                {formatSats(receipt.amount)}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {formatTime(receipt.created_at)}
            </span>
            {verifiedStatus === 'verified' && (
              <CheckCircle className="w-4 h-4 text-green-500" title="Verified" />
            )}
          </div>

          {/* Sender info */}
          {receipt.sender && (
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <User className="w-3 h-3" />
              <span>From: {shortenPubkey(receipt.sender)}</span>
            </div>
          )}

          {/* Comment */}
          {receipt.comment && (
            <p className="text-sm text-gray-300 mt-2 italic">
              "{receipt.comment}"
            </p>
          )}
        </div>

        {/* Expand indicator */}
        <div className="ml-4">
          <div className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-800 space-y-2 text-sm">
          {/* Receipt ID */}
          <div className="flex items-start gap-2">
            <Hash className="w-4 h-4 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-gray-500">Receipt ID</p>
              <p className="text-gray-300 font-mono text-xs break-all">
                {receipt.id}
              </p>
            </div>
          </div>

          {/* Lightning node */}
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-gray-500">Lightning Node</p>
              <p className="text-gray-300 font-mono text-xs break-all">
                {shortenPubkey(receipt.pubkey)}
              </p>
            </div>
          </div>

          {/* Invoice */}
          <div className="flex items-start gap-2">
            <Hash className="w-4 h-4 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-gray-500">Invoice</p>
              <p className="text-gray-300 font-mono text-xs break-all">
                {receipt.bolt11.slice(0, 50)}...
              </p>
            </div>
          </div>

          {/* Preimage if available */}
          {receipt.preimage && (
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-gray-500">Payment Proof (Preimage)</p>
                <p className="text-gray-300 font-mono text-xs break-all">
                  {receipt.preimage}
                </p>
              </div>
            </div>
          )}

          {/* Event being zapped */}
          {receipt.eventId && (
            <div className="flex items-start gap-2">
              <Hash className="w-4 h-4 text-gray-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-gray-500">Zapped Event</p>
                <p className="text-gray-300 font-mono text-xs break-all">
                  {receipt.eventId}
                </p>
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-gray-500">Timestamp</p>
              <p className="text-gray-300 text-xs">
                {new Date(receipt.created_at * 1000).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}