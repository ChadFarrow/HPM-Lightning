'use client';

import { useEffect, useState } from 'react';
import { Zap, Wallet } from 'lucide-react';
import { useBitcoinConnect } from '@/contexts/BitcoinConnectContext';
import { useBoostToNostr } from '@/hooks/useBoostToNostr';
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

  useEffect(() => {
    // Import Bitcoin Connect dynamically to avoid SSR issues
    const loadBitcoinConnect = async () => {
      try {
        const bc = await import('@getalby/bitcoin-connect');
        
        // Initialize Bitcoin Connect with basic configuration
        if (bc.init && !window.bitcoinConnectInitialized) {
          bc.init({
            appName: 'ITDV Lightning',
            // No filters - show all available wallet options
            showBalance: false // Hide balance to keep UI clean
          });
          window.bitcoinConnectInitialized = true;
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
  }, []);

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
  onError?: (error: string) => void;
  className?: string;
  recipient?: string;
  recipients?: Array<{ address: string; split: number; name?: string; fee?: boolean }>;
  enableBoosts?: boolean;
  boostMetadata?: {
    title?: string;
    artist?: string;
    album?: string;
    imageUrl?: string;
    podcastFeedGuid?: string;
    episode?: string;
    feedUrl?: string;
    itemGuid?: string;
    timestamp?: number;
    appName?: string;
    url?: string;
    publisherGuid?: string;
    publisherUrl?: string;
  };
}) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isConnected } = useBitcoinConnect();
  
  // Initialize Nostr boost system if boosts are enabled
  const { postBoost, generateKeys, publicKey } = useBoostToNostr({ 
    autoGenerateKeys: enableBoosts && typeof window !== 'undefined'
  });

  // Helper function to create enhanced TLV records for boosts following podcast namespace spec
  const createBoostTLVRecords = (recipientName?: string) => {
    const tlvRecords = [];
    
    if (boostMetadata) {
      // 7629169 - Podcast metadata JSON (bLIP-10 standard - Breez/Fountain compatible)
      const podcastMetadata = {
        podcast: boostMetadata.artist || 'Unknown Artist',
        episode: boostMetadata.title || 'Unknown Title',
        action: 'boost',
        app_name: boostMetadata.appName || 'ITDV Lightning',
        url: boostMetadata.url || 'https://doerfelverse.com',
        message: `⚡ ${amount} sats boost from ITDV Lightning${recipientName ? ` → ${recipientName}` : ''}`,
        ...(boostMetadata.timestamp && { ts: boostMetadata.timestamp }),
        ...(boostMetadata.podcastFeedGuid && { feedID: boostMetadata.podcastFeedGuid }),
        ...(boostMetadata.album && { album: boostMetadata.album }),
        value_msat_total: amount * 1000,
        sender_name: 'Super Fan'
      };
      
      tlvRecords.push({
        type: 7629169,
        value: Buffer.from(JSON.stringify(podcastMetadata), 'utf8').toString('hex')
      });
      
      // 7629171 - Tip note/message (Lightning spec compliant)
      const tipMessage = `⚡ Boost from ITDV Lightning: ${amount} sats to "${boostMetadata.title}" by ${boostMetadata.artist}${recipientName ? ` → ${recipientName}` : ''}`;
      tlvRecords.push({
        type: 7629171,
        value: Buffer.from(tipMessage, 'utf8').toString('hex')
      });
      
      // 133773310 - Sphinx compatibility (JSON encoded data)
      const sphinxData = {
        podcast: boostMetadata.artist || 'Unknown Artist',
        episode: boostMetadata.title || 'Unknown Title', 
        action: 'boost',
        app: boostMetadata.appName || 'ITDV Lightning',
        message: tipMessage,
        amount: amount,
        sender: 'Super Fan',
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
    
    return tlvRecords;
  };

  // Helper function to convert TLV records to WebLN customRecords format
  const createWebLNCustomRecords = (recipientName?: string) => {
    const tlvRecords = createBoostTLVRecords(recipientName);
    const customRecords: { [key: number]: string } = {};
    
    tlvRecords.forEach(record => {
      // Convert hex back to string for WebLN
      const value = Buffer.from(record.value, 'hex').toString('utf8');
      customRecords[record.type] = value;
    });
    
    return customRecords;
  };

  useEffect(() => {
    const loadBitcoinConnect = async () => {
      try {
        await import('@getalby/bitcoin-connect');
        setMounted(true);
      } catch (error) {
        console.error('Failed to load Bitcoin Connect:', error);
      }
    };

    loadBitcoinConnect();
  }, []);

  // Helper function to create Nostr boost notes after successful payments
  const handleBoostCreation = async (paymentResults: any[], totalAmount: number) => {
    try {
      if (!enableBoosts || !boostMetadata || !publicKey) {
        return;
      }

      console.log('🎵 Creating Nostr boost note for successful payments...');
      
      // Use the intended amount rather than actual amount paid
      // This shows what the user intended to boost, not just what succeeded
      
      // Create boost note using the Nostr boost system
      if (!postBoost) {
        console.warn('⚠️ postBoost function not available');
        return;
      }
      
      // Create boost with intended amount and metadata
      // Map boostMetadata to TrackMetadata format including itemGuid
      const trackMetadata = {
        title: boostMetadata.title,
        artist: boostMetadata.artist,
        album: boostMetadata.album,
        url: boostMetadata.url,
        imageUrl: boostMetadata.imageUrl,
        itemGuid: boostMetadata.itemGuid,
        podcastFeedGuid: boostMetadata.podcastFeedGuid,
        feedUrl: boostMetadata.feedUrl,
        publisherGuid: boostMetadata.publisherGuid,
        publisherUrl: boostMetadata.publisherUrl
      };
      
      const boostResult = await postBoost(
        totalAmount, 
        trackMetadata
        // No default comment - just URL like Fountain
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
      
      // If user selected NWC in Bitcoin Connect, prioritize that
      if (bcConnectorType === 'nwc.generic' || bcConnectorType === 'nwc' || (bcConnectorType && nwcConnectionString)) {
        try {
          const { getNWCService } = await import('../lib/nwc-service');
          nwcService = getNWCService();
          
          if (nwcConnectionString && !nwcService.isConnected()) {
            await nwcService.connect(nwcConnectionString);
          }
          
          shouldUseNWC = nwcService.isConnected();
          console.log(`🔍 NWC connection attempt: ${shouldUseNWC ? 'successful' : 'failed'}`);
        } catch (error) {
          console.warn('NWC service failed:', error);
          shouldUseNWC = false;
        }
      }
      
      console.log(`🔍 Payment method selection: BC connector: "${bcConnectorType}", Use NWC: ${shouldUseNWC}, WebLN available: ${weblnAvailable}`);
      
      // Prioritize NWC if Bitcoin Connect user selected it
      if (shouldUseNWC && nwcService) {
        console.log(`⚡ Bitcoin Connect using NWC (prioritized): ${amount} sats split among recipients`);
        
        // Process all payments in parallel for speed
        const paymentPromises = paymentsToMake.map(async (recipientData) => {
          // Calculate proportional amount based on split
          const recipientAmount = Math.floor((amount * recipientData.split) / totalSplit);
          
          if (recipientAmount <= 0) {
            console.log(`⏭️ Skipping ${recipientData.name || recipientData.address} - calculated amount is 0 sats`);
            return null;
          }
          
          console.log(`⚡ NWC sending ${recipientAmount} sats to ${recipientData.name || recipientData.address.slice(0, 10)}... (${recipientData.split}/${totalSplit} split)`);
          
          try {
            // Make real keysend payment via NWC with enhanced TLV records
            const tlvRecords = createBoostTLVRecords(recipientData.name || 'Recipient');
            
            const response = await nwcService.payKeysend(
              recipientData.address,
              recipientAmount,
              tlvRecords
            );
            
            if (response.error) {
              console.error(`❌ NWC payment to ${recipientData.name || recipientData.address} failed:`, response.error);
              throw new Error(`Payment to ${recipientData.name || recipientData.address} failed: ${response.error}`);
            } else {
              console.log(`✅ NWC payment to ${recipientData.name || recipientData.address} successful:`, response);
              return { recipient: recipientData.name || recipientData.address, amount: recipientAmount, response };
            }
          } catch (paymentError) {
            console.error(`❌ NWC payment to ${recipientData.name || recipientData.address} threw error:`, paymentError);
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
        
        // Report NWC results
        if (results.length > 0) {
          console.log(`✅ Bitcoin Connect NWC payments - ${results.length}/${paymentsToMake.length} successful:`, results);
          if (errors.length > 0) {
            console.warn(`⚠️ Some NWC payments failed:`, errors);
          }
          
          // Create Nostr boost note if boosts are enabled and we have successful payments
          if (enableBoosts && boostMetadata && results.length > 0) {
            try {
              await handleBoostCreation(results, amount);
            } catch (boostError) {
              console.warn('⚠️ Boost creation failed but payments succeeded:', boostError);
            }
          }
          
          onSuccess?.(results);
        } else if (errors.length > 0) {
          console.error('❌ All NWC payments failed:', errors);
          throw new Error(`All NWC payments failed: ${errors.join(', ')}`);
        }
        
      } else if (weblnAvailable && webln.keysend) {
        console.log(`⚡ Bitcoin Connect WebLN keysend: ${amount} sats split among recipients for "${description}"`);
        
        // Process all payments in parallel for speed
        const paymentPromises = paymentsToMake.map(async (recipientData) => {
          // Calculate proportional amount based on split
          const recipientAmount = Math.floor((amount * recipientData.split) / totalSplit);
          
          if (recipientAmount <= 0) {
            console.log(`⏭️ Skipping ${recipientData.name || recipientData.address} - calculated amount is 0 sats`);
            return null;
          }
          
          console.log(`⚡ Sending ${recipientAmount} sats to ${recipientData.name || recipientData.address.slice(0, 10)}... (${recipientData.split}/${totalSplit} split)`);
          
          try {
            // Try sending in sats first - some WebLN providers expect sats, not millisats
            const response = await webln.keysend({
              destination: recipientData.address,
              amount: recipientAmount, // Send in sats - Alby might expect sats not millisats
              customRecords: createWebLNCustomRecords(recipientData.name || 'Recipient')
            });
            
            console.log(`💰 Payment sent: ${recipientAmount} sats to ${recipientData.address}`);
            
            console.log(`✅ Payment to ${recipientData.name || recipientData.address} successful:`, response);
            return { recipient: recipientData.name || recipientData.address, amount: recipientAmount, response };
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
          console.log(`✅ Bitcoin Connect WebLN payments - ${results.length}/${paymentsToMake.length} successful:`, results);
          if (errors.length > 0) {
            console.warn(`⚠️ Some payments failed:`, errors);
          }
          
          // Create Nostr boost note if boosts are enabled and we have successful payments
          if (enableBoosts && boostMetadata && results.length > 0) {
            try {
              await handleBoostCreation(results, amount);
            } catch (boostError) {
              console.warn('⚠️ Boost creation failed but payments succeeded:', boostError);
            }
          }
          
          onSuccess?.(results);
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
          
          for (const recipientData of paymentsToMake) {
            // Calculate proportional amount based on split
            const recipientAmount = Math.floor((amount * recipientData.split) / totalSplit);
            
            if (recipientAmount > 0) {
              console.log(`⚡ Sending ${recipientAmount} sats to ${recipientData.name || recipientData.address.slice(0, 10)}... (${recipientData.split}/${totalSplit} split)`);
              
              try {
                // Make real keysend payment via NWC with enhanced TLV records
                const tlvRecords = createBoostTLVRecords(recipientData.name || 'Recipient');
                
                const response = await nwcService.payKeysend(
                  recipientData.address,
                  recipientAmount,
                  tlvRecords
                );
                
                if (response.error) {
                  console.error(`❌ Payment to ${recipientData.name || recipientData.address} failed:`, response.error);
                  errors.push(`Payment to ${recipientData.name || recipientData.address} failed: ${response.error}`);
                } else {
                  console.log(`✅ Payment to ${recipientData.name || recipientData.address} successful:`, response);
                  results.push({ recipient: recipientData.name || recipientData.address, amount: recipientAmount, response });
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
            console.log(`✅ Bitcoin Connect NWC payments - ${results.length}/${paymentsToMake.length} successful:`, results);
            if (errors.length > 0) {
              console.warn(`⚠️ Some payments failed:`, errors);
            }
            
            // Create Nostr boost note if boosts are enabled and we have successful payments
            if (enableBoosts && boostMetadata && results.length > 0) {
              try {
                await handleBoostCreation(results, amount);
              } catch (boostError) {
                console.warn('⚠️ Boost creation failed but payments succeeded:', boostError);
              }
            }
            
            onSuccess?.(results);
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
      onError?.(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <button className={`flex items-center gap-2 px-4 py-2 bg-yellow-500/50 text-black font-semibold rounded-lg animate-pulse ${className}`}>
        Loading...
      </button>
    );
  }

  return (
    <button
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