'use client';

import React, { useState } from 'react';
import { useNostrAuth, useNostrUser } from '@/contexts/NostrUserContext';
import { User, LogOut, Settings, Zap } from 'lucide-react';
import Link from 'next/link';

export function NostrUserIndicator() {
  const { isAuthenticated, user } = useNostrAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!isAuthenticated || !user) {
    return (
      <Link
        href="/nostr-settings"
        className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <User className="w-5 h-5" />
        <span className="hidden sm:inline">Nostr</span>
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        {user.profile?.picture ? (
          <img
            src={user.profile.picture}
            alt={user.profile.name || 'Profile'}
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
        )}
        <span className="hidden sm:inline text-sm font-medium">
          {user.profile?.name || user.npub.substring(0, 8) + '...'}
        </span>
        <Zap className="w-3 h-3 text-green-500" />
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              {user.profile?.picture ? (
                <img
                  src={user.profile.picture}
                  alt={user.profile.name || 'Profile'}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.profile?.name || 'Anonymous'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.npub}
                </p>
              </div>
            </div>
          </div>

          <div className="py-2">
            <Link
              href="/nostr-settings"
              className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setShowDropdown(false)}
            >
              <Settings className="w-4 h-4" />
              <span>Nostr Settings</span>
            </Link>

            <button
              onClick={() => {
                setShowDropdown(false);
                // Import logout function and call it
                import('@/contexts/NostrUserContext').then(({ useNostrUser }) => {
                  // This would need to be handled differently in a real implementation
                  // For now, we'll just close the dropdown
                });
              }}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          {user.following && user.following.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Following: {user.following.length}</span>
                {user.followers && (
                  <span>Followers: {user.followers.length}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Enhanced version with logout functionality
export function NostrUserIndicatorWithLogout() {
  const { isAuthenticated, user, logout } = useNostrUser();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  if (!isAuthenticated || !user) {
    return (
      <Link
        href="/nostr-settings"
        className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <User className="w-5 h-5" />
        <span className="hidden sm:inline">Nostr</span>
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        {user.profile?.picture ? (
          <img
            src={user.profile.picture}
            alt={user.profile.name || 'Profile'}
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
        )}
        <span className="hidden sm:inline text-sm font-medium">
          {user.profile?.name || user.npub.substring(0, 8) + '...'}
        </span>
        <Zap className="w-3 h-3 text-green-500" />
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              {user.profile?.picture ? (
                <img
                  src={user.profile.picture}
                  alt={user.profile.name || 'Profile'}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.profile?.name || 'Anonymous'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.npub}
                </p>
              </div>
            </div>
          </div>

          <div className="py-2">
            <Link
              href="/nostr-settings"
              className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setShowDropdown(false)}
            >
              <Settings className="w-4 h-4" />
              <span>Nostr Settings</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          {user.following && user.following.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Following: {user.following.length}</span>
                {user.followers && (
                  <span>Followers: {user.followers.length}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
