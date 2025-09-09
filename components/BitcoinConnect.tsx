'use client';

import { useEffect, useState } from 'react';
import { Zap, Wallet } from 'lucide-react';
import { useBitcoinConnect } from '@/contexts/BitcoinConnectContext';
import { useBoostToNostr } from '@/hooks/useBoostToNostr';
import AlbyGoConnect from './AlbyGoConnect';
import { AlbyTroubleshootingModal } from './AlbyTroubleshootingModal';

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
    title: string;
    artist: string;
    album?: string;
    url?: string;
    imageUrl?: string;
    timestamp?: number;
    duration?: number;
    podcastFeedGuid?: string;
    itemGuid?: string;
    feedUrl?: string;
  };
}) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [lastError, setLastError] = useState<string>('');
  const { isConnected } = useBitcoinConnect();
  
  // Initialize Fountain-style boost system if boosts are enabled
  const { postBoost, generateKeys, publicKey } = useBoostToNostr({ 
    autoGenerateKeys: enableBoosts && typeof window !== 'undefined'
  });

  useEffect(() => {
    const loadBitcoinConnect = async () => {
      try {
        await import('@getalby/bitcoin-connect');
        setMounted(true);
      } catch (error) {
        console.error('Failed to load Bitcoin Connect:', error);
      }
    };

    // Wait for WebLN to be available after page load
    const waitForWebLN = () => {
      let attempts = 0;
      const maxAttempts = 20; // Try for up to 10 seconds
      
      const checkWebLN = () => {
        attempts++;
        if ((window as any).webln) {
          console.log(`✅ WebLN detected after ${attempts * 500}ms`);
          return;
        }
        
        if (attempts < maxAttempts) {
          setTimeout(checkWebLN, 500);
        } else {
          console.log('⚠️ WebLN not detected after 10 seconds - extension may not be installed or enabled');
        }
      };
      
      // Start checking immediately, then every 500ms
      checkWebLN();
    };

    loadBitcoinConnect();
    
    // Wait a bit for the page to fully load, then start checking for WebLN
    setTimeout(waitForWebLN, 1000);
  }, []);

  // Helper function to create Fountain-style boost notes after successful payments
  const handleBoostCreation = async (paymentResults: any[], totalAmount: number) => {
    try {
      if (!enableBoosts || !boostMetadata || !publicKey) {
        return;
      }

      console.log('🎵 Creating Fountain-style boost note for successful payments...');
      
      // Calculate total amount paid
      const totalPaid = paymentResults.reduce((sum, result) => sum + result.amount, 0);
      
      // Create boost note using the existing Fountain-style system
      if (!postBoost) {
        console.warn('⚠️ postBoost function not available');
        return;
      }
      // Create boost with payment amount and metadata
      const boostResult = await postBoost(totalPaid, boostMetadata, `⚡ ${totalPaid} sats boosted to "${boostMetadata.title}" by ${boostMetadata.artist}`);
      
      if (boostResult.success) {
        console.log('✅ Fountain-style boost note created:', boostResult.eventId);
        console.log('📝 Boost note will be visible on Nostr with podcast metadata');
      } else {
        console.warn('⚠️ Failed to create boost note:', boostResult.error);
      }
    } catch (error) {
      console.warn('⚠️ Failed to create boost note:', error);
    }
  };

  const enableWebLN = async () => {
    try {
      if ((window as any).webln) {
        console.log('🔗 Attempting to enable WebLN...');
        await (window as any).webln.enable();
        console.log('✅ WebLN enabled successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to enable WebLN:', error);
      return false;
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
      weblnAvailable,
      enableBoosts,
      boostMetadata: boostMetadata ? 'present' : 'none',
      publicKey: publicKey ? 'present' : 'none',
      weblnObject: (window as any).webln ? 'present' : 'missing',
      albyDetected: !!(window as any).webln?.isAlby
    });
    
    setLoading(true);
    
    // Try to enable WebLN if it exists but isn't enabled
    if (weblnExists && !weblnEnabled) {
      console.log('🔗 WebLN detected but not enabled, attempting to enable...');
      const enabled = await enableWebLN();
      if (!enabled) {
        setLoading(false);
        console.error('❌ Failed to enable WebLN - user may have denied permission');
        onError?.('Failed to connect to Alby extension. Please make sure Alby is unlocked and try again.');
        return;
      }
    }
    
    // Prepare boost metadata if boosts are enabled
    if (enableBoosts && boostMetadata && !publicKey) {
      console.log('🔑 Generating Nostr keys for boost functionality...');
      generateKeys();
    }
    
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
      
      // Check if WebLN is actually direct Lightning or if it's using NWC internally
      const isWebLNDirect = weblnAvailable && webln && webln.keysend && !webln.isNWC;
      
      console.log('🔍 WebLN connection type check:', {
        weblnAvailable,
        hasKeysend: webln?.keysend ? 'yes' : 'no',
        isNWC: webln?.isNWC ? 'yes' : 'no',
        isWebLNDirect,
        shouldTryWebLN: isWebLNDirect,
        nwcServiceAvailable: shouldUseNWC
      });
      
      // PRIORITY: Use working NWC service first if available (Coinos, Alby Hub, etc.)
      // This fixes the issue where WebLN detection interferes with working NWC connections
      if (shouldUseNWC && nwcService) {
        console.log(`⚡ Bitcoin Connect using NWC (prioritized): ${amount} sats split among recipients`);
        
        // Check wallet balance before attempting payments
        try {
          const balanceResult = await nwcService.getBalance();
          if (balanceResult.balance !== undefined) {
            const balanceInSats = Math.floor(balanceResult.balance / 1000);
            console.log(`💰 Wallet balance: ${balanceInSats} sats (${balanceResult.balance} msats)`);
            
            if (balanceInSats < amount) {
              console.error(`❌ Insufficient balance: need ${amount} sats, have ${balanceInSats} sats`);
              throw new Error(`Insufficient balance: need ${amount} sats but wallet only has ${balanceInSats} sats`);
            }
          } else {
            console.warn('⚠️ Could not check wallet balance, proceeding with payment attempt');
          }
        } catch (balanceError) {
          console.warn('⚠️ Balance check failed, proceeding with payment attempt:', balanceError);
        }
        
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
            // Make real keysend payment via NWC
            const tlvRecords = [{
              type: 7629169,
              value: Buffer.from(`${description} - ${recipientData.name || 'Recipient'}`, 'utf8').toString('hex')
            }];
            
            // Check if amount is very small (some wallets have minimum amounts)
            if (recipientAmount < 10) {
              console.warn(`⚠️ Very small payment amount: ${recipientAmount} sats - some wallets may reject this`);
              
              // For Coinos, enforce a minimum payment amount (many wallets reject < 10 sats)
              if (recipientAmount < 1) {
                console.log(`⏭️ Skipping ${recipientData.name || recipientData.address} - amount too small (${recipientAmount} sats)`);
                return { recipient: recipientData.name || recipientData.address, amount: recipientAmount, response: { skipped: true, reason: 'Amount too small' } };
              }
            }
            
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
          
          // Create Fountain-style boost note if boosts are enabled and we have successful payments
          console.log('🔍 Boost creation check:', { 
            enableBoosts, 
            hasBoostMetadata: !!boostMetadata, 
            hasResults: results.length > 0,
            hasPublicKey: !!publicKey 
          });
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
          
          // Check if this looks like a keysend compatibility issue
          const hasKeysendError = errors.some(error => 
            error.includes('Keysend payment failed') || 
            error.includes('INTERNAL')
          );
          
          if (hasKeysendError) {
            console.error(`
            🚨 KEYSEND COMPATIBILITY ISSUE DETECTED
            
            Your wallet (Coinos) appears to not support keysend payments to Lightning node pubkeys.
            
            SOLUTIONS:
            1. Switch to a wallet that supports keysend (Alby, Zeus, Phoenix)
            2. Use lightning addresses instead of node pubkeys (if available)
            3. The recipients would need to provide Lightning addresses (user@domain.com)
            
            This is a wallet limitation, not an app issue.
            `);
            throw new Error(`Keysend not supported by your wallet. Please use a wallet that supports keysend payments (Alby, Zeus, Phoenix) or ask recipients to provide Lightning addresses instead of node pubkeys.`);
          }
          
          throw new Error(`All NWC payments failed: ${errors.join(', ')}`);
        }
        
      } else if (isWebLNDirect) {
        console.log(`⚡ Using direct WebLN (Alby extension): ${amount} sats split among recipients`);
        
        const errors: string[] = [];
        
        // Enable WebLN if not already enabled
        if (!webln.enabled) {
          try {
            await webln.enable();
            console.log('✅ WebLN enabled for payments');
          } catch (error) {
            console.error('❌ Failed to enable WebLN:', error);
            throw new Error('Failed to enable WebLN. Please unlock your Alby extension.');
          }
        }
        
        // Check for potential relay issues before attempting payments
        if (webln.isNWC || webln.nwc || webln.provider?.includes('nwc')) {
          console.warn(`
          🚨 WARNING: WebLN appears to be using NWC mode internally despite detection.
          This may cause "no info event (kind 13194) returned from relay" errors.
          
          To fix this:
          1. Open your Alby extension settings
          2. Switch from "Alby Hub" to "Alby Account" 
          3. Or connect directly to your Lightning node
          4. Refresh this page and try again
          `);
        }
        
        // Process all payments via direct WebLN
        const paymentPromises = paymentsToMake.map(async (recipientData) => {
          const recipientAmount = Math.floor((amount * recipientData.split) / totalSplit);
          
          if (recipientAmount > 0) {
            console.log(`⚡ Sending ${recipientAmount} sats to ${recipientData.name || recipientData.address.slice(0, 10)}... (${recipientData.split}/${totalSplit} split)`);
            
            try {
              console.log(`🔄 Attempting WebLN keysend to ${recipientData.address} for ${recipientAmount} sats...`);
              
              // Add validation before attempting payment
              if (!recipientData.address || recipientAmount <= 0) {
                throw new Error(`Invalid payment parameters: address=${recipientData.address}, amount=${recipientAmount}`);
              }
              
              // Check if webln has direct Lightning capabilities vs NWC
              console.log('🔍 WebLN capabilities check:', {
                hasKeysend: typeof webln.keysend === 'function',
                hasEnable: typeof webln.enable === 'function',
                hasSendPayment: typeof webln.sendPayment === 'function',
                isAlby: webln.isAlby,
                isNWC: webln.isNWC,
                provider: webln.provider || 'unknown'
              });
              
              const response = await webln.keysend({
                destination: recipientData.address,
                amount: recipientAmount,
                customRecords: {
                  7629169: `${description} - ${recipientData.name || 'Recipient'}`
                }
              });
              
              console.log(`✅ Payment to ${recipientData.name || recipientData.address} successful:`, response);
              results.push({ recipient: recipientData.name || recipientData.address, amount: recipientAmount, response });
            } catch (paymentError) {
              const errorMessage = paymentError instanceof Error ? paymentError.message : String(paymentError);
              console.error(`❌ Payment to ${recipientData.name || recipientData.address} failed:`, errorMessage);
              errors.push(`Payment to ${recipientData.name || recipientData.address} error: ${errorMessage}`);
            }
          } else {
            console.log(`⏭️ Skipping ${recipientData.name || recipientData.address} - calculated amount is 0 sats`);
          }
        });
        
        await Promise.allSettled(paymentPromises);
        
        // Report WebLN results
        if (results.length > 0) {
          console.log(`✅ Direct WebLN payments - ${results.length}/${paymentsToMake.length} successful:`, results);
          if (errors.length > 0) {
            console.warn(`⚠️ Some WebLN payments failed:`, errors);
          }
          
          // Create Fountain-style boost note if boosts are enabled and we have successful payments
          console.log('🔍 Boost creation check:', { 
            enableBoosts, 
            hasBoostMetadata: !!boostMetadata, 
            hasResults: results.length > 0,
            hasPublicKey: !!publicKey 
          });
          
          if (enableBoosts && boostMetadata && results.length > 0) {
            try {
              await handleBoostCreation(results, amount);
            } catch (boostError) {
              console.warn('⚠️ Boost creation failed but payments succeeded:', boostError);
              // Don't fail the entire payment flow if boost creation fails
            }
          }
          
          try {
            onSuccess?.(results);
          } catch (callbackError) {
            console.error('❌ Error in onSuccess callback:', callbackError);
          }
        } else if (errors.length > 0) {
          console.error('❌ All WebLN payments failed:', errors);
          throw new Error(`All WebLN payments failed: ${errors.join(', ')}`);
        }
      } else if (weblnAvailable && webln.keysend) {
        console.log(`⚡ Bitcoin Connect WebLN keysend: ${amount} sats split among recipients for "${description}"`);
        
        // Process payments sequentially to avoid overwhelming wallet
        const results = [];
        const errors = [];
        
        for (const recipientData of paymentsToMake) {
          // Calculate proportional amount based on split
          const recipientAmount = Math.floor((amount * recipientData.split) / totalSplit);
          
          if (recipientAmount <= 0) {
            console.log(`⏭️ Skipping ${recipientData.name || recipientData.address} - calculated amount is 0 sats`);
            continue;
          }
          
          console.log(`⚡ Sending ${recipientAmount} sats to ${recipientData.name || recipientData.address.slice(0, 10)}... (${recipientData.split}/${totalSplit} split)`);
          
          try {
            // Try sending in sats first - some WebLN providers expect sats, not millisats
            const response = await webln.keysend({
              destination: recipientData.address,
              amount: recipientAmount, // Send in sats - Alby might expect sats not millisats
              customRecords: {
                7629169: `${description} - ${recipientData.name || 'Recipient'}`
              }
            });
            
            console.log(`💰 Payment sent: ${recipientAmount} sats to ${recipientData.address}`);
            
            console.log(`✅ Payment to ${recipientData.name || recipientData.address} successful:`, response);
            results.push({ recipient: recipientData.name || recipientData.address, amount: recipientAmount, response });
          } catch (paymentError) {
            console.error(`❌ Payment to ${recipientData.name || recipientData.address} threw error:`, paymentError);
            errors.push(`Payment to ${recipientData.name || recipientData.address} error: ${paymentError instanceof Error ? paymentError.message : String(paymentError)}`);
          }
        }
        
        // Report results
        if (results.length > 0) {
          console.log(`✅ Bitcoin Connect WebLN payments - ${results.length}/${paymentsToMake.length} successful:`, results);
          if (errors.length > 0) {
            console.warn(`⚠️ Some payments failed:`, errors);
          }
          
          // Create Fountain-style boost note if boosts are enabled and we have successful payments
          console.log('🔍 Boost creation check:', { 
            enableBoosts, 
            hasBoostMetadata: !!boostMetadata, 
            hasResults: results.length > 0,
            hasPublicKey: !!publicKey 
          });
          if (enableBoosts && boostMetadata && results.length > 0) {
            await handleBoostCreation(results, amount);
          }
          
          onSuccess?.(results);
        } else if (errors.length > 0) {
          console.error('❌ All payments failed:', errors);
          throw new Error(`All payments failed: ${errors.join(', ')}`);
        }
      } else if (weblnAvailable && webln && webln.keysend) {
        // Fallback: Try WebLN anyway even if it might be NWC-based
        console.log(`⚡ Trying WebLN anyway (may be NWC-based): ${amount} sats split among recipients`);
        console.warn('⚠️ WebLN appears to be using NWC internally - this may cause relay errors');
        
        const errors: string[] = [];
        
        // Enable WebLN if not already enabled
        if (!webln.enabled) {
          try {
            await webln.enable();
            console.log('✅ WebLN enabled for payments (NWC mode)');
          } catch (error) {
            console.error('❌ Failed to enable WebLN:', error);
            throw new Error('Failed to enable WebLN. Please unlock your Alby extension.');
          }
        }
        
        // Show instructions to user about switching to direct Lightning mode
        console.warn(`
        🔧 TROUBLESHOOTING TIP: 
        Your Alby extension appears to be in NWC mode, which causes relay errors.
        To fix this:
        1. Open your Alby extension
        2. Go to Settings
        3. Switch from 'Alby Hub' to 'Alby Account' or direct Lightning mode
        4. Refresh this page and try again
        `);
        
        // Try the payments anyway
        const paymentPromises = paymentsToMake.map(async (recipientData) => {
          const recipientAmount = Math.floor((amount * recipientData.split) / totalSplit);
          
          if (recipientAmount > 0) {
            console.log(`⚡ Sending ${recipientAmount} sats to ${recipientData.name || recipientData.address.slice(0, 10)}... (${recipientData.split}/${totalSplit} split)`);
            
            try {
              console.log(`🔄 Attempting WebLN keysend (NWC mode) to ${recipientData.address} for ${recipientAmount} sats...`);
              
              const response = await webln.keysend({
                destination: recipientData.address,
                amount: recipientAmount,
                customRecords: {
                  7629169: `${description} - ${recipientData.name || 'Recipient'}`
                }
              });
              
              console.log(`✅ Payment to ${recipientData.name || recipientData.address} successful:`, response);
              results.push({ recipient: recipientData.name || recipientData.address, amount: recipientAmount, response });
            } catch (paymentError) {
              const errorMessage = paymentError instanceof Error ? paymentError.message : String(paymentError);
              console.error(`❌ Payment to ${recipientData.name || recipientData.address} failed:`, errorMessage);
              errors.push(`Payment to ${recipientData.name || recipientData.address} error: ${errorMessage}`);
            }
          } else {
            console.log(`⏭️ Skipping ${recipientData.name || recipientData.address} - calculated amount is 0 sats`);
          }
        });
        
        await Promise.allSettled(paymentPromises);
        
        // Report results
        if (results.length > 0) {
          console.log(`✅ WebLN payments (NWC mode) - ${results.length}/${paymentsToMake.length} successful:`, results);
          if (errors.length > 0) {
            console.warn(`⚠️ Some WebLN payments failed:`, errors);
          }
          
          // Create Fountain-style boost note if boosts are enabled and we have successful payments
          console.log('🔍 Boost creation check:', { 
            enableBoosts, 
            hasBoostMetadata: !!boostMetadata, 
            hasResults: results.length > 0,
            hasPublicKey: !!publicKey 
          });
          
          if (enableBoosts && boostMetadata && results.length > 0) {
            try {
              await handleBoostCreation(results, amount);
            } catch (boostError) {
              console.warn('⚠️ Boost creation failed but payments succeeded:', boostError);
            }
          }
          
          try {
            onSuccess?.(results);
          } catch (callbackError) {
            console.error('❌ Error in onSuccess callback:', callbackError);
          }
        } else if (errors.length > 0) {
          console.error('❌ All WebLN payments failed:', errors);
          throw new Error(`All WebLN payments failed: ${errors.join(', ')}`);
        }
      } else {
        // Last resort: Use NWC service for real payments
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
                // Make real keysend payment via NWC
                const tlvRecords = [{
                  type: 7629169,
                  value: Buffer.from(`${description} - ${recipientData.name || 'Recipient'}`, 'utf8').toString('hex')
                }];
                
                // Try payment with retry logic for timeout issues
                let retryCount = 0;
                const maxRetries = 2;
                let response;
                
                while (retryCount <= maxRetries) {
                  try {
                    response = await nwcService.payKeysend(
                      recipientData.address,
                      recipientAmount,
                      tlvRecords
                    );
                    break; // Success, break out of retry loop
                  } catch (paymentError) {
                    if (retryCount < maxRetries && (
                      paymentError instanceof Error && 
                      paymentError.message.includes('publish timeout')
                    )) {
                      retryCount++;
                      console.log(`⚡ Retry attempt ${retryCount}/${maxRetries} for ${recipientData.name || recipientData.address}`);
                      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
                    } else {
                      throw paymentError;
                    }
                  }
                }
                
                if (response?.error) {
                  console.error(`❌ Payment to ${recipientData.name || recipientData.address} failed:`, response.error);
                  errors.push(`Payment to ${recipientData.name || recipientData.address} failed: ${response.error}`);
                } else if (response) {
                  console.log(`✅ Payment to ${recipientData.name || recipientData.address} successful:`, response);
                  results.push({ recipient: recipientData.name || recipientData.address, amount: recipientAmount, response });
                } else {
                  console.error(`❌ Payment to ${recipientData.name || recipientData.address} failed: No response received`);
                  errors.push(`Payment to ${recipientData.name || recipientData.address} failed: No response received`);
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
            
            // Create Fountain-style boost note if boosts are enabled and we have successful payments
            console.log('🔍 Boost creation check:', { 
              enableBoosts, 
              hasBoostMetadata: !!boostMetadata, 
              hasResults: results.length > 0,
              hasPublicKey: !!publicKey 
            });
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
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      console.error('Payment failed:', error);
      
      // Store error for troubleshooting modal
      setLastError(errorMessage);
      
      // Show troubleshooting modal for specific errors
      if (errorMessage.includes('no info event') && errorMessage.includes('kind 13194')) {
        setShowTroubleshooting(true);
      }
      
      try {
        onError?.(errorMessage);
      } catch (callbackError) {
        console.error('Error in onError callback:', callbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const forceWebLNDetection = async () => {
    console.log('🔄 Force checking WebLN connection...');
    
    if ((window as any).webln) {
      console.log('🔗 WebLN found, attempting to enable...');
      try {
        await (window as any).webln.enable();
        console.log('✅ WebLN enabled successfully');
        window.location.reload(); // Refresh to update connection state
      } catch (error) {
        console.error('❌ Failed to enable WebLN:', error);
        alert('Failed to connect to Alby. Please make sure the extension is unlocked and try again.');
      }
    } else {
      console.log('❌ WebLN not found');
      alert('Alby extension not detected. Please make sure it\'s installed and enabled, then refresh the page.');
    }
  };

  if (!mounted) {
    return (
      <div className="flex flex-col gap-2">
        <button className={`flex items-center gap-2 px-4 py-2 bg-yellow-500/50 text-black font-semibold rounded-lg animate-pulse ${className}`}>
          Loading...
        </button>
        <button 
          onClick={forceWebLNDetection}
          className="text-xs text-gray-400 hover:text-white underline"
        >
          Alby not connecting? Click here to retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
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
        
      </div>

      {/* Troubleshooting Modal */}
      <AlbyTroubleshootingModal
        isOpen={showTroubleshooting}
        onClose={() => setShowTroubleshooting(false)}
        error={lastError}
      />
    </>
  );
}