'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getZapReceiptService, type ZapReceipt } from '@/lib/zap-receipt-service';
import type { SubCloser } from 'nostr-tools';

export interface UseZapReceiptsOptions {
  pubkey?: string;
  eventId?: string;
  autoSubscribe?: boolean;
  relays?: string[];
  limit?: number;
}

export interface UseZapReceiptsReturn {
  receipts: ZapReceipt[];
  loading: boolean;
  error: string | null;
  totalAmount: number;
  totalCount: number;
  fetchReceipts: () => Promise<void>;
  subscribeToLive: () => void;
  unsubscribe: () => void;
  isSubscribed: boolean;
}

export function useZapReceipts({
  pubkey,
  eventId,
  autoSubscribe = true,
  relays,
  limit = 100
}: UseZapReceiptsOptions = {}): UseZapReceiptsReturn {
  const [receipts, setReceipts] = useState<ZapReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  const serviceRef = useRef<ReturnType<typeof getZapReceiptService>>();
  const subscriptionRef = useRef<SubCloser | null>(null);

  // Initialize service
  useEffect(() => {
    serviceRef.current = getZapReceiptService(relays);
    
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.close();
      }
    };
  }, [relays]);

  // Fetch historical receipts
  const fetchReceipts = useCallback(async () => {
    if (!serviceRef.current) return;
    if (!pubkey && !eventId) {
      setError('No pubkey or eventId provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let fetchedReceipts: ZapReceipt[] = [];

      if (pubkey) {
        fetchedReceipts = await serviceRef.current.fetchZapReceipts(pubkey, {
          limit,
          includeReceived: true,
          includeSent: false
        });
      } else if (eventId) {
        fetchedReceipts = await serviceRef.current.fetchEventZaps(eventId, {
          limit
        });
      }

      setReceipts(fetchedReceipts);
      
      // Calculate totals
      const total = fetchedReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);
      setTotalAmount(total);
      setTotalCount(fetchedReceipts.length);
    } catch (err) {
      console.error('Error fetching zap receipts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch zap receipts');
    } finally {
      setLoading(false);
    }
  }, [pubkey, eventId, limit]);

  // Subscribe to live updates
  const subscribeToLive = useCallback(() => {
    if (!serviceRef.current) return;
    if (!pubkey && !eventId) return;
    if (subscriptionRef.current) {
      subscriptionRef.current.close();
    }

    const filters: Parameters<typeof serviceRef.current.subscribeToZaps>[0] = {
      since: Math.floor(Date.now() / 1000)
    };

    if (pubkey) {
      filters.pubkeys = [pubkey];
    }
    if (eventId) {
      filters.eventIds = [eventId];
    }

    subscriptionRef.current = serviceRef.current.subscribeToZaps(filters, {
      onZap: (receipt) => {
        setReceipts(prev => {
          // Check if receipt already exists
          const exists = prev.some(r => r.id === receipt.id);
          if (exists) return prev;
          
          // Add new receipt to the beginning
          const updated = [receipt, ...prev];
          
          // Update totals
          const total = updated.reduce((sum, r) => sum + r.amount, 0);
          setTotalAmount(total);
          setTotalCount(updated.length);
          
          return updated;
        });
      },
      onError: (err) => {
        console.error('Zap subscription error:', err);
        setError(err.message);
      }
    });

    setIsSubscribed(true);
  }, [pubkey, eventId]);

  // Unsubscribe from live updates
  const unsubscribe = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.close();
      subscriptionRef.current = null;
      setIsSubscribed(false);
    }
  }, []);

  // Auto-fetch on mount or when target changes
  useEffect(() => {
    if (pubkey || eventId) {
      fetchReceipts();
    }
  }, [pubkey, eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-subscribe if enabled
  useEffect(() => {
    // Temporarily disable auto-subscribe to avoid relay filter errors
    /*
    if (autoSubscribe && (pubkey || eventId)) {
      subscribeToLive();
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.close();
      }
    };
    */
  }, [autoSubscribe, pubkey, eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    receipts,
    loading,
    error,
    totalAmount,
    totalCount,
    fetchReceipts,
    subscribeToLive,
    unsubscribe,
    isSubscribed
  };
}

/**
 * Hook to display formatted zap amounts
 */
export function useZapFormatter() {
  const formatSats = useCallback((millisats: number) => {
    const sats = Math.floor(millisats / 1000);
    
    if (sats >= 100000000) { // 1 BTC
      return `${(sats / 100000000).toFixed(8)} BTC`;
    } else if (sats >= 1000000) {
      return `${(sats / 1000000).toFixed(2)}M sats`;
    } else if (sats >= 1000) {
      return `${(sats / 1000).toFixed(1)}k sats`;
    }
    
    return `${sats} sats`;
  }, []);

  const formatTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'just now';
    }
  }, []);

  return { formatSats, formatTime };
}