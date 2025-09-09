import { 
  SimplePool, 
  finalizeEvent, 
  generateSecretKey, 
  getPublicKey,
  nip04,
  type Event,
  type EventTemplate
} from 'nostr-tools';

export interface NWCConnection {
  relay: string;
  walletPubkey: string;
  secret: Uint8Array;
  publicKey: string;
}

export interface PaymentRequest {
  invoice: string;
  amount?: number;
  description?: string;
}

export interface PaymentResponse {
  preimage?: string;
  error?: string;
}

export interface BalanceResponse {
  balance?: number;
  error?: string;
}

export class NWCService {
  private pool: SimplePool;
  private connection: NWCConnection | null = null;
  private relays: string[] = [];

  constructor() {
    this.pool = new SimplePool();
  }

  /**
   * Parse NWC connection string (nostr+walletconnect://...)
   */
  parseConnectionString(connectionString: string): NWCConnection {
    const url = new URL(connectionString);
    
    if (!url.protocol.startsWith('nostr+walletconnect:')) {
      throw new Error('Invalid NWC connection string');
    }

    const walletPubkey = url.hostname || url.pathname.replace('//', '');
    const params = new URLSearchParams(url.search);
    
    const relay = params.get('relay');
    const secret = params.get('secret');
    
    if (!relay || !secret || !walletPubkey) {
      throw new Error('Missing required NWC parameters');
    }

    const secretKey = Uint8Array.from(
      secret.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    );
    
    return {
      relay,
      walletPubkey,
      secret: secretKey,
      publicKey: getPublicKey(secretKey)
    };
  }

  /**
   * Connect to a wallet using NWC connection string
   */
  async connect(connectionString: string): Promise<void> {
    try {
      this.connection = this.parseConnectionString(connectionString);
      this.relays = [this.connection.relay];
      
      // Test connection by fetching info
      const info = await this.getInfo();
      if (info.error) {
        throw new Error(info.error);
      }
      
      console.log('Connected to NWC wallet:', info);
    } catch (error) {
      this.connection = null;
      this.relays = [];
      throw error;
    }
  }

  /**
   * Disconnect from wallet
   */
  disconnect(): void {
    this.connection = null;
    this.relays = [];
    this.pool.close(this.relays);
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.connection !== null;
  }

  /**
   * Send NWC request with retry logic
   */
  private async sendNWCRequest(method: string, params: any = {}, retries: number = 2): Promise<any> {
    if (!this.connection) {
      throw new Error('Not connected to wallet');
    }

    const request = {
      method,
      params
    };

    // Encrypt the request
    const encrypted = await nip04.encrypt(
      this.connection.secret,
      this.connection.walletPubkey,
      JSON.stringify(request)
    );

    // Create NWC event (kind 23194)
    const eventTemplate: EventTemplate = {
      kind: 23194,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['p', this.connection.walletPubkey]],
      content: encrypted
    };

    const event = finalizeEvent(eventTemplate, this.connection.secret);

    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Send event and wait for response
        const response = await this.waitForResponse(event);
        
        if (!response) {
          const error = new Error(`No response from wallet (attempt ${attempt + 1}/${retries + 1})`);
          if (attempt === retries) {
            throw error;
          }
          lastError = error;
          console.log(`⚡ Retrying NWC request due to timeout (attempt ${attempt + 1}/${retries + 1})`);
          await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s before retry
          continue;
        }

        // Decrypt response
        const decrypted = await nip04.decrypt(
          this.connection.secret,
          this.connection.walletPubkey,
          response.content
        );

