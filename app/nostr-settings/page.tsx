'use client';

import React, { useState, useEffect } from 'react';
import { useNostrUser, useNostrNWC } from '@/contexts/NostrUserContext';
import { NostrLogin } from '@/components/NostrLogin';
import { 
  User, 
  Key, 
  Zap, 
  Users, 
  Settings, 
  LogOut, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Copy,
  ExternalLink,
  Chrome,
  Download
} from 'lucide-react';

export default function NostrSettingsPage() {
  const { isAuthenticated, user, logout, refreshProfile, refreshSocialData, login } = useNostrUser();
  const { hasNWCCapability, autoConfigureNWC } = useNostrNWC();
  const [showLogin, setShowLogin] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nwcConfiguring, setNwcConfiguring] = useState(false);
  const [albyConnecting, setAlbyConnecting] = useState(false);
  const [albyConnected, setAlbyConnected] = useState(false);

  // Check for Alby extension availability on mount
  useEffect(() => {
    const checkAlbyAvailability = () => {
      if (typeof window !== 'undefined' && (window as any).webln) {
        const webln = (window as any).webln;
        if (webln.enabled) {
          setAlbyConnected(true);
        }
      }
    };

    checkAlbyAvailability();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshProfile(), refreshSocialData()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAutoConfigureNWC = async () => {
    setNwcConfiguring(true);
    try {
      const success = await autoConfigureNWC();
      if (success) {
        // Show success message
      } else {
        // Show error message
      }
    } finally {
      setNwcConfiguring(false);
    }
  };

  const handleAlbyConnection = async () => {
    setAlbyConnecting(true);
    try {
      // Check if Alby extension is available
      if (typeof window !== 'undefined' && (window as any).webln) {
        const webln = (window as any).webln;

        if (!webln.enabled) {
          await webln.enable();
        }

        // Get Alby's Nostr keys if available
        if (webln.nostr) {
          const pubkeyHex = await webln.nostr.getPublicKey();
          if (pubkeyHex) {
            // webln.nostr.getPublicKey() returns hex, need to convert to npub
            const { nip19 } = await import('nostr-tools');
            const npub = nip19.npubEncode(pubkeyHex);

            // Use the public key to authenticate
            const success = await login(npub);
            if (success) {
              setAlbyConnected(true);
            }
          }
        } else {
          // Fallback: try to get Lightning address for NWC
          const info = await webln.getInfo();
          if (info?.node?.alias?.includes('alby')) {
            // Alby detected, but no Nostr keys
            console.log('Alby detected but no Nostr keys available');
          }
        }
      } else {
        // Alby extension not found
        console.log('Alby extension not found');
      }
    } catch (error) {
      console.error('Alby connection error:', error);
    } finally {
      setAlbyConnecting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (showLogin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-md mx-auto px-4">
          <NostrLogin 
            onSuccess={() => setShowLogin(false)}
            onCancel={() => setShowLogin(false)}
          />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-md mx-auto px-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Nostr Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sign in with your Nostr key to access enhanced features
            </p>
          </div>
          
          {/* Alby Browser Extension Integration */}
          <div className="mb-6">
            <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Chrome className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  Alby Browser Extension
                </h3>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                Connect your Alby wallet for seamless Nostr authentication and Lightning payments
              </p>
              
              <button
                onClick={handleAlbyConnection}
                disabled={albyConnecting}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {albyConnecting ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Chrome className="w-5 h-5" />
                )}
                <span>
                  {albyConnecting ? 'Connecting...' : 'Connect with Alby'}
                </span>
              </button>
              
              <div className="mt-3 text-xs text-blue-700 dark:text-blue-300">
                <p>• Automatically detects your Nostr keys from Alby</p>
                <p>• Enables Lightning payments and boosts</p>
                <p>• No need to manually copy/paste keys</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                or
              </span>
            </div>
          </div>
          
          <button
            onClick={() => setShowLogin(true)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            <Key className="w-5 h-5" />
            <span>Sign In with Nostr Keys</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Nostr Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your Nostr integration and profile
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-6">
              <User className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Profile
              </h2>
            </div>

            <div className="space-y-4">
              {user.profile?.picture && (
                <div className="flex items-center space-x-4">
                  <img
                    src={user.profile.picture}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {user.profile.name || 'Anonymous'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.npub}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Public Key (npub)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={user.npub}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-sm font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(user.npub)}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {user.profile?.about && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bio
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.profile.about}
                    </p>
                  </div>
                )}

                {user.profile?.website && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Website
                    </label>
                    <a
                      href={user.profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                    >
                      <span>{user.profile.website}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {user.profile?.lud16 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Lightning Address
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.profile.lud16}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Profile</span>
              </button>
            </div>
          </div>

          {/* Social Data Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Users className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Social Data
              </h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user.following?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Following
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user.followers?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Followers
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p>• Social data is fetched from Nostr relays</p>
                <p>• Used to enhance your experience on HPM Lightning</p>
                <p>• Helps identify mutual connections and recommendations</p>
              </div>
            </div>
          </div>

          {/* NWC Integration Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Zap className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Lightning Integration
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                {hasNWCCapability ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    NWC Compatibility
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {hasNWCCapability 
                      ? 'Your profile supports NWC integration'
                      : 'Your profile may not support NWC integration'
                    }
                  </p>
                </div>
              </div>

              {hasNWCCapability && (
                <button
                  onClick={handleAutoConfigureNWC}
                  disabled={nwcConfiguring}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>{nwcConfiguring ? 'Configuring...' : 'Auto-configure NWC'}</span>
                </button>
              )}

              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p>• NWC enables seamless Lightning payments</p>
                <p>• Auto-configuration uses your Nostr profile data</p>
                <p>• Compatible with Alby Hub, Mutiny, and other NWC wallets</p>
              </div>
            </div>
          </div>

          {/* Alby Integration Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Chrome className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Alby Integration
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                {albyConnected ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Browser Extension Status
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {albyConnected 
                      ? 'Connected via Alby browser extension'
                      : 'Alby extension not detected or not connected'
                    }
                  </p>
                </div>
              </div>

              {!albyConnected && (
                <button
                  onClick={handleAlbyConnection}
                  disabled={albyConnecting}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Chrome className="w-4 h-4" />
                  <span>{albyConnecting ? 'Connecting...' : 'Connect Alby Extension'}</span>
                </button>
              )}

              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p>• Alby provides seamless Nostr key management</p>
                <p>• Automatic Lightning payment integration</p>
                <p>• Enhanced security with browser-based key storage</p>
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <a
                  href="https://getalby.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Install Alby Extension</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Account Actions Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Settings className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Account Actions
              </h2>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setShowLogin(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Key className="w-4 h-4" />
                <span>Switch Account</span>
              </button>

              <button
                onClick={logout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>

              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p>• Your keys are stored locally and encrypted</p>
                <p>• Signing out clears all local data</p>
                <p>• You can always sign back in with your keys</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
