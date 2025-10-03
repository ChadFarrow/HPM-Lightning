/**
 * Enhanced Payment utilities that prioritize Lightning addresses over keysend
 */

import { 
  getLightningAddressFromCustomValue,
  getLightningAddressFromNode,
  formatRecipientInfo 
} from '@/lib/lightning-mapping';

interface PaymentRecipient {
  address: string;
  split: number;
  name?: string;
  fee?: boolean;
  type?: string;
  customValue?: string;
  fixedAmount?: number;
}

interface EnhancedPaymentRecipient extends PaymentRecipient {
  lightningAddress?: string;
  paymentMethod: 'lightning-address' | 'keysend';
  preferredAddress: string; // The address to actually use for payment
}

interface BoostMetadata {
  title?: string;
  artist?: string;
  album?: string;
  imageUrl?: string;
  podcastFeedGuid?: string;
  podcastGuid?: string;
  episode?: string;
  feedUrl?: string;
  itemGuid?: string;
  timestamp?: number;
  senderName?: string;
  appName?: string;
  url?: string;
  publisherGuid?: string;
  publisherUrl?: string;
  message?: string;
}

/**
 * Enhance recipients by trying to resolve Lightning addresses from custom values or node addresses
 */
export function enhanceRecipientsWithLightningAddresses(
  recipients: PaymentRecipient[]
): EnhancedPaymentRecipient[] {
  return recipients.map(recipient => {
    let lightningAddress: string | null = null;
    let paymentMethod: 'lightning-address' | 'keysend' = 'keysend';
    let preferredAddress = recipient.address;

    // First try to get Lightning address from custom value
    if (recipient.customValue) {
      lightningAddress = getLightningAddressFromCustomValue(recipient.customValue);
      console.log(`🔍 Custom value ${recipient.customValue} → ${lightningAddress || 'no mapping'}`);
    }

    // If no Lightning address from custom value, try node address mapping
    if (!lightningAddress) {
      lightningAddress = getLightningAddressFromNode(recipient.address);
      console.log(`🔍 Node ${recipient.address.substring(0, 20)}... → ${lightningAddress || 'no mapping'}`);
    }

    // If we found a Lightning address, prefer it
    if (lightningAddress) {
      paymentMethod = 'lightning-address';
      preferredAddress = lightningAddress;
      console.log(`✅ Using Lightning address: ${lightningAddress} for ${recipient.name || 'recipient'}`);
    } else {
      console.log(`⚡ Using keysend to node: ${recipient.address.substring(0, 20)}... for ${recipient.name || 'recipient'}`);
    }

    return {
      ...recipient,
      lightningAddress: lightningAddress || undefined,
      paymentMethod,
      preferredAddress
    };
  });
}

/**
 * Make Lightning invoice payment to a Lightning address
 */
async function payLightningAddress(
  lightningAddress: string,
  amount: number,
  description: string,
  metadata?: BoostMetadata
): Promise<{ success: boolean; preimage?: string; error?: string }> {
  try {
    console.log(`💰 Paying Lightning address: ${lightningAddress} (${amount} sats)`);

    // Check if we have WebLN available
    const webln = (window as any).webln;
    if (!webln) {
      throw new Error('WebLN not available');
    }

    // Enable WebLN if not already enabled
    if (!webln.enabled) {
      await webln.enable();
    }

    // Create a Lightning invoice request
    // Note: This requires the Lightning address to be resolved to a BOLT11 invoice
    // We'll use the LNURL protocol for this
    
    const { resolveAndPayLightningAddress } = await import('@/lib/lnurl-service');
    const result = await resolveAndPayLightningAddress(lightningAddress, amount, description, metadata);
    
    return result;
  } catch (error) {
    console.error(`❌ Lightning address payment failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Lightning address payment failed'
    };
  }
}

/**
 * Make keysend payment to a node address
 */
async function payNodeKeysend(
  nodeAddress: string,
  amount: number,
  description: string,
  recipientName?: string,
  metadata?: BoostMetadata
): Promise<{ success: boolean; preimage?: string; error?: string }> {
  try {
    console.log(`⚡ Paying node via keysend: ${nodeAddress.substring(0, 20)}... (${amount} sats)`);

    // Try NWC first (matching existing logic)
    const { getNWCService } = await import('@/lib/nwc-service');
    const { getKeysendBridge } = await import('@/lib/nwc-keysend-bridge');

    // Check for NWC connection
    let nwcConnectionString = null;
    try {
      const bcConfigRaw = localStorage.getItem('bc:config');
      if (bcConfigRaw) {
        const bcConfig = JSON.parse(bcConfigRaw);
        nwcConnectionString = bcConfig.nwcUrl;
      }
    } catch (error) {
      // Ignore parsing errors
    }
    if (!nwcConnectionString) {
      nwcConnectionString = localStorage.getItem('nwc_connection_string');
    }

    if (nwcConnectionString) {
      console.log('💡 Using NWC for keysend payment');
      
      const bridge = getKeysendBridge();
      
      // Initialize bridge if needed
      if (!bridge.getCapabilities().walletName || bridge.getCapabilities().walletName === 'Unknown') {
        await bridge.initialize({ userWalletConnection: nwcConnectionString });
      }

      // Create TLV records for boost metadata
      const tlvRecords = metadata ? createBoostTLVRecords(metadata, recipientName, amount) : undefined;
      
      const result = await bridge.payKeysend({
        pubkey: nodeAddress,
        amount: amount,
        tlvRecords,
        description: description || `Payment to ${recipientName || 'recipient'}`
      });

      return {
        success: result.success,
        preimage: result.preimage,
        error: result.error
      };
    }

    // Fallback to WebLN keysend
    const webln = (window as any).webln;
    if (!webln) {
      throw new Error('No payment method available');
    }

    if (!webln.enabled) {
      await webln.enable();
    }

    if (typeof webln.keysend !== 'function') {
      throw new Error('Keysend not supported by connected wallet');
    }

    // Create TLV records for boost metadata
    const customRecords = metadata ? createBoostTLVRecords(metadata, recipientName, amount) : {};

    const response = await webln.keysend({
      destination: nodeAddress,
      amount: amount,
      customRecords
    });

    return {
      success: true,
      preimage: response.preimage
    };

  } catch (error) {
    console.error(`❌ Keysend payment failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Keysend payment failed'
    };
  }
}

