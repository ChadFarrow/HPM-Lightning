'use client';

import { useEffect, useState } from 'react';
import { Zap, Wallet } from 'lucide-react';
import { useBitcoinConnect } from '@/contexts/BitcoinConnectContext';
import { useBoostToNostr } from '@/hooks/useBoostToNostr';
import { useLightning } from '@/contexts/LightningContext';
import AlbyGoConnect from './AlbyGoConnect';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'bc-button': any;
      'bc-balance': any;
    }
  }
  interface Window {
    bitcoinConnectInitialized?: boolean;
  }
}

export function BitcoinConnectWallet() {
  const [mounted, setMounted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { isLightningEnabled } = useLightning();

  useEffect(() => {
    // Only initialize Bitcoin Connect if Lightning is enabled
    if (!isLightningEnabled) {
      return;
    }
    // Import Bitcoin Connect dynamically to avoid SSR issues
    const loadBitcoinConnect = async () => {
      try {
        const bc = await import('@getalby/bitcoin-connect');
        
        // Initialize Bitcoin Connect with basic configuration
        if (bc.init && !window.bitcoinConnectInitialized) {
          bc.init({
            appName: 'HPM Lightning',
            // Remove filters to show all wallet types including browser extensions
            showBalance: false, // Hide balance to keep UI clean
            // Enable all connectors including NWC
            filters: undefined
          });
          window.bitcoinConnectInitialized = true;
          console.log('🔌 Bitcoin Connect initialized with NWC support');
        }
        
        setMounted(true);
        
        // Listen for connection events
        const handleConnected = () => {
          console.log('🔗 Bitcoin Connect wallet connected');
          setIsConnected(true);
        };
        
        const handleDisconnected = () => {
          console.log('🔗 Bitcoin Connect wallet disconnected');
          setIsConnected(false);
        };

        window.addEventListener('bc:connected', handleConnected);
        window.addEventListener('bc:disconnected', handleDisconnected);

        // Check initial connection state
        if ((window as any).webln?.enabled) {
          setIsConnected(true);
        }

        // Hide only balance elements, preserve connection status
        const hideBalanceElements = () => {
          setTimeout(() => {
            // Get all bc-button elements
            const bcButtons = document.querySelectorAll('bc-button');
            
            bcButtons.forEach(bcButton => {
              // Try to access shadow root if available
              const shadowRoot = (bcButton as any).shadowRoot;
              if (shadowRoot) {
                // Hide only balance elements in shadow DOM
                const shadowElements = shadowRoot.querySelectorAll('*');
                shadowElements.forEach((el: any) => {
                  const text = el.textContent || '';
                  // Only hide if it contains balance numbers, not general connection text
                  if (text.match(/\d+[,\d]*\s*(sats?|sat)/i)) {
                    el.style.display = 'none';
                    el.style.visibility = 'hidden';
                  }
                });
              }
              
              // Check regular DOM elements - preserve connection status
              const allElements = (bcButton as unknown as HTMLElement).querySelectorAll('*');
              allElements.forEach(el => {
                const text = el.textContent || '';
                // Only hide balance numbers, preserve "Connected", "Disconnected" etc
                if (text.match(/^\d+[,\d]*\s*(sats?|sat)$/i)) {
                  (el as HTMLElement).style.display = 'none';
                  (el as HTMLElement).style.visibility = 'hidden';
                }
              });
            });
            
            // Only hide specific bc-balance elements
            const balanceElements = document.querySelectorAll('bc-balance');
            balanceElements.forEach(el => {
              (el as unknown as HTMLElement).style.display = 'none';
              (el as unknown as HTMLElement).style.visibility = 'hidden';
            });
          }, 500);
        };

        // Run balance hiding less frequently to avoid interfering with connection status
        const hideInterval = setInterval(hideBalanceElements, 3000);
        hideBalanceElements(); // Run once initially

        return () => {
          window.removeEventListener('bc:connected', handleConnected);
          window.removeEventListener('bc:disconnected', handleDisconnected);
          clearInterval(hideInterval);
        };
      } catch (error) {
        console.error('Failed to load Bitcoin Connect:', error);
      }
    };

    loadBitcoinConnect();
  }, [isLightningEnabled]);

  // Don't render anything if Lightning is disabled
  if (!isLightningEnabled) {
    return null;
  }

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg animate-pulse">
        <Zap className="w-4 h-4 text-yellow-500" />
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Standard Bitcoin Connect button */}
      <bc-button 
        disable-balance="true"
        hide-balance="true"
        show-balance="false"
        style={{
          '--bc-color-brand': '#eab308',
          '--bc-color-brand-dark': '#ca8a04',
          '--bc-show-balance': 'none',
          '--bc-balance-display': 'none',
        }}
      />
      
    </div>
  );
}

