/**
 * LNURL Service for handling Lightning Address payments
 * Implements LNURL-pay protocol for Lightning addresses
 */

interface LNURLPayRequest {
  callback: string;
  maxSendable: number;
  minSendable: number;
  metadata: string;
  commentAllowed?: number;
  tag: string;
}

interface LNURLPayResponse {
  pr: string; // BOLT11 payment request
  successAction?: {
    tag: string;
    message?: string;
    url?: string;
  };
  disposable?: boolean;
  routes?: any[];
}

interface BoostMetadata {
  title?: string;
  artist?: string;
  album?: string;
  message?: string;
  senderName?: string;
  appName?: string;
}

/**
 * Resolve Lightning address to LNURL endpoint
 */
function lightningAddressToLNURL(lightningAddress: string): string {
  const [username, domain] = lightningAddress.split('@');
  if (!username || !domain) {
    throw new Error('Invalid Lightning address format');
  }
  
  return `https://${domain}/.well-known/lnurlp/${username}`;
}

/**
 * Fetch LNURL-pay request information
 */
async function fetchLNURLPayRequest(lnurlEndpoint: string): Promise<LNURLPayRequest> {
  try {
    const response = await fetch(lnurlEndpoint);
    if (!response.ok) {
      throw new Error(`LNURL endpoint returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'ERROR') {
      throw new Error(data.reason || 'LNURL endpoint returned error');
    }
    
    if (data.tag !== 'payRequest') {
      throw new Error('Invalid LNURL response: not a pay request');
    }
    
    return data as LNURLPayRequest;
  } catch (error) {
    console.error('Failed to fetch LNURL pay request:', error);
    throw error;
  }
}

/**
 * Request invoice from LNURL-pay callback
 */
async function requestInvoiceFromCallback(
  callbackUrl: string,
  amount: number,
  comment?: string,
  metadata?: BoostMetadata
): Promise<LNURLPayResponse> {
  try {
    const url = new URL(callbackUrl);
    url.searchParams.set('amount', (amount * 1000).toString()); // Convert to millisats
    
    if (comment) {
      url.searchParams.set('comment', comment);
    }
    
    // Add boost metadata as additional parameters if supported
    if (metadata) {
      if (metadata.senderName) {
        url.searchParams.set('sender_name', metadata.senderName);
      }
      if (metadata.appName) {
        url.searchParams.set('app_name', metadata.appName);
      }
    }
    
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Callback returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'ERROR') {
      throw new Error(data.reason || 'Callback returned error');
    }
    
    if (!data.pr) {
      throw new Error('No payment request in callback response');
    }
    
    return data as LNURLPayResponse;
  } catch (error) {
    console.error('Failed to request invoice from callback:', error);
    throw error;
  }
}

/**
 * Pay Lightning invoice using WebLN
 */
async function payLightningInvoice(paymentRequest: string): Promise<{
  success: boolean;
  preimage?: string;
  error?: string;
}> {
  try {
    const webln = (window as any).webln;
    if (!webln) {
      throw new Error('WebLN not available');
    }
    
    if (!webln.enabled) {
      await webln.enable();
    }
    
    const response = await webln.sendPayment(paymentRequest);
    
    return {
      success: true,
      preimage: response.preimage
    };
  } catch (error) {
    console.error('Lightning invoice payment failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invoice payment failed'
    };
  }
}

/**
 * Resolve and pay a Lightning address using LNURL-pay protocol
 */
export async function resolveAndPayLightningAddress(
  lightningAddress: string,
  amount: number,
  description: string,
  metadata?: BoostMetadata
): Promise<{ success: boolean; preimage?: string; error?: string }> {
  try {
    console.log(`💰 Resolving Lightning address: ${lightningAddress} for ${amount} sats`);
    
    // Step 1: Convert Lightning address to LNURL endpoint
    const lnurlEndpoint = lightningAddressToLNURL(lightningAddress);
    console.log(`🔗 LNURL endpoint: ${lnurlEndpoint}`);
    
    // Step 2: Fetch LNURL-pay request
    const payRequest = await fetchLNURLPayRequest(lnurlEndpoint);
    console.log(`📋 LNURL-pay request:`, {
      minSendable: payRequest.minSendable / 1000,
      maxSendable: payRequest.maxSendable / 1000,
      commentAllowed: payRequest.commentAllowed
    });
    
    // Step 3: Validate amount is within limits
    const amountMsat = amount * 1000;
    if (amountMsat < payRequest.minSendable || amountMsat > payRequest.maxSendable) {
      throw new Error(
        `Amount ${amount} sats is outside allowed range: ${payRequest.minSendable / 1000}-${payRequest.maxSendable / 1000} sats`
      );
    }
    
    // Step 4: Request invoice from callback
    const comment = metadata?.message || description;
    const truncatedComment = payRequest.commentAllowed && comment 
      ? comment.substring(0, payRequest.commentAllowed)
      : undefined;
      
    const invoiceResponse = await requestInvoiceFromCallback(
      payRequest.callback,
      amount,
      truncatedComment,
      metadata
    );
    
    console.log(`🧾 Received invoice for ${amount} sats`);
    
    // Step 5: Pay the invoice using WebLN
    const paymentResult = await payLightningInvoice(invoiceResponse.pr);
    
    if (paymentResult.success) {
      console.log(`✅ Lightning address payment successful: ${lightningAddress}`);
      
      // Log success action if provided
      if (invoiceResponse.successAction?.message) {
        console.log(`💬 Success message: ${invoiceResponse.successAction.message}`);
      }
    }
    
    return paymentResult;
    
  } catch (error) {
    console.error(`❌ Lightning address payment failed for ${lightningAddress}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Lightning address payment failed'
    };
  }
}

/**
 * Validate Lightning address format
 */
export function isValidLightningAddress(address: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(address);
}

/**
 * Get invoice from Lightning address without paying it
 */
export async function getLightningAddressInvoice(
  lightningAddress: string,
  amountSats: number,
  comment?: string,
  metadata?: BoostMetadata
): Promise<{ success: boolean; invoice?: string; error?: string }> {
  try {
    console.log(`🧾 Getting invoice for ${lightningAddress}: ${amountSats} sats`);
    
    // Step 1: Convert Lightning address to LNURL endpoint
    const lnurlEndpoint = lightningAddressToLNURL(lightningAddress);
    console.log(`🔗 LNURL endpoint: ${lnurlEndpoint}`);
    
    // Step 2: Fetch LNURL-pay request
    const payRequest = await fetchLNURLPayRequest(lnurlEndpoint);
    console.log(`📋 LNURL-pay request:`, {
      minSendable: payRequest.minSendable / 1000,
      maxSendable: payRequest.maxSendable / 1000,
      commentAllowed: payRequest.commentAllowed
    });
    
    // Step 3: Validate amount is within limits
    const amountMsat = amountSats * 1000;
    if (amountMsat < payRequest.minSendable || amountMsat > payRequest.maxSendable) {
      throw new Error(
        `Amount ${amountSats} sats is outside allowed range: ${payRequest.minSendable / 1000}-${payRequest.maxSendable / 1000} sats`
      );
    }
    
    // Step 4: Request invoice from callback
    const invoiceResponse = await requestInvoiceFromCallback(
      payRequest.callback,
      amountSats,
      comment,
      metadata
    );

    return {
      success: true,
      invoice: invoiceResponse.pr
    };

  } catch (error) {
    console.error('Failed to get Lightning address invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if a Lightning address is reachable
 */
export async function checkLightningAddressReachability(
  lightningAddress: string
): Promise<{ reachable: boolean; error?: string; info?: any }> {
  try {
    if (!isValidLightningAddress(lightningAddress)) {
      return { reachable: false, error: 'Invalid Lightning address format' };
    }
    
    const lnurlEndpoint = lightningAddressToLNURL(lightningAddress);
    const payRequest = await fetchLNURLPayRequest(lnurlEndpoint);
    
    return {
      reachable: true,
      info: {
        minSendable: payRequest.minSendable / 1000,
        maxSendable: payRequest.maxSendable / 1000,
        commentAllowed: payRequest.commentAllowed,
        metadata: payRequest.metadata
      }
    };
  } catch (error) {
    return {
      reachable: false,
      error: error instanceof Error ? error.message : 'Reachability check failed'
    };
  }
}