/**
 * Create TLV records for Lightning boost payments
 */
function createBoostTLVRecords(metadata: BoostMetadata, recipientName?: string, amount?: number) {
  const tlvRecords = [];

  // 7629169 - Podcast metadata JSON (bLIP-10 standard)
  const podcastMetadata = {
    podcast: metadata.artist || 'Unknown Artist',
    episode: metadata.title || 'Unknown Title',
    action: 'boost',
    app_name: metadata.appName || 'HPM Lightning',
    feed: metadata.feedUrl || 'https://www.doerfelverse.com/feeds/intothedoerfelverse.xml',
    url: metadata.feedUrl || 'https://www.doerfelverse.com/feeds/intothedoerfelverse.xml',
    message: metadata.message || '',
    ...(metadata.timestamp && { ts: metadata.timestamp }),
    feedId: metadata.feedUrl === 'https://www.doerfelverse.com/feeds/bloodshot-lies-album.xml' ? "6590183" : "6590182",
    ...(metadata.itemGuid && { episode_guid: metadata.itemGuid }),
    ...(metadata.itemGuid && { remote_item_guid: metadata.itemGuid }),
    ...(metadata.podcastFeedGuid && { remote_feed_guid: metadata.podcastFeedGuid }),
    ...(metadata.album && { album: metadata.album }),
    ...(amount && { value_msat_total: amount * 1000 }),
    sender_name: metadata.senderName || 'Anonymous',
    uuid: `boost-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    app_version: '1.0.0',
    ...(amount && { value_msat: amount * 1000 }),
    name: 'HPM Lightning'
  };
  
  tlvRecords.push({
    type: 7629169,
    value: Buffer.from(JSON.stringify(podcastMetadata), 'utf8').toString('hex')
  });
  
  // 7629171 - Tip note/message
  if (metadata.message) {
    tlvRecords.push({
      type: 7629171,
      value: Buffer.from(metadata.message, 'utf8').toString('hex')
    });
  }
  
  // 133773310 - Sphinx compatibility
  const sphinxData = {
    podcast: metadata.artist || 'Unknown Artist',
    episode: metadata.title || 'Unknown Title', 
    action: 'boost',
    app: metadata.appName || 'HPM Lightning',
    message: metadata.message || '',
    ...(amount && { amount: amount }),
    sender: metadata.senderName || 'Anonymous',
    ...(metadata.timestamp && { timestamp: metadata.timestamp })
  };
  
  tlvRecords.push({
    type: 133773310,
    value: Buffer.from(JSON.stringify(sphinxData), 'utf8').toString('hex')
  });

  return tlvRecords;
}

/**
 * Enhanced payment function that prioritizes Lightning addresses over keysend
 */
export async function makeEnhancedLightningPayment({
  amount,
  description,
  recipients,
  fallbackRecipient,
  boostMetadata,
}: {
  amount: number;
  description: string;
  recipients?: PaymentRecipient[];
  fallbackRecipient: string;
  boostMetadata?: BoostMetadata;
}): Promise<{ success: boolean; results?: any[]; error?: string; paymentSummary?: any }> {
  try {
    console.log('🚀 Starting enhanced Lightning payment with address prioritization');

    // Determine payments to make
    let paymentsToMake: PaymentRecipient[] = [];
    
    if (recipients && recipients.length > 0) {
      paymentsToMake = recipients.filter(r => r.address && (r.split > 0 || r.fixedAmount));
    }

    // Fallback to single recipient if no valid recipients
    if (paymentsToMake.length === 0) {
      paymentsToMake = [{
        address: fallbackRecipient,
        split: 100,
        name: 'Default',
        type: 'node'
      }];
    }

    // Enhance recipients with Lightning address resolution
    const enhancedRecipients = enhanceRecipientsWithLightningAddresses(paymentsToMake);

    // Calculate payment amounts
    const totalSplit = enhancedRecipients.reduce((sum, r) => sum + r.split, 0);
    const results: any[] = [];
    const paymentSummary = {
      lightningAddresses: 0,
      keysendPayments: 0,
      totalAmount: amount,
      recipients: enhancedRecipients.length
    };

    // Process payments by method priority (Lightning addresses first)
    const lightningAddressPayments = enhancedRecipients.filter(r => r.paymentMethod === 'lightning-address');
    const keysendPayments = enhancedRecipients.filter(r => r.paymentMethod === 'keysend');

    console.log(`💡 Payment breakdown: ${lightningAddressPayments.length} Lightning addresses, ${keysendPayments.length} keysend`);

    // Process Lightning address payments first
    for (const recipient of lightningAddressPayments) {
      const recipientAmount = recipient.fixedAmount || Math.floor((amount * recipient.split) / totalSplit);
      
      try {
        const result = await payLightningAddress(
          recipient.preferredAddress,
          recipientAmount,
          `${description} to ${recipient.name || recipient.lightningAddress}`,
          boostMetadata
        );

        if (result.success) {
          results.push({
            recipient: recipient.name || recipient.lightningAddress,
            amount: recipientAmount,
            method: 'lightning-address',
            address: recipient.lightningAddress,
            preimage: result.preimage
          });
          paymentSummary.lightningAddresses++;
          console.log(`✅ Lightning address payment successful: ${recipientAmount} sats to ${recipient.lightningAddress}`);
        } else {
          console.error(`❌ Lightning address payment failed: ${result.error}`);
          // Could fall back to keysend for this recipient
          console.log(`🔄 Falling back to keysend for ${recipient.name}`);
          
          const keysendResult = await payNodeKeysend(
            recipient.address,
            recipientAmount,
            description,
            recipient.name,
            boostMetadata
          );

          if (keysendResult.success) {
            results.push({
              recipient: recipient.name || recipient.address.substring(0, 20) + '...',
              amount: recipientAmount,
              method: 'keysend-fallback',
              address: recipient.address,
              preimage: keysendResult.preimage
            });
            paymentSummary.keysendPayments++;
            console.log(`✅ Keysend fallback successful: ${recipientAmount} sats to ${recipient.name}`);
          } else {
            console.error(`❌ Keysend fallback also failed: ${keysendResult.error}`);
          }
        }
      } catch (error) {
        console.error(`❌ Payment to ${recipient.lightningAddress} failed:`, error);
      }
    }

    // Process keysend payments
    for (const recipient of keysendPayments) {
      const recipientAmount = recipient.fixedAmount || Math.floor((amount * recipient.split) / totalSplit);
      
      try {
        const result = await payNodeKeysend(
          recipient.address,
          recipientAmount,
          description,
          recipient.name,
          boostMetadata
        );

        if (result.success) {
          results.push({
            recipient: recipient.name || recipient.address.substring(0, 20) + '...',
            amount: recipientAmount,
            method: 'keysend',
            address: recipient.address,
            preimage: result.preimage
          });
          paymentSummary.keysendPayments++;
          console.log(`✅ Keysend payment successful: ${recipientAmount} sats to ${recipient.name || 'node'}`);
        } else {
          console.error(`❌ Keysend payment failed: ${result.error}`);
        }
      } catch (error) {
        console.error(`❌ Keysend payment to ${recipient.address} failed:`, error);
      }
    }

    const success = results.length > 0;
    console.log(`🎯 Enhanced payment complete: ${results.length}/${enhancedRecipients.length} successful`);
    console.log(`📊 Summary: ${paymentSummary.lightningAddresses} Lightning addresses, ${paymentSummary.keysendPayments} keysend`);

    return {
      success,
      results,
      paymentSummary,
      error: success ? undefined : 'All payments failed'
    };

  } catch (error) {
    console.error('Enhanced Lightning payment failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Enhanced payment failed'
    };
  }
}

/**
 * Get payment method preference for a recipient
 */
export function getPaymentMethodPreference(recipient: PaymentRecipient): {
  preferredMethod: 'lightning-address' | 'keysend';
  lightningAddress?: string;
  reason: string;
} {
  // Try custom value mapping first
  if (recipient.customValue) {
    const lightningAddress = getLightningAddressFromCustomValue(recipient.customValue);
    if (lightningAddress) {
      return {
        preferredMethod: 'lightning-address',
        lightningAddress,
        reason: 'Mapped from customValue'
      };
    }
  }

  // Try node address mapping
  const lightningAddress = getLightningAddressFromNode(recipient.address);
  if (lightningAddress) {
    return {
      preferredMethod: 'lightning-address',
      lightningAddress,
      reason: 'Mapped from node address'
    };
  }

  return {
    preferredMethod: 'keysend',
    reason: 'No Lightning address mapping available'
  };
}