        return JSON.parse(decrypted);
      } catch (error) {
        lastError = error;
        if (attempt === retries) {
          throw error;
        }
        console.log(`⚡ Retrying NWC request due to error: ${error} (attempt ${attempt + 1}/${retries + 1})`);
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s before retry
      }
    }
    
    throw lastError;
  }

  /**
   * Wait for NWC response
   */
  private async waitForResponse(requestEvent: Event): Promise<Event | null> {
    if (!this.connection) return null;

    return new Promise((resolve) => {
      const sub = this.pool.subscribeMany(
        this.relays,
        [
          {
            kinds: [23195], // NWC response kind
            authors: [this.connection!.walletPubkey],
            '#e': [requestEvent.id],
            since: requestEvent.created_at
          }
        ],
        {
          onevent: (event) => {
            sub.close();
            resolve(event);
          },
          oneose: () => {
            // Wait for response
          }
        }
      );

      // Publish request
      this.pool.publish(this.relays, requestEvent);

      // Timeout after 60 seconds (increased from 30s for better reliability)
      setTimeout(() => {
        sub.close();
        resolve(null);
      }, 60000);
    });
  }

  /**
   * Get wallet info
   */
  async getInfo(): Promise<any> {
    try {
      return await this.sendNWCRequest('get_info');
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<BalanceResponse> {
    try {
      const response = await this.sendNWCRequest('get_balance');
      console.log('🔍 Full NWC balance response:', response);
      console.log('🔍 Balance value:', response.result?.balance, 'Type:', typeof response.result?.balance);
      return {
        balance: response.result?.balance
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Pay a Lightning invoice
   */
  async payInvoice(invoice: string): Promise<PaymentResponse> {
    try {
      const response = await this.sendNWCRequest('pay_invoice', { invoice });
      
      if (response.error) {
        return { error: response.error.message || response.error };
      }
      
      return {
        preimage: response.result?.preimage
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Create a Lightning invoice
   */
  async makeInvoice(amount: number, description?: string): Promise<{ invoice?: string; error?: string }> {
    try {
      const response = await this.sendNWCRequest('make_invoice', {
        amount,
        description
      });
      
      if (response.error) {
        return { error: response.error.message || response.error };
      }
      
      return {
        invoice: response.result?.invoice
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Pay keysend (direct payment without invoice)
   */
  async payKeysend(pubkey: string, amount: number, tlvRecords?: any): Promise<PaymentResponse> {
    try {
      // Convert sats to msats for NWC (if not already in msats)
      const amountMsats = amount < 1000000 ? amount * 1000 : amount;
      
      // Ensure we have proper TLV records structure (array format)
      const finalTlvRecords = tlvRecords || [];
      
      console.log('⚡ Sending keysend payment:', { 
        pubkey, 
        amount: amountMsats, 
        tlv_records: finalTlvRecords 
      });
      
      // Add warning about keysend compatibility
      console.warn('🔍 KEYSEND COMPATIBILITY CHECK: Some wallets (like Coinos) may not support keysend to arbitrary node pubkeys. This may fail with "Keysend payment failed" error.');
      
      const response = await this.sendNWCRequest('pay_keysend', {
        pubkey,
        amount: amountMsats,
        tlv_records: finalTlvRecords
      });
      
      console.log('⚡ Keysend payment response:', response);
      
      if (response.error) {
        console.error('❌ Keysend payment error:', response.error);
        console.error('💡 Payment details that failed:', { 
          pubkey, 
          amountMsats, 
          amountSats: amount,
          tlvRecordsCount: finalTlvRecords.length,
          tlvRecords: finalTlvRecords
        });
        
        // Add specific error handling for common issues
        const errorMsg = response.error.message || response.error;
        if (errorMsg.includes('insufficient') || errorMsg.includes('balance')) {
          console.error('💰 Insufficient balance detected - check wallet funding');
        } else if (errorMsg.includes('amount') || errorMsg.includes('minimum')) {
          console.error('💸 Amount-related error - may be too small for this wallet');
        } else if (errorMsg.includes('pubkey') || errorMsg.includes('destination')) {
          console.error('🎯 Destination pubkey error - check recipient address');
        }
        
        return { error: errorMsg };
      }
      
      return {
        preimage: response.result?.preimage
      };
    } catch (error) {
      console.error('💥 Keysend payment exception:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * List transactions
   */
  async listTransactions(params?: { from?: number; until?: number; limit?: number }): Promise<any> {
    try {
      return await this.sendNWCRequest('list_transactions', params);
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Singleton instance
let nwcService: NWCService | null = null;

export function getNWCService(): NWCService {
  if (!nwcService) {
    nwcService = new NWCService();
  }
  return nwcService;
}