'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface BitcoinConnectContextType {
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
  checkConnection: () => void;
}

const BitcoinConnectContext = createContext<BitcoinConnectContextType | undefined>(undefined);

export function BitcoinConnectProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);

  const checkConnection = async () => {
    try {
      // Check for WebLN (Alby, etc.)
      const weblnExists = !!(window as any).webln;
      const weblnEnabled = weblnExists && !!(window as any).webln?.enabled;
      
      // Check Bitcoin Connect state - enhanced for AlbyGo detection
      const bcConnected = localStorage.getItem('bc:connectorType');
      let bcConfig = null;
      let nwcConnected = localStorage.getItem('nwc_connection_string');
      
      try {
        const bcConfigRaw = localStorage.getItem('bc:config');
        if (bcConfigRaw) {
          // Clean up potential JSON formatting issues
          const cleanConfigRaw = bcConfigRaw.trim();
          if (cleanConfigRaw.startsWith('{') && cleanConfigRaw.endsWith('}')) {
            bcConfig = JSON.parse(cleanConfigRaw);
            // AlbyGo might store NWC URL in bc:config
            if (bcConfig && bcConfig.nwcUrl && !nwcConnected) {
              nwcConnected = bcConfig.nwcUrl;
            }
          } else {
            console.warn('bc:config is not valid JSON format:', bcConfigRaw);
            bcConfig = null;
          }
        }
      } catch (error) {
        console.warn('Failed to parse bc:config:', error, 'Raw value:', localStorage.getItem('bc:config'));
        bcConfig = null;
      }
      
      // Debug: Log all Bitcoin Connect related localStorage items (only if there are any)
      const bcKeys = Object.keys(localStorage).filter(k => k.startsWith('bc') || k.includes('nwc') || k.includes('alby'));
      if (bcKeys.length > 0) {
        console.log('🔍 Bitcoin Connect localStorage debug:', {
          bcConnectorType: bcConnected,
          bcConfig: bcConfig,
          nwcConnectionString: nwcConnected,
          allLocalStorageKeys: bcKeys,
          allLocalStorageData: Object.fromEntries(
            bcKeys.map(k => [k, localStorage.getItem(k)])
          )
        });
      }
      
      // Try to enable WebLN if it exists but isn't enabled
      let weblnEnabledAfter = weblnEnabled;
      if (weblnExists && !weblnEnabled) {
        try {
          await (window as any).webln.enable();
          // Wait a moment for the state to update
          await new Promise(resolve => setTimeout(resolve, 100));
          weblnEnabledAfter = !!(window as any).webln?.enabled;
          console.log('🔗 WebLN enabled successfully, new state:', weblnEnabledAfter);
        } catch (error) {
          console.log('🔗 WebLN enable failed or cancelled by user:', error);
          weblnEnabledAfter = false;
        }
      } else {
        weblnEnabledAfter = weblnEnabled;
      }
      
      // Temporarily disable NWC service to avoid Nostr filter errors
      let nwcServiceConnected = false;
      /*
      try {
        const { getNWCService } = await import('../lib/nwc-service');
        const nwcService = getNWCService();
        
        // If we have an NWC connection string but service isn't connected, try to connect
        if (nwcConnected && !nwcService.isConnected()) {
          console.log('🔄 Initializing NWC service with connection string');
          await nwcService.connect(nwcConnected);
        }
        
        nwcServiceConnected = nwcService.isConnected();
      } catch (error) {
        console.warn('NWC service connection failed:', error);
        nwcServiceConnected = false;
      }
      */
      
      // More strict WebLN checks - methods must exist AND be enabled
      const hasWeblnMethods = weblnExists && (
        typeof (window as any).webln?.makeInvoice === 'function' ||
        typeof (window as any).webln?.sendPayment === 'function' ||
        typeof (window as any).webln?.keysend === 'function'
      );
      
      // Only consider WebLN "connected" if it's actually enabled, not just if methods exist
      const finalWeblnStatus = weblnEnabledAfter && hasWeblnMethods;

      // Check if AlbyGo or other BC connectors are properly connected
      const bcConnectorConnected = !!(bcConnected || (bcConfig && (bcConfig.connectorType || bcConfig.nwcUrl)));
      
      const anyConnection = finalWeblnStatus || bcConnectorConnected || nwcConnected || nwcServiceConnected;

      // Debug logging (only log if there's a change or if debugging is enabled)
      if (process.env.NODE_ENV === 'development' && (weblnExists || bcConnected || nwcConnected)) {
        console.log('🔍 Connection check:', {
          weblnExists,
          weblnEnabled: weblnEnabledAfter, 
          hasWeblnMethods,
          finalWeblnStatus,
          bcConnected: !!bcConnected,
          bcConnectorConnected,
          nwcConnected: !!nwcConnected,
          nwcServiceConnected,
          anyConnection
        });
      }
      
      // Only log if connection status actually changed to reduce console spam
      const currentStatus = !!anyConnection;
      if (isConnected !== currentStatus) {
        console.log('🔄 Bitcoin Connect status changed:', currentStatus ? 'connected' : 'disconnected');
      }
      
      setIsConnected(currentStatus);
      return !!anyConnection;
    } catch (error) {
      console.error('Error checking connection:', error);
      return false;
    }
  };

  useEffect(() => {
    // Initial check
    checkConnection();
    
    // Listen for Bitcoin Connect events
    const handleConnected = () => {
      console.log('🔗 Global Bitcoin Connect wallet connected');
      checkConnection();
    };
    
    const handleDisconnected = () => {
      console.log('🔗 Global Bitcoin Connect wallet disconnected');
      checkConnection();
    };

    window.addEventListener('bc:connected', handleConnected);
    window.addEventListener('bc:disconnected', handleDisconnected);
    
    // Listen for storage changes (in case BC updates localStorage from another tab/component)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (e.key.startsWith('bc:') || e.key.includes('nwc') || e.key.includes('alby'))) {
        console.log('🔄 Bitcoin Connect storage changed:', e.key, 'new value:', e.newValue);
        checkConnection();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Check connection status periodically (less frequently to avoid performance issues)
    const interval = setInterval(checkConnection, 30000); // Every 30 seconds instead of 2

    return () => {
      window.removeEventListener('bc:connected', handleConnected);
      window.removeEventListener('bc:disconnected', handleDisconnected);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <BitcoinConnectContext.Provider value={{ isConnected, setIsConnected, checkConnection }}>
      {children}
    </BitcoinConnectContext.Provider>
  );
}

export function useBitcoinConnect() {
  const context = useContext(BitcoinConnectContext);
  if (context === undefined) {
    throw new Error('useBitcoinConnect must be used within a BitcoinConnectProvider');
  }
  return context;
}