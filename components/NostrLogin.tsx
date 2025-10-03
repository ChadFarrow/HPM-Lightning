'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useNostrUser } from '@/contexts/NostrUserContext';
import { Chrome, ExternalLink, User, Zap, AlertCircle, Key } from 'lucide-react';

interface NostrLoginProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function NostrLogin({ onSuccess, onCancel, className = '' }: NostrLoginProps) {
  const { login, isLoading, error } = useNostrUser();
  const [extensionDetected, setExtensionDetected] = useState(false);
  const [extensionType, setExtensionType] = useState<'alby' | 'nostr' | null>(null);
  const [step, setStep] = useState<'detect' | 'success'>('detect');

  // Detect Nostr extensions on mount
  useEffect(() => {
    const detectExtensions = async () => {
      if (typeof window === 'undefined') return;

      // Check for webln.nostr (Alby)
      const webln = (window as any).webln;
      if (webln?.nostr) {
        setExtensionDetected(true);
        setExtensionType('alby');
        return;
      }

      // Check for window.nostr (NIP-07 compatible extensions)
      if ((window as any).nostr) {
        setExtensionDetected(true);
        setExtensionType('nostr');
        return;
      }

      setExtensionDetected(false);
      setExtensionType(null);
    };

    detectExtensions();
  }, []);

  const handleExtensionLogin = useCallback(async () => {
    try {
      let pubkeyHex: string | null = null;

      // Try Alby first
      if (extensionType === 'alby') {
        const webln = (window as any).webln;
        if (!webln.enabled) {
          await webln.enable();
        }
        pubkeyHex = await webln.nostr.getPublicKey();
      }
      // Then try window.nostr
      else if (extensionType === 'nostr') {
        const nostr = (window as any).nostr;
        pubkeyHex = await nostr.getPublicKey();
      }

      if (pubkeyHex) {
        // Convert hex pubkey to npub
        const { nip19 } = await import('nostr-tools');
        const npub = nip19.npubEncode(pubkeyHex);

        // Login with npub
        const success = await login(npub);
        if (success) {
          setStep('success');
          setTimeout(() => {
            onSuccess?.();
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Extension login error:', error);
    }
  }, [extensionType, login, onSuccess]);

  if (step === 'success') {
    return (
      <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Successfully Authenticated!
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome to HPM Lightning with Nostr integration
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Nostr Authentication
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Connect your Nostr browser extension to access enhanced features
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {extensionDetected ? (
        <div className="space-y-4">
          {/* Extension detected - show connect button */}
          <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              {extensionType === 'alby' ? (
                <Chrome className="w-6 h-6 text-green-600 dark:text-green-400" />
              ) : (
                <Key className="w-6 h-6 text-green-600 dark:text-green-400" />
              )}
              <div>
                <h4 className="font-semibold text-green-900 dark:text-green-100">
                  {extensionType === 'alby' ? 'Alby Extension Detected' : 'Nostr Extension Detected'}
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Click below to connect with your Nostr identity
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleExtensionLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Zap className="w-5 h-5" />
            <span>{isLoading ? 'Connecting...' : 'Connect Nostr Extension'}</span>
          </button>

          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>• Your keys stay in your browser extension</p>
            <p>• HPM Lightning never sees your private key</p>
            <p>• You control all signing and permissions</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* No extension detected - show install instructions */}
          <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                  No Nostr Extension Detected
                </h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                  To use Nostr features, you need a browser extension that manages your Nostr keys securely.
                </p>
                <div className="space-y-2">
                  <a
                    href="https://getalby.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm text-yellow-900 dark:text-yellow-100 hover:text-yellow-700 dark:hover:text-yellow-300 transition-colors"
                  >
                    <Chrome className="w-4 h-4" />
                    <span className="font-medium">Install Alby (Recommended)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    Alby provides Nostr identity + Lightning wallet in one extension
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1">
            <p className="font-medium">Other NIP-07 compatible extensions:</p>
            <p>• nos2x</p>
            <p>• Alby</p>
            <p>• Flamingo</p>
            <p>• Nostr Connect</p>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="w-full px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