export function BitcoinConnectPayment({ 
  amount = 1000, 
  description = 'Support the creator',
  onSuccess,
  onError,
  className = '',
  recipient = '03740ea02585ed87b83b2f76317a4562b616bd7b8ec3f925be6596932b2003fc9e',
  recipients,
  enableBoosts = false,
  boostMetadata
}: {
  amount?: number;
  description?: string;
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  className?: string;
  recipient?: string;
  recipients?: Array<{ address: string; split: number; name?: string; fee?: boolean; type?: string; fixedAmount?: number }>;
  enableBoosts?: boolean;
  boostMetadata?: {
    title?: string;
    artist?: string;
    album?: string;
    imageUrl?: string;
    podcastFeedGuid?: string;
    podcastGuid?: string; // podcast:guid at item level
    episode?: string;
    feedUrl?: string;
    itemGuid?: string;
    timestamp?: number;
    senderName?: string;
    appName?: string;
    url?: string;
    publisherGuid?: string;
    publisherUrl?: string;
    message?: string; // Boostagram message
  };
}) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isConnected } = useBitcoinConnect();
  const { isLightningEnabled } = useLightning();

  // Debug: Log when isConnected state changes
  useEffect(() => {
    console.log('🔗 BitcoinConnectPayment - isConnected state changed:', isConnected);
  }, [isConnected]);

  // Force re-render when connection state changes to eliminate React rendering delays
  const [renderKey, setRenderKey] = useState(0);
  useEffect(() => {
    setRenderKey(prev => prev + 1);
  }, [isConnected]);
  
  // Initialize Nostr boost system if boosts are enabled
  const { postBoost, generateKeys, publicKey } = useBoostToNostr({ 
    autoGenerateKeys: enableBoosts && typeof window !== 'undefined'
  });


  // Helper function to create enhanced TLV records for boosts following podcast namespace spec
  const createBoostTLVRecords = async (recipientName?: string) => {
    const tlvRecords = [];
    
    if (boostMetadata) {
      // 7629169 - Podcast metadata JSON (bLIP-10 standard - Breez/Fountain compatible)
      // Fixed to match working Castamatic format
      const podcastMetadata = {
        podcast: boostMetadata.artist || 'Unknown Artist',
        episode: boostMetadata.title || 'Unknown Title',
        action: 'boost',
        app_name: boostMetadata.appName || 'HPM Lightning',
        // Use actual feed URL from metadata for proper Helipad recognition
        feed: boostMetadata.feedUrl || 'https://www.doerfelverse.com/feeds/intothedoerfelverse.xml',
        url: boostMetadata.feedUrl || 'https://www.doerfelverse.com/feeds/intothedoerfelverse.xml',
        message: boostMetadata.message || '',
        ...(boostMetadata.timestamp && { ts: boostMetadata.timestamp }),
        // Use proper feedId (lowercase 'd') for Helipad compatibility - it expects feedId not feedID
        feedId: boostMetadata.feedUrl === 'https://www.doerfelverse.com/feeds/bloodshot-lies-album.xml' ? "6590183" : "6590182",
        // Add Helipad-specific GUID fields
        ...(boostMetadata.itemGuid && { episode_guid: boostMetadata.itemGuid }),
        ...(boostMetadata.itemGuid && { remote_item_guid: boostMetadata.itemGuid }),
        ...(boostMetadata.podcastFeedGuid && { remote_feed_guid: boostMetadata.podcastFeedGuid }),
        ...(boostMetadata.album && { album: boostMetadata.album }),
        value_msat_total: amount * 1000,
        sender_name: boostMetadata.senderName || 'Anonymous',
        uuid: `boost-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Unique identifier
        app_version: '1.0.0', // App version
        value_msat: recipients ? Math.floor((amount * 1000) / recipients.length) : amount * 1000, // Individual payment amount
        name: 'HPM Lightning' // App/service name
      };
      
      // Log the exact TLV data for debugging (matching payment-utils.ts)
      console.log('🔍 HELIPAD DEBUG - Exact TLV 7629169 data being sent:');
      console.log(JSON.stringify(podcastMetadata, null, 2));
      
      tlvRecords.push({
        type: 7629169,
        value: Buffer.from(JSON.stringify(podcastMetadata), 'utf8').toString('hex')
      });
      
      // 7629171 - Tip note/message (Lightning spec compliant) - only if custom message provided
      if (boostMetadata.message) {
        tlvRecords.push({
          type: 7629171,
          value: Buffer.from(boostMetadata.message, 'utf8').toString('hex')
        });
      }
      
      // 133773310 - Sphinx compatibility (JSON encoded data)
      const sphinxData = {
        podcast: boostMetadata.artist || 'Unknown Artist',
        episode: boostMetadata.title || 'Unknown Title', 
        action: 'boost',
        app: boostMetadata.appName || 'HPM Lightning',
        message: boostMetadata.message || '',
        amount: amount,
        sender: boostMetadata.senderName || 'Anonymous',
        ...(boostMetadata.timestamp && { timestamp: boostMetadata.timestamp })
      };
      
      tlvRecords.push({
        type: 133773310,
        value: Buffer.from(JSON.stringify(sphinxData), 'utf8').toString('hex')
      });
      
    } else {
      // Fallback for non-boost payments - simple message
      const message = `${description}${recipientName ? ` - ${recipientName}` : ''}`;
      tlvRecords.push({
        type: 7629171, // Use tip note format
        value: Buffer.from(message, 'utf8').toString('hex')
      });
    }
    
    // Log total TLV record count for debugging
    console.log(`🔍 HELIPAD DEBUG - Total TLV records created: ${tlvRecords.length}`);
    
    return tlvRecords;
  };

  // Helper function to convert TLV records to WebLN customRecords format  
  const createWebLNCustomRecords = async (recipientName?: string) => {
    const tlvRecords = await createBoostTLVRecords(recipientName);
    const customRecords: { [key: number]: string } = {};
    
    tlvRecords.forEach(record => {
      // Convert hex back to string for WebLN
      const value = Buffer.from(record.value, 'hex').toString('utf8');
      customRecords[record.type] = value;
    });
    
    return customRecords;
  };

  useEffect(() => {
    // Only load Bitcoin Connect if Lightning is enabled
    if (!isLightningEnabled) {
      return;
    }
    
    const loadBitcoinConnect = async () => {
      try {
        await import('@getalby/bitcoin-connect');
        setMounted(true);
      } catch (error) {
        console.error('Failed to load Bitcoin Connect:', error);
      }
    };

    loadBitcoinConnect();
  }, [isLightningEnabled]);

  // Helper function to create Nostr boost notes after successful payments
  const handleBoostCreation = async (paymentResults: any[], totalAmount: number) => {
    try {
      console.log('🔍 Boost creation conditions check:', {
        enableBoosts: !!enableBoosts,
        boostMetadata: !!boostMetadata,
        publicKey: !!publicKey,
        postBoost: !!postBoost
      });
      
      if (!enableBoosts || !boostMetadata || !publicKey) {
        console.log('❌ Boost creation blocked - missing required conditions');
        return;
      }

      console.log('🎵 Creating Nostr boost note for successful payments...');
      console.log('🔍 Raw boostMetadata received:', JSON.stringify(boostMetadata, null, 2));
      console.log('🔍 boostMetadata keys:', Object.keys(boostMetadata || {}));
      console.log('🔍 boostMetadata values:', {
        itemGuid: boostMetadata?.itemGuid,
        podcastFeedGuid: boostMetadata?.podcastFeedGuid,
        podcastGuid: boostMetadata?.podcastGuid,
        publisherGuid: boostMetadata?.publisherGuid
      });
      
      // Use the intended amount rather than actual amount paid
      // This shows what the user intended to boost, not just what succeeded
      
      // Create boost note using the Nostr boost system
      if (!postBoost) {
        console.warn('⚠️ postBoost function not available');
        return;
      }
      
      // Create boost with intended amount and metadata
      // Map boostMetadata to TrackMetadata format using correct property names
      const trackMetadata = {
        title: boostMetadata.title,
        artist: boostMetadata.artist,
        album: boostMetadata.album,
        url: boostMetadata.url,
        imageUrl: boostMetadata.imageUrl,
        senderName: boostMetadata.senderName,
        guid: boostMetadata.itemGuid, // Map itemGuid to guid
        podcastGuid: boostMetadata.podcastGuid,
        feedGuid: boostMetadata.podcastFeedGuid, // Map podcastFeedGuid to feedGuid
        feedUrl: boostMetadata.feedUrl,
        publisherGuid: boostMetadata.publisherGuid,
        publisherUrl: boostMetadata.publisherUrl
      };
      
      console.log('🔍 Mapped trackMetadata:', JSON.stringify(trackMetadata, null, 2));
      
      const boostResult = await postBoost(
        totalAmount, 
        trackMetadata,
        boostMetadata.message // Pass custom message as comment
      );
      
      if (boostResult.success) {
        console.log('✅ Nostr boost note created:', boostResult.eventId);
        console.log('📝 Boost note published to Nostr with podcast metadata');
      } else {
        console.warn('⚠️ Failed to create boost note:', boostResult.error);
      }
    } catch (error) {
      console.warn('⚠️ Failed to create boost note:', error);
    }
  };

  const handlePayment = async () => {
    // Use enhanced detection logic similar to context
    const weblnExists = !!(window as any).webln;
    const weblnEnabled = weblnExists && !!(window as any).webln?.enabled;
    const hasWeblnMethods = weblnExists && (
      typeof (window as any).webln?.makeInvoice === 'function' ||
      typeof (window as any).webln?.sendPayment === 'function' ||
      typeof (window as any).webln?.keysend === 'function'
    );
    const weblnAvailable = weblnEnabled || hasWeblnMethods;
    
    console.log('🔌 Bitcoin Connect payment attempt:', {
      isConnected,
      weblnExists,
      weblnEnabled,
      hasWeblnMethods,
      weblnAvailable
    });
    
    setLoading(true);
    try {
      const webln = (window as any).webln;
      
      // Determine recipients to use
      const paymentsToMake = recipients || [{ address: recipient, split: 100, name: 'Single recipient' }];
      
      console.log(`⚡ Processing payments to ${paymentsToMake.length} recipients:`, paymentsToMake);
      
      // Calculate total split value for proportional payments
      const totalSplit = paymentsToMake.reduce((sum, r) => sum + r.split, 0);
      const results: any[] = [];
      
      // Check Bitcoin Connect's preferred connection method
      let bcConfig = null;
      let bcConnectorType = null;
      let nwcConnectionString = null;
      
      try {
        const bcConfigRaw = localStorage.getItem('bc:config');
        if (bcConfigRaw) {
          bcConfig = JSON.parse(bcConfigRaw);
          bcConnectorType = bcConfig.connectorType;
          nwcConnectionString = bcConfig.nwcUrl;
        }
      } catch (error) {
        console.warn('Failed to parse bc:config:', error);
      }
      
      // Fallback to old method
      if (!bcConnectorType) {
        bcConnectorType = localStorage.getItem('bc:connectorType');
      }
      if (!nwcConnectionString) {
        nwcConnectionString = localStorage.getItem('nwc_connection_string');
      }
      
      console.log(`🔍 Bitcoin Connect state - connectorType: "${bcConnectorType}", NWC URL exists: ${!!nwcConnectionString}`);
      
      // Respect Bitcoin Connect's connector choice
      let shouldUseNWC = false;
      let nwcService = null;
      
      // Check if this is a Cashu wallet early
      const isCashuWallet = bcConnectorType === 'nwc.cashume' || 
                           bcConnectorType === 'nwc.cashu' ||
                           (nwcConnectionString && (nwcConnectionString.includes('cashu') || nwcConnectionString.includes('mint')));
      
      if (isCashuWallet) {
        console.log('🥜 Cashu wallet detected - keysend payments will be filtered out');
      }

      // If user selected NWC in Bitcoin Connect, prioritize that
      if (bcConnectorType === 'nwc.generic' || bcConnectorType === 'nwc' || bcConnectorType === 'nwc.cashume' || bcConnectorType === 'nwc.cashu' || (bcConnectorType && nwcConnectionString)) {
        try {
          const { getNWCService } = await import('../lib/nwc-service');
          nwcService = getNWCService();
          
          if (nwcConnectionString && !nwcService.isConnected()) {
            await nwcService.connect(nwcConnectionString);
            
            // Initialize keysend bridge after NWC connection
            if (nwcService.isConnected()) {
              try {
                const { getKeysendBridge } = await import('../lib/nwc-keysend-bridge');
                const bridge = getKeysendBridge();
                await bridge.initialize({
                  userWalletConnection: nwcConnectionString
                });
                
                const capabilities = bridge.getCapabilities();
                if (capabilities.hasBridge && !capabilities.supportsKeysend) {
                  console.log('🌉 Keysend bridge initialized for non-keysend wallet');
                }
              } catch (bridgeError) {
                console.warn('Failed to initialize keysend bridge:', bridgeError);
              }
            }
          }
          
          shouldUseNWC = nwcService.isConnected();
          console.log(`🔍 NWC connection attempt: ${shouldUseNWC ? 'successful' : 'failed'}`);
        } catch (error) {
          console.warn('NWC service failed:', error);
          shouldUseNWC = false;
        }
      }
      
      // Analyze recipients to determine optimal payment method
      // PRIORITIZE LIGHTNING ADDRESSES OVER KEYSEND - more reliable and faster
      const processedPayments = paymentsToMake.map(r => {
        // Convert misclassified Lightning addresses (most common case)
        if (r.type === 'node' && r.name && r.name.includes('@') && !r.name.includes('livewire.io')) {
          console.log(`⚡ PRIORITIZING Lightning address: ${r.name} (was misclassified as node)`);
          return {
            ...r,
            type: 'lnaddress',
            address: r.name, // Use the Lightning address from name field
            originalAddress: r.address, // Keep original node address as backup
            name: r.name.split('@')[0] // Clean up name
          };
        }
        
        // Also check if the address field itself contains a Lightning address
        if (r.address && r.address.includes('@') && !r.address.includes('livewire.io')) {
          console.log(`⚡ PRIORITIZING Lightning address: ${r.address} (converting from any type to lnaddress)`);
          return {
            ...r,
            type: 'lnaddress',
            address: r.address,
            originalAddress: r.address,
            name: r.name || r.address.split('@')[0]
          };
        }
        
        return r;
      });
      
      const nodeRecipients = processedPayments.filter(r => r.type === 'node' || (r.address && r.address.length === 66 && !r.address.includes('@')));
      const lnAddressRecipients = processedPayments.filter(r => r.type === 'lnaddress' || (r.address && r.address.includes('@')));
      
      console.log(`🔍 Recipient analysis: ${nodeRecipients.length} keysend, ${lnAddressRecipients.length} Lightning addresses`);
      console.log(`⚡ LIGHTNING ADDRESS PRIORITY: ${lnAddressRecipients.length > 0 ? 'Lightning addresses detected - prioritizing faster, more reliable payments' : 'No Lightning addresses found'}`);
      
      // Comprehensive automatic routing: analyze all scenarios
      // PRIORITIZE Lightning addresses when available - they're faster and more reliable
      let useNWC = shouldUseNWC;
      let routingReason = 'default preference';
      
      // Check bridge availability once for all scenarios
      const bridgeConfigResponse = await fetch('/api/bridge-config').catch(() => null);
      const bridgeConfig = await bridgeConfigResponse?.json().catch(() => null);
      const bridgeAvailable = bridgeConfig?.isConfigured || false;
      
      // 🎯 RESPECT USER'S WALLET CHOICE FIRST
      // If user explicitly selected an NWC wallet, respect that choice
      if (shouldUseNWC && bcConnectorType && bcConnectorType.includes('nwc')) {
        console.log('🎯 User selected NWC wallet → Respecting user choice');
        useNWC = true;
        routingReason = 'User explicitly selected NWC wallet';
      } else if (lnAddressRecipients.length > 0 && nodeRecipients.length === 0) {
        // LIGHTNING ADDRESS OPTIMIZATION: If all payments are Lightning addresses, prefer the most compatible method
        if (shouldUseNWC) {
          console.log('⚡ Smart routing: All Lightning addresses → NWC optimal for Lightning addresses');
          useNWC = true;
          routingReason = 'Lightning addresses work best with NWC';
        } else if (weblnAvailable) {
          console.log('⚡ Smart routing: All Lightning addresses → WebLN universal compatibility');
          useNWC = false;
          routingReason = 'Lightning addresses work universally with WebLN';
        }
      } else if (weblnAvailable && nodeRecipients.length > 0 && !shouldUseNWC) {
        // Only use WebLN if user hasn't explicitly chosen NWC and we have keysend payments
        console.log('🧠 Smart routing: WebLN available for keysend → Using for compatibility');
        useNWC = false;
        routingReason = 'WebLN keysend for compatibility (no NWC preference)';
      } else if (shouldUseNWC && isCashuWallet) {
        // CASHU WALLET SCENARIOS
        if (nodeRecipients.length > 0 && lnAddressRecipients.length > 0) {
          // Mixed recipients: keysend + Lightning addresses
          if (bridgeAvailable) {
            console.log('🧠 Smart routing: Cashu + mixed recipients → Bridge enables full compatibility');
            useNWC = true;
            routingReason = 'bridge handles keysend, Cashu handles Lightning addresses';
          } else if (weblnAvailable) {
            console.log('🧠 Smart routing: Cashu + mixed recipients → WebLN better without bridge');
            useNWC = false;
            routingReason = 'WebLN handles all payment types natively';
          } else {
            console.log('🧠 Smart routing: Cashu + mixed recipients → Partial payments only');
            useNWC = true;
            routingReason = 'only Lightning addresses will succeed';
          }
        } else if (nodeRecipients.length > 0) {
          // Only keysend recipients
          if (bridgeAvailable) {
            console.log('🧠 Smart routing: Cashu + keysend only → Bridge enables compatibility');
            useNWC = true;
            routingReason = 'bridge converts keysend to invoices';
          } else if (weblnAvailable) {
            console.log('🧠 Smart routing: Cashu + keysend only → WebLN better without bridge');
            useNWC = false;
            routingReason = 'WebLN supports keysend natively';
          } else {
            console.log('🧠 Smart routing: Cashu + keysend only → No viable method available');
            useNWC = false;
            routingReason = 'Cashu wallets cannot send keysend without bridge';
          }
        } else {
          // Only Lightning addresses - PERFECT for Cashu wallets
          console.log('⚡ Smart routing: Cashu + Lightning addresses only → OPTIMAL match');
          useNWC = true;
          routingReason = 'Lightning addresses are perfect for Cashu wallets';
        }
      } else if (shouldUseNWC && !isCashuWallet) {
        // NON-CASHU NWC WALLET SCENARIOS
        if (lnAddressRecipients.length > 0) {
          console.log('⚡ Smart routing: NWC wallet + Lightning addresses → OPTIMAL');
          useNWC = true;
          routingReason = 'Lightning addresses work perfectly with NWC';
        } else if (nodeRecipients.length > 0) {
          console.log('🧠 Smart routing: NWC wallet + keysend → Checking native support');
          useNWC = true;
          routingReason = 'NWC wallet should support keysend natively';
        }
      } else if (weblnAvailable) {
        // WEBLN ONLY SCENARIOS
        console.log('🧠 Smart routing: WebLN available → Universal compatibility');
        useNWC = false;
        routingReason = 'WebLN supports all payment types natively';
      } else {
        // NO WALLET AVAILABLE
        console.log('🧠 Smart routing: No wallet available → Will prompt for connection');
        useNWC = false;
        routingReason = 'no wallet connected';
      }
      
      console.log(`🔍 Payment method selection: BC connector: "${bcConnectorType}", Use NWC: ${useNWC}, WebLN available: ${weblnAvailable}, Reason: ${routingReason}`);
      
      // Use the smart routing decision
      if (useNWC && nwcService) {
        console.log(`⚡ Bitcoin Connect using NWC (prioritized): ${amount} sats split among recipients`);
        
        // Check if we need bridge mode before creating payment promises
        let usingBridge = false;
        let sharedBridge: any = null;
        try {
          const { getKeysendBridge } = await import('../lib/nwc-keysend-bridge');
          sharedBridge = getKeysendBridge();
          
          // Try to initialize bridge if not already initialized
          if (!sharedBridge.getCapabilities().walletName || sharedBridge.getCapabilities().walletName === 'Unknown') {
            console.log('🔄 Pre-initializing bridge for all payments...');
            await sharedBridge.initialize({
              userWalletConnection: nwcConnectionString
            });
          }
          
          const capabilities = sharedBridge.getCapabilities();
          usingBridge = sharedBridge.needsBridge();
          
          if (isCashuWallet && usingBridge) {
            console.log(`🥜🌉 Cashu wallet will use keysend bridge for full compatibility`);
          }
          
          console.log(`🔍 Bridge mode pre-check: ${usingBridge ? 'ENABLED' : 'DISABLED'} (wallet: ${capabilities.walletName}, supportsKeysend: ${capabilities.supportsKeysend}, hasBridge: ${capabilities.hasBridge})`);
        } catch (error) {
          console.warn('Could not pre-check bridge capabilities:', error);
        }
        
        // Process payments based on bridge mode
        const paymentPromises = processedPayments.map(async (recipientData) => {
          // Calculate amount: use fixed amount if specified, otherwise proportional split
          const recipientAmount = (recipientData as any).fixedAmount || Math.floor((amount * recipientData.split) / totalSplit);
          
          if (recipientAmount <= 0) {
            console.log(`⏭️ Skipping ${recipientData.name || recipientData.address} - calculated amount is 0 sats`);
            return null;
          }
          
          // Skip known offline nodes temporarily 
          if (recipientData.address === '035ad2c954e264004986da2d9499e1732e5175e1dcef2453c921c6cdcc3536e9d8') {
            console.log(`⏭️ Skipping ${recipientData.name || recipientData.address} - node temporarily offline`);
            return null;
          }
          
          console.log(`⚡ NWC sending ${recipientAmount} sats to ${recipientData.name || recipientData.address.slice(0, 10)}... (${recipientData.split}/${totalSplit} split)`);
          
          try {
            let response;
            
            // Handle different payment types for NWC
            if (recipientData.type === 'lnaddress' || (recipientData.address && recipientData.address.includes('@'))) {
              // For Lightning addresses, resolve to invoice and pay
              console.log(`🔗 NWC resolving Lightning address: ${recipientData.address}`);
              const comment = `Boost for "${description}" by ${recipientData.name || 'Unknown'}`;
              
              response = await nwcService.payLightningAddress(
                recipientData.address,
                recipientAmount,
                comment
              );
            } else {
              // For node public keys, use keysend with TLV records
              console.log(`⚡ NWC sending keysend to node: ${recipientData.address}`);
              const tlvRecords = await createBoostTLVRecords(recipientData.name || 'Recipient');
              
              // DEBUG: Log detailed keysend data and compare with working format
              const ourTlvData = tlvRecords.map(r => {
                try {
                  return {
                    type: r.type,
                    data: JSON.parse(Buffer.from(r.value, 'hex').toString('utf8'))
                  };
                } catch {
                  return {
                    type: r.type,
                    data: Buffer.from(r.value, 'hex').toString('utf8')
                  };
                }
              });

              console.log('🔍 KEYSEND DEBUG - OUR APP:', {
                recipient: recipientData.name || 'Unknown',
                pubkey: recipientData.address,
                amount: recipientAmount,
                tlvRecordCount: tlvRecords.length,
                tlvTypes: tlvRecords.map(r => r.type),
                ourTlvData: ourTlvData
              });

              console.log('🔍 COMPARISON - WORKING vs OUR FORMAT:');
              console.log('✅ WORKING (Castamatic to Sovereign Feeds):');
              console.log('  feedID: 6590182 (numeric)');
              console.log('  episode_guid: b4578bea-855b-48a6-a747-1a09ed44a19a');
              console.log('  url: https://www.doerfelverse.com/feeds/intothedoerfelverse.xml');
              console.log('❓ OUR APP (HPM Lightning):');
              console.log(`  feedId: ${boostMetadata?.feedUrl === 'https://www.doerfelverse.com/feeds/bloodshot-lies-album.xml' ? "6590183" : "6590182"} (FIXED: using lowercase feedId for Helipad)`);
              console.log(`  episode_guid: ${boostMetadata?.itemGuid || 'missing'}`);
              console.log(`  url: ${boostMetadata?.feedUrl || 'RSS feed URL'}`);
              
              // Check if we should use the keysend bridge
              try {
                const { getKeysendBridge } = await import('../lib/nwc-keysend-bridge');
                // Use the shared bridge instance that was pre-initialized
                const bridge = sharedBridge || getKeysendBridge();
                
                // Bridge should already be initialized from pre-check, no need to re-initialize
                const capabilities = bridge.getCapabilities();
                console.log('🔍 Bridge capabilities:', capabilities);
                
                if (capabilities.hasBridge && !capabilities.supportsKeysend) {
                  // Use bridge for non-keysend wallets
                  console.log('🌉 Using keysend bridge for payment');
                  const bridgeResult = await bridge.payKeysend({
                    pubkey: recipientData.address,
                    amount: recipientAmount,
                    tlvRecords,
                    description: `Boost to ${recipientData.name || 'recipient'}`
                  });
                  
                  if (bridgeResult.success) {
                    response = { preimage: bridgeResult.preimage };
                  } else {
                    response = { error: bridgeResult.error };
                  }
                } else {
                  // Direct keysend payment
                  console.log('⚡ Using direct keysend payment');
                  response = await nwcService.payKeysend(
                    recipientData.address,
                    recipientAmount,
                    tlvRecords
                  );
                }
              } catch (bridgeError) {
                console.warn('🌉 Bridge error:', bridgeError);
                
                // For Cashu wallets, don't fall back to direct keysend since they don't support it
                if (isCashuWallet) {
                  console.error('🥜 Cashu wallet keysend failed - bridge required but not available');
                  response = { 
                    error: 'Keysend payments require a bridge for Cashu wallets, but the bridge is not available. Please try using a different wallet or check your connection.' 
                  };
                } else {
                  console.warn('🔄 Falling back to direct keysend for non-Cashu wallet');
                  // Fallback to direct keysend payment for non-Cashu wallets
                  response = await nwcService.payKeysend(
                    recipientData.address,
                    recipientAmount,
                    tlvRecords
                  );
                }
              }
            }
            
            if (response.error) {
              console.error(`❌ NWC payment to ${recipientData.name || recipientData.address} failed:`, response.error);
              throw new Error(`Payment to ${recipientData.name || recipientData.address} failed: ${response.error}`);
            } else {
              console.log(`✅ NWC payment to ${recipientData.name || recipientData.address} successful:`, response);
              return { 
                recipient: recipientData.name || recipientData.address, 
                amount: recipientAmount, 
                response,
                address: recipientData.address,
                type: recipientData.type === 'lnaddress' || (recipientData.address && recipientData.address.includes('@')) ? 'Lightning Address' : 'Keysend',
                displayName: recipientData.name || recipientData.address
              };
            }
          } catch (paymentError) {
            console.error(`❌ NWC payment to ${recipientData.name || recipientData.address} threw error:`, paymentError);
            throw new Error(`Payment to ${recipientData.name || recipientData.address} error: ${paymentError instanceof Error ? paymentError.message : String(paymentError)}`);
          }
        });
        
        const errors: string[] = [];
        
        // Process all payments in parallel for maximum speed
        if (usingBridge) {
          console.log(`🌉 BRIDGE MODE: Processing ${paymentPromises.length} payments in PARALLEL via Alby Hub`);
        } else {
          console.log('⚡ Processing direct payments in parallel');
        }
        
        const paymentResults = await Promise.allSettled(paymentPromises);
        
        paymentResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            results.push(result.value);
            if (usingBridge) {
              console.log(`✅ BRIDGE [${index + 1}/${paymentPromises.length}]: ${result.value.recipient} payment completed`);
            }
          } else if (result.status === 'rejected') {
            const errorMsg = result.reason.message || String(result.reason);
            errors.push(errorMsg);
            if (usingBridge) {
              console.error(`❌ BRIDGE [${index + 1}/${paymentPromises.length}]: ${errorMsg}`);
            }
          }
        });
        
        if (errors.length > 0) {
          console.error(usingBridge ? '❌ Bridge parallel payments had errors:' : '❌ Direct payments had errors:', errors);
        }
        
        // Report NWC results
        if (results.length > 0) {
          console.log(`✅ Bitcoin Connect NWC payments - ${results.length}/${processedPayments.length} successful:`, results);
          if (errors.length > 0) {
            console.warn(`⚠️ Some NWC payments failed:`, errors);
            
            // Show users what worked and what didn't for partial success
            const successfulRecipients = results.map(r => r.recipient).join(', ');
            const failedRecipients = errors.map(error => {
              const match = error.match(/Payment to ([^:]+)/);
              return match ? match[1] : 'Unknown recipient';
            }).join(', ');
            
            console.info(`✅ Successful payments: ${successfulRecipients}`);
            console.info(`❌ Failed payments: ${failedRecipients}`);
          }
          
          // Create Nostr boost note if boosts are enabled and we have successful payments
          if (enableBoosts && boostMetadata && results.length > 0) {
            try {
              await handleBoostCreation(results, amount);
            } catch (boostError) {
              console.warn('⚠️ Boost creation failed but payments succeeded:', boostError);
            }
          }
          
          // Pass detailed results including success/failure breakdown to UI
          onSuccess?.({
            results,
            successCount: results.length,
            totalCount: processedPayments.length,
            successfulRecipients: results.map(r => `${r.displayName} (${r.type}) - ${r.address}`),
            failedRecipients: errors.map(error => {
              const match = error.match(/Payment to ([^:]+)/);
              return match ? match[1] : 'Unknown recipient';
            }),
            detailedRecipients: results,
            errors: errors.length > 0 ? errors : undefined
          });
        } else if (errors.length > 0) {
          // Analyze error types to provide helpful user guidance
          const keysendErrors = errors.filter(error => 
            error.includes('Keysend payment failed') || 
            error.includes('keysend')
          );
          
          const bridgeErrors = errors.filter(error => 
            error.includes('bridge not configured') || 
            error.includes('Bridge payment succeeded but keysend forward failed') ||
            error.includes('Failed to create bridge invoice') ||
            error.includes('Failed to get wallet info after') ||
            error.includes('bridge is not available') ||
            error.includes('No response from wallet')
          );
          
          // Improved error messaging based on wallet type and error patterns
          if (keysendErrors.length === errors.length && keysendErrors.length > 0) {
            // All errors are keysend failures
            const walletName = bcConnectorType === 'nwc.coinos' ? 'Coinos' : 
                             isCashuWallet ? 'Cashu wallet' : 'NWC wallet';
            
            const hasWebLN = weblnAvailable;
            const walletSuggestion = hasWebLN ? 
              ` Try switching to your browser Lightning wallet (like Alby) using the wallet selector above - it supports both Lightning addresses and keysend payments.` : 
              ' Browser Lightning wallets like Alby support keysend payments better than NWC wallets.';
            
            // Extract failed recipient names for user clarity
            const failedRecipients = errors.map(error => {
              const match = error.match(/Payment to ([^:]+)/);
              return match ? match[1] : 'Unknown recipient';
            }).join(', ');
            
            console.warn(`⚠️ ${walletName} keysend incompatibility detected`);
            // Create structured error for better UI display
            const structuredError = {
              title: `${walletName} Payment Incompatibility`,
              message: `${walletName} cannot send keysend payments to traditional Lightning nodes. This album only has keysend recipients configured.`,
              failedRecipients: errors.map(error => {
                const match = error.match(/Payment to ([^:]+)/);
                return match ? match[1] : 'Unknown recipient';
              }),
              walletSuggestion: walletSuggestion.replace(/^\.?\s*/, ''), // Clean up leading punctuation
              type: 'keysend_incompatibility'
            };
            
            throw structuredError;
            
          } else if (isCashuWallet && bridgeErrors.length > 0) {
            console.warn('⚠️ Cashu wallet keysend failed - bridge unavailable or wallet connection issues');
            const hasWebLN = weblnAvailable;
            const webLNSuggestion = hasWebLN ? ' You can try switching to your browser wallet using the wallet selector above.' : '';
            throw new Error(`Cashu wallet keysend payments require a bridge service, but there are connection issues. ${errors.length} keysend recipient(s) could not be paid.${webLNSuggestion} Lightning address payments will work normally with Cashu wallets.`);
            
          } else {
            // Generic error fallback
            console.error('❌ All NWC payments failed:', errors);
            const walletName = bcConnectorType === 'nwc.coinos' ? 'Coinos' : 
                             isCashuWallet ? 'Cashu wallet' : 'NWC wallet';
            throw new Error(`All ${walletName} payments failed. ${errors.length} payment(s) could not be completed. Try switching to a browser Lightning wallet for better compatibility.`);
          }
        }
        
      } else if (weblnAvailable && webln.keysend) {
        console.log(`⚡ Bitcoin Connect WebLN keysend: ${amount} sats split among recipients for "${description}"`);
        
        // Separate recipients by type: node keys vs Lightning addresses
        const nodeRecipients = processedPayments.filter(r => r.type === 'node' || (r.address && r.address.length === 66 && !r.address.includes('@')));
        const lnAddressRecipients = processedPayments.filter(r => r.type === 'lnaddress' || (r.address && r.address.includes('@')));
        
        console.log(`🔍 Payment types: ${nodeRecipients.length} node keysend, ${lnAddressRecipients.length} Lightning addresses`);
        
        // Process all payments in parallel for speed
        const paymentPromises = processedPayments.map(async (recipientData) => {
          // Calculate amount: use fixed amount if specified, otherwise proportional split
          const recipientAmount = (recipientData as any).fixedAmount || Math.floor((amount * recipientData.split) / totalSplit);
          
          if (recipientAmount <= 0) {
            console.log(`⏭️ Skipping ${recipientData.name || recipientData.address} - calculated amount is 0 sats`);
            return null;
          }
          
          // Skip known offline nodes temporarily 
          if (recipientData.address === '035ad2c954e264004986da2d9499e1732e5175e1dcef2453c921c6cdcc3536e9d8') {
            console.log(`⏭️ Skipping ${recipientData.name || recipientData.address} - node temporarily offline`);
            return null;
          }
          
          console.log(`⚡ Sending ${recipientAmount} sats to ${recipientData.name || recipientData.address.slice(0, 10)}... (${recipientData.split}/${totalSplit} split)`);
          
          try {
            // Handle different payment types
            if (recipientData.type === 'node' || (recipientData.address && recipientData.address.length === 66 && !recipientData.address.includes('@'))) {
              // Use keysend for node public keys
              const customRecords = await createWebLNCustomRecords(recipientData.name || 'Recipient');
              
              // DEBUG: Log WebLN keysend data for Sovereign Feeds
              if (recipientData.name === 'Sovereign Feeds') {
                console.log('🔍 WEBLN SOVEREIGN FEEDS DEBUG:', {
                  recipient: recipientData.name,
                  pubkey: recipientData.address,
                  amount: recipientAmount,
                  customRecordKeys: Object.keys(customRecords),
                  customRecordsData: Object.fromEntries(
                    Object.entries(customRecords).map(([key, value]) => [
                      key,
                      {
                        length: value.length,
                        decoded: (() => {
                          try {
                            return JSON.parse(Buffer.from(value, 'hex').toString('utf8'));
                          } catch {
                            return Buffer.from(value, 'hex').toString('utf8');
                          }
                        })()
                      }
                    ])
                  )
                });
              }
              
              const response = await webln.keysend({
                destination: recipientData.address,
                amount: recipientAmount, // Send in sats - Alby might expect sats not millisats
                customRecords
              });
              
              console.log(`💰 Payment sent: ${recipientAmount} sats to ${recipientData.address}`);
              console.log(`✅ Payment to ${recipientData.name || recipientData.address} successful:`, response);
              return { 
                recipient: recipientData.name || recipientData.address, 
                amount: recipientAmount, 
                response,
                address: recipientData.address,
                type: 'Keysend',
                displayName: recipientData.name || recipientData.address
              };
              
            } else if (recipientData.type === 'lnaddress' || (recipientData.address && recipientData.address.includes('@'))) {
              // For Lightning addresses, resolve to an invoice first, then pay
              console.log(`🔗 Resolving Lightning address to invoice: ${recipientData.address}`);
              
              const { LNURLService } = await import('../lib/lnurl-service');
              const amountMillisats = recipientAmount * 1000; // Convert sats to millisats
              const comment = `Boost for "${description}" by ${recipientData.name || 'Unknown'}`;
              
              const invoice = await LNURLService.getPaymentInvoice(
                recipientData.address,
                amountMillisats,
                comment
              );
              
              console.log(`💳 Got invoice for ${recipientData.address}, paying with WebLN`);
              
              const response = await webln.sendPayment(invoice);
              
              console.log(`💰 Payment sent: ${recipientAmount} sats to ${recipientData.address}`);
              console.log(`✅ Payment to ${recipientData.name || recipientData.address} successful:`, response);
              return { 
                recipient: recipientData.name || recipientData.address, 
                amount: recipientAmount, 
                response,
                address: recipientData.address,
                type: 'Lightning Address',
                displayName: recipientData.name || recipientData.address
              };
              
            } else {
              throw new Error(`Unknown recipient type for ${recipientData.address}`);
            }
          } catch (paymentError) {
            console.error(`❌ Payment to ${recipientData.name || recipientData.address} threw error:`, paymentError);
            throw new Error(`Payment to ${recipientData.name || recipientData.address} error: ${paymentError instanceof Error ? paymentError.message : String(paymentError)}`);
          }
        });
        
        // Wait for all payments to complete (in parallel)
        const paymentResults = await Promise.allSettled(paymentPromises);
        const errors: string[] = [];
        
        paymentResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            results.push(result.value);
          } else if (result.status === 'rejected') {
            errors.push(result.reason.message || String(result.reason));
          }
        });
        
        // Report results
        if (results.length > 0) {
          console.log(`✅ Bitcoin Connect WebLN payments - ${results.length}/${processedPayments.length} successful:`, results);
          if (errors.length > 0) {
            console.warn(`⚠️ Some payments failed:`, errors);
            
            // Show users what worked and what didn't for partial success
            const successfulRecipients = results.map(r => r.recipient).join(', ');
            const failedRecipients = errors.map(error => {
              const match = error.match(/Payment to ([^:]+)/);
              return match ? match[1] : 'Unknown recipient';
            }).join(', ');
            
            console.info(`✅ Successful payments: ${successfulRecipients}`);
            console.info(`❌ Failed payments: ${failedRecipients}`);
          }
          
          // Create Nostr boost note if boosts are enabled and we have successful payments
          if (enableBoosts && boostMetadata && results.length > 0) {
            try {
              await handleBoostCreation(results, amount);
            } catch (boostError) {
              console.warn('⚠️ Boost creation failed but payments succeeded:', boostError);
            }
          }
          
          // Pass detailed results including success/failure breakdown to UI
          onSuccess?.({
            results,
            successCount: results.length,
            totalCount: processedPayments.length,
            successfulRecipients: results.map(r => `${r.displayName} (${r.type}) - ${r.address}`),
            failedRecipients: errors.map(error => {
              const match = error.match(/Payment to ([^:]+)/);
              return match ? match[1] : 'Unknown recipient';
            }),
            detailedRecipients: results,
            errors: errors.length > 0 ? errors : undefined
          });
        } else if (errors.length > 0) {
          console.error('❌ All payments failed:', errors);
          throw new Error(`All payments failed: ${errors.join(', ')}`);
        }
      } else {
        // Fallback: Use NWC service for real payments
        console.log(`⚡ Bitcoin Connect using NWC backend: ${amount} sats split among recipients`);
        
        // Import NWC service dynamically to avoid circular dependencies
        const { getNWCService } = await import('../lib/nwc-service');
        const nwcService = getNWCService();
        
        if (nwcService.isConnected()) {
          const errors: string[] = [];
          
          for (const recipientData of processedPayments) {
            // Calculate proportional amount based on split
            const recipientAmount = Math.floor((amount * recipientData.split) / totalSplit);
            
            if (recipientAmount > 0) {
              console.log(`⚡ Sending ${recipientAmount} sats to ${recipientData.name || recipientData.address.slice(0, 10)}... (${recipientData.split}/${totalSplit} split)`);
              
              try {
                let response;
                
                // Handle different payment types for NWC
                if (recipientData.type === 'lnaddress' || (recipientData.address && recipientData.address.includes('@'))) {
                  // For Lightning addresses, resolve to invoice and pay
                  console.log(`🔗 NWC fallback resolving Lightning address: ${recipientData.address}`);
                  const comment = `Boost for "${description}" by ${recipientData.name || 'Unknown'}`;
                  
                  response = await nwcService.payLightningAddress(
                    recipientData.address,
                    recipientAmount,
                    comment
                  );
                } else {
                  // For node public keys, use keysend with TLV records
                  console.log(`⚡ NWC fallback sending keysend to node: ${recipientData.address}`);
                  const tlvRecords = await createBoostTLVRecords(recipientData.name || 'Recipient');
                  
                  // Check if we should use the keysend bridge
                  try {
                    const { getKeysendBridge } = await import('../lib/nwc-keysend-bridge');
                    const bridge = getKeysendBridge();
                    
                    // Try to initialize bridge if not already initialized
                    if (!bridge.getCapabilities().walletName || bridge.getCapabilities().walletName === 'Unknown') {
                      console.log('🔄 Initializing keysend bridge for fallback...');
                      await bridge.initialize({
                        userWalletConnection: nwcConnectionString
                      });
                    }
                    
                    const capabilities = bridge.getCapabilities();
                    console.log('🔍 Bridge capabilities (fallback):', capabilities);
                    
                    if (capabilities.hasBridge && !capabilities.supportsKeysend) {
                      // Use bridge for non-keysend wallets
                      console.log('🌉 Using keysend bridge for fallback payment');
                      const bridgeResult = await bridge.payKeysend({
                        pubkey: recipientData.address,
                        amount: recipientAmount,
                        tlvRecords,
                        description: `Boost to ${recipientData.name || 'recipient'}`
                      });
                      
                      if (bridgeResult.success) {
                        response = { preimage: bridgeResult.preimage };
                      } else {
                        response = { error: bridgeResult.error };
                      }
                    } else {
                      // Direct keysend payment
                      console.log('⚡ Using direct keysend payment (fallback)');
                      response = await nwcService.payKeysend(
                        recipientData.address,
                        recipientAmount,
                        tlvRecords
                      );
                    }
                  } catch (bridgeError) {
                    console.warn('🌉 Bridge error in fallback, using direct keysend:', bridgeError);
                    // Fallback to direct keysend payment
                    response = await nwcService.payKeysend(
                      recipientData.address,
                      recipientAmount,
                      tlvRecords
                    );
                  }
                }
                
                if (response.error) {
                  console.error(`❌ Payment to ${recipientData.name || recipientData.address} failed:`, response.error);
                  errors.push(`Payment to ${recipientData.name || recipientData.address} failed: ${response.error}`);
                } else {
                  console.log(`✅ Payment to ${recipientData.name || recipientData.address} successful:`, response);
                  results.push({ 
                    recipient: recipientData.name || recipientData.address, 
                    amount: recipientAmount, 
                    response,
                    address: recipientData.address,
                    type: recipientData.type === 'lnaddress' || (recipientData.address && recipientData.address.includes('@')) ? 'Lightning Address' : 'Keysend',
                    displayName: recipientData.name || recipientData.address
                  });
                }
              } catch (paymentError) {
                console.error(`❌ Payment to ${recipientData.name || recipientData.address} threw error:`, paymentError);
                errors.push(`Payment to ${recipientData.name || recipientData.address} error: ${paymentError instanceof Error ? paymentError.message : String(paymentError)}`);
              }
            } else {
              console.log(`⏭️ Skipping ${recipientData.name || recipientData.address} - calculated amount is 0 sats`);
            }
          }
          
          // Report results
          if (results.length > 0) {
            console.log(`✅ Bitcoin Connect NWC payments - ${results.length}/${processedPayments.length} successful:`, results);
            if (errors.length > 0) {
              console.warn(`⚠️ Some payments failed:`, errors);
              
              // Show users what worked and what didn't for partial success
              const successfulRecipients = results.map(r => r.recipient).join(', ');
              const failedRecipients = errors.map(error => {
                const match = error.match(/Payment to ([^:]+)/);
                return match ? match[1] : 'Unknown recipient';
              }).join(', ');
              
              console.info(`✅ Successful payments: ${successfulRecipients}`);
              console.info(`❌ Failed payments: ${failedRecipients}`);
            }
            
            // Create Nostr boost note if boosts are enabled and we have successful payments
            if (enableBoosts && boostMetadata && results.length > 0) {
              try {
                await handleBoostCreation(results, amount);
              } catch (boostError) {
                console.warn('⚠️ Boost creation failed but payments succeeded:', boostError);
              }
            }
            
            // Pass detailed results including success/failure breakdown to UI
          onSuccess?.({
            results,
            successCount: results.length,
            totalCount: processedPayments.length,
            successfulRecipients: results.map(r => `${r.displayName} (${r.type}) - ${r.address}`),
            failedRecipients: errors.map(error => {
              const match = error.match(/Payment to ([^:]+)/);
              return match ? match[1] : 'Unknown recipient';
            }),
            detailedRecipients: results,
            errors: errors.length > 0 ? errors : undefined
          });
          } else if (errors.length > 0) {
            console.error('❌ All payments failed:', errors);
            throw new Error(`All payments failed: ${errors.join(', ')}`);
          }
        } else {
          throw new Error('No wallet connection available');
        }
      }
      
    } catch (error) {
      console.error('Payment failed:', error);
      // Pass the full error object to allow for structured error handling
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything if Lightning is disabled
  if (!isLightningEnabled) {
    return null;
  }

  if (!mounted) {
    return (
      <button className={`flex items-center gap-2 px-4 py-2 bg-yellow-500/50 text-black font-semibold rounded-lg animate-pulse ${className}`}>
        Loading...
      </button>
    );
  }

  return (
    <button
      key={`boost-button-${renderKey}-${isConnected}`}
      onClick={handlePayment}
      disabled={loading || !isConnected}
      className={`flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:text-gray-400 text-black font-semibold rounded-lg transition-colors ${className}`}
    >
      <Zap className="w-4 h-4" />
      <span>
        {loading ? 'Processing...' : 
         !isConnected ? 'Connect Wallet First' : 
         `Send ${amount} sats`}
      </span>
    </button>
  );
}