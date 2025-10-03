'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { nostrAuthService, type NostrUser } from '@/lib/nostr-auth-service';

interface NostrUserContextType {
  // User state
  user: NostrUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Authentication methods
  login: (keyString: string) => Promise<boolean>;
  logout: () => void;
  generateNewKeys: () => { secretKey: Uint8Array; publicKey: string; npub: string };

  // User data methods
  refreshProfile: () => Promise<void>;
  refreshSocialData: () => Promise<void>;

  // NWC integration
  hasNWCCapability: boolean;
  autoConfigureNWC: () => Promise<boolean>;
}

const NostrUserContext = createContext<NostrUserContextType | undefined>(undefined);

interface NostrUserProviderProps {
  children: ReactNode;
}

export function NostrUserProvider({ children }: NostrUserProviderProps) {
  const [user, setUser] = useState<NostrUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNWCCapability, setHasNWCCapability] = useState(false);

  // Initialize from stored session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const session = nostrAuthService.getUserSession();
        if (session) {
          setUser(session.user);
          setIsAuthenticated(true);

          // Check if user has NWC capability
          await checkNWCCapability(session.user);
        }
      } catch (error) {
        console.error('Error initializing Nostr session:', error);
        setError('Failed to restore session');
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, []);

  // Check if user has NWC capability based on profile
  const checkNWCCapability = useCallback(async (user: NostrUser) => {
    try {
      // Check if user has lud16 (Lightning address) in profile
      const hasLightningAddress = user.profile?.lud16;
      
      // Check if user follows NWC-compatible wallets or services
      const nwcServices = ['npub1alice', 'npub1bob']; // Add known NWC service pubkeys
      const followsNWCServices = user.following?.some(pubkey => 
        nwcServices.includes(pubkey)
      );

      setHasNWCCapability(!!(hasLightningAddress || followsNWCServices));
    } catch (error) {
      console.error('Error checking NWC capability:', error);
      setHasNWCCapability(false);
    }
  }, []);

  // Login with Nostr key
  const login = useCallback(async (keyString: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await nostrAuthService.authenticate(keyString);
      
      if (result.success && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
        
        // Store session
        const parsedKey = nostrAuthService.parseNostrKey(keyString);
        const secretKey = parsedKey?.type === 'nsec' ? parsedKey.secretKey : undefined;
        nostrAuthService.storeUserSession(result.user, secretKey);
        
        // Check NWC capability
        await checkNWCCapability(result.user);
        
        return true;
      } else {
        setError(result.error || 'Authentication failed');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [checkNWCCapability]);

  // Logout
  const logout = useCallback(() => {
    nostrAuthService.clearUserSession();
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    setHasNWCCapability(false);
  }, []);

  // Generate new key pair
  const generateNewKeys = useCallback(() => {
    return nostrAuthService.generateKeyPair();
  }, []);

  // Refresh user profile
  const refreshProfile = useCallback(async () => {
    if (!user) return;

    try {
      const updatedUser = await nostrAuthService.fetchUserProfile(user.pubkey);
      if (updatedUser) {
        setUser(updatedUser);
        
        // Update stored session
        const session = nostrAuthService.getUserSession();
        if (session) {
          nostrAuthService.storeUserSession(updatedUser, session.secretKey);
        }
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      setError('Failed to refresh profile');
    }
  }, [user]);

  // Refresh social data
  const refreshSocialData = useCallback(async () => {
    if (!user) return;

    try {
      const socialData = await nostrAuthService.fetchUserSocialData(user.pubkey);
      const updatedUser = {
        ...user,
        followers: socialData.followers,
        following: socialData.following
      };
      
      setUser(updatedUser);
      
      // Update stored session
      const session = nostrAuthService.getUserSession();
      if (session) {
        nostrAuthService.storeUserSession(updatedUser, session.secretKey);
      }
      
      // Recheck NWC capability
      await checkNWCCapability(updatedUser);
    } catch (error) {
      console.error('Error refreshing social data:', error);
      setError('Failed to refresh social data');
    }
  }, [user, checkNWCCapability]);

  // Auto-configure NWC for authenticated users
  const autoConfigureNWC = useCallback(async (): Promise<boolean> => {
    if (!user || !hasNWCCapability) return false;

    try {
      // Import NWC service
      const { getNWCService } = await import('@/lib/nwc-service');
      const nwcService = getNWCService();

      // Check if user has NWC connection string in profile or metadata
      const nwcConnectionString = user.profile?.website?.includes('nostr+walletconnect://') 
        ? user.profile.website 
        : null;

      if (nwcConnectionString) {
        await nwcService.connect(nwcConnectionString);
        return true;
      }

      // If no direct connection string, try to detect compatible wallets
      // This would require additional logic to detect user's preferred wallet
      return false;
    } catch (error) {
      console.error('Error auto-configuring NWC:', error);
      return false;
    }
  }, [user, hasNWCCapability]);

  // Listen for auto-login events from Bitcoin Connect (after all callbacks are defined)
  useEffect(() => {
    const handleAutoLogin = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { npub } = customEvent.detail;
      if (npub && !isAuthenticated) {
        console.log('🔑 Auto-login triggered from Bitcoin Connect');
        await login(npub);
      }
    };

    window.addEventListener('nostr:auto-login', handleAutoLogin);

    return () => {
      window.removeEventListener('nostr:auto-login', handleAutoLogin);
    };
  }, [isAuthenticated, login]);

  const value: NostrUserContextType = {
    // User state
    user,
    isAuthenticated,
    isLoading,
    error,

    // Authentication methods
    login,
    logout,
    generateNewKeys,

    // User data methods
    refreshProfile,
    refreshSocialData,

    // NWC integration
    hasNWCCapability,
    autoConfigureNWC
  };

  return (
    <NostrUserContext.Provider value={value}>
      {children}
    </NostrUserContext.Provider>
  );
}

// Hook to use Nostr user context
export function useNostrUser(): NostrUserContextType {
  const context = useContext(NostrUserContext);
  if (context === undefined) {
    throw new Error('useNostrUser must be used within a NostrUserProvider');
  }
  return context;
}

// Hook for Nostr authentication status
export function useNostrAuth() {
  const { isAuthenticated, user, isLoading, error } = useNostrUser();
  return { isAuthenticated, user, isLoading, error };
}

// Hook for NWC integration
export function useNostrNWC() {
  const { hasNWCCapability, autoConfigureNWC, user } = useNostrUser();
  return { hasNWCCapability, autoConfigureNWC, user };
}
