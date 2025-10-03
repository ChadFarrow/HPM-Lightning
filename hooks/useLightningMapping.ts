'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  getLightningAddressFromCustomValue,
  getRecipientDetails,
  formatRecipientInfo,
  getMappingStatistics,
  isMappingAvailable,
  type RecipientDetails
} from '@/lib/lightning-mapping';

/**
 * Hook to get Lightning address from custom value
 */
export function useLightningAddress(customValue: string | undefined) {
  const [lightningAddress, setLightningAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customValue) {
      setLightningAddress(null);
      setLoading(false);
      return;
    }

    try {
      const address = getLightningAddressFromCustomValue(customValue);
      setLightningAddress(address);
    } catch (error) {
      console.error('Error getting Lightning address:', error);
      setLightningAddress(null);
    } finally {
      setLoading(false);
    }
  }, [customValue]);

  return { lightningAddress, loading };
}

/**
 * Hook to get recipient details
 */
export function useRecipientDetails(customValue: string | undefined) {
  const [details, setDetails] = useState<RecipientDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customValue) {
      setDetails(null);
      setLoading(false);
      return;
    }

    try {
      const recipientDetails = getRecipientDetails(customValue);
      setDetails(recipientDetails);
    } catch (error) {
      console.error('Error getting recipient details:', error);
      setDetails(null);
    } finally {
      setLoading(false);
    }
  }, [customValue]);

  return { details, loading };
}

/**
 * Hook to format recipient information
 */
export function useFormattedRecipient(recipient: {
  customValue?: string;
  address?: string;
  name?: string;
  split?: number;
}) {
  const [formatted, setFormatted] = useState({
    displayName: 'Unknown',
    lightningAddress: null as string | null,
    splitPercentage: '0%'
  });

  useEffect(() => {
    try {
      const info = formatRecipientInfo(recipient);
      setFormatted(info);
    } catch (error) {
      console.error('Error formatting recipient:', error);
    }
  }, [recipient.customValue, recipient.address, recipient.name, recipient.split]);

  return formatted;
}

/**
 * Hook to get mapping statistics
 */
export function useMappingStatistics() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const statistics = getMappingStatistics();
      setStats(statistics);
    } catch (error) {
      console.error('Error getting statistics:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { stats, loading };
}

/**
 * Hook to check if mapping is available
 */
export function useMappingAvailable() {
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const isAvailable = isMappingAvailable();
      setAvailable(isAvailable);
    } catch (error) {
      console.error('Error checking mapping availability:', error);
      setAvailable(false);
    } finally {
      setLoading(false);
    }
  }, []);

  return { available, loading };
}

/**
 * Hook to fetch mapping data from API
 */
export function useLightningMappingAPI(customValue?: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMapping = useCallback(async (value?: string) => {
    setLoading(true);
    setError(null);

    try {
      const url = value 
        ? `/api/lightning-mapping?customValue=${encodeURIComponent(value)}`
        : '/api/lightning-mapping';
      
      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch mapping');
      }

      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (customValue !== undefined) {
      fetchMapping(customValue);
    }
  }, [customValue, fetchMapping]);

  return { data, loading, error, refetch: fetchMapping };
}