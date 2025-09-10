import { 
  SimplePool, 
  finalizeEvent, 
  type Event,
  type EventTemplate,
  type Filter,
  generateSecretKey,
  getPublicKey,
  nip19
} from 'nostr-tools';
import { getZapReceiptService, type ZapReceipt } from './zap-receipt-service';
import { LNURLService } from './lnurl-service';
import { WebLNService } from './webln-service';

/**
 * Service for posting track boosts to Nostr
 * Creates Kind 1 notes with track metadata and zap information
 */

export interface TrackMetadata {
  title?: string;
  artist?: string;
  album?: string;
  url?: string;
  imageUrl?: string;
  timestamp?: number; // Current playback position in seconds
  duration?: number; // Total track duration in seconds
  // Podcast-specific metadata
  podcastFeedGuid?: string;
  itemGuid?: string;
  feedUrl?: string;
  publisherGuid?: string;
  publisherUrl?: string;
  // Nostr announcement reference
  announcementEventId?: string; // Reference to track/album announcement event
}

export interface BoostOptions {
  amount: number; // Amount in sats
  comment?: string;
  track: TrackMetadata;
  zapReceipt?: ZapReceipt;
  tags?: string[]; // Additional hashtags
}

export interface BoostResult {
  event: Event;
  eventId: string;
  success: boolean;
  error?: string;
  nevent?: string; // Include nevent for sharing
}

export interface ZapRequestOptions {
  amount: number; // Amount in millisats
  recipientPubkey: string;
  comment?: string;
  relays: string[];
  track?: TrackMetadata;
  lnurl?: string; // Optional LNURL for recipient
}

export interface ZapRequest {
  event: Event;
  eventId: string;
  invoice?: string; // Lightning invoice from LNURL endpoint
}

export class BoostToNostrService {
  private pool: SimplePool;
  private relays: string[];
  private secretKey: Uint8Array | null = null;
  private publicKey: string | null = null;

  constructor(
    relays: string[] = [],
    secretKey?: Uint8Array
  ) {
    // Temporarily create a minimal pool that doesn't actually connect
    this.pool = new SimplePool();
    this.relays = relays.length > 0 ? relays : [
      'wss://relay.primal.net',
      'wss://relay.snort.social', 
      'wss://relay.nostr.band',
      'wss://relay.fountain.fm',
      'wss://relay.damus.io'
    ];

    if (secretKey) {
      this.setKeys(secretKey);
    }
  }

  /**
   * Set the keys for signing events
   */
  setKeys(secretKey: Uint8Array) {
    this.secretKey = secretKey;
    this.publicKey = getPublicKey(secretKey);
  }

  /**
   * Generate new keys if needed
   */
  generateKeys(): { secretKey: Uint8Array; publicKey: string; npub: string } {
    const secretKey = generateSecretKey();
    const publicKey = getPublicKey(secretKey);
    this.setKeys(secretKey);
    const npub = nip19.npubEncode(publicKey);
    return { secretKey, publicKey, npub };
  }

  /**
   * Check if keys are configured
   */
  hasKeys(): boolean {
    return !!(this.secretKey && this.publicKey);
  }

  /**
   * Format the boost amount for display
   */
  private formatAmount(sats: number): string {
    if (sats >= 1000000) {
      return `${(sats / 1000000).toFixed(2)}M`;
    } else if (sats >= 1000) {
      return `${(sats / 1000).toFixed(1)}k`;
    }
    return sats.toString();
  }

  /**
   * Format timestamp for display
   */
  private formatTimestamp(seconds?: number): string {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Generate ITDV site URL for track/album
   */
  private generateITDVUrl(track: TrackMetadata): string | null {
    const baseUrl = 'https://itdv.podtards.com';
    
    // For albums, use album title to create album URL with optional track hash
    if (track.album) {
      // Create album slug from title
      const albumSlug = track.album
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      let url = `${baseUrl}/album/${albumSlug}`;
      
      // Only add track identifier as hash if we have a track title that's different from album
      if (track.title && track.title !== track.album) {
        const trackSlug = track.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '');
        url += `#${trackSlug}`;
      }
      
      return url;
    }
    
    // For publishers, use artist name
    if (track.artist) {
      const publisherSlug = track.artist
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      return `${baseUrl}/publisher/${publisherSlug}`;
    }
    
    return null;
  }

  /**
   * Create a boost post for Nostr with detailed track info
   */
  private createBoostContent(options: BoostOptions): string {
    const { amount, comment, track } = options;
    
    // Get ITDV site URL
    const itdvUrl = this.generateITDVUrl(track);
    
    let content = '';
    
    // Start with boost amount
    content = `⚡ ${amount} sats`;
    
    // Add track title in quotes
    if (track.title) {
      content += ` • "${track.title}"`;
    }
    
    // Add artist
    if (track.artist) {
      content += ` by ${track.artist}`;
    }
    
    // Add album on new line if different from title
    if (track.album && track.album !== track.title) {
      content += `\nFrom: ${track.album}`;
    }
    
    // Add user comment if provided
    if (comment) {
      content += `\n\n${comment}`;
    }
    
    // Add ITDV site URL
    if (itdvUrl) {
      content += `\n\n🎧 ${itdvUrl}`;
    }
    
    // Add nevent reference to announcement if available (like Fountain does)
    if (track.announcementEventId) {
      // Create nevent from the announcement event ID
      const announcementNevent = nip19.neventEncode({
        id: track.announcementEventId,
        relays: this.relays.slice(0, 2),
        kind: 1
      });
      
      content += `\n\nnostr:${announcementNevent}`;
    }
    
    return content;
  }

  /**
   * Post a boost to Nostr
   */
  async postBoost(options: BoostOptions): Promise<BoostResult> {
    if (!this.secretKey || !this.publicKey) {
      return {
        event: {} as Event,
        eventId: '',
        success: false,
        error: 'No keys configured. Call setKeys() or generateKeys() first.'
      };
    }

    try {
      // Create initial content without nevent (we'll add it after we have the event ID)
      let content = this.createBoostContent(options);

      // Create event template
      const eventTemplate: EventTemplate = {
        kind: 1, // Text note
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content
      };

      // Add Fountain-style podcast tags in k/i pairs with ITDV URLs
      const itdvUrl = this.generateITDVUrl(options.track);
      
      if (options.track.itemGuid) {
        // k tag declares the identifier type
        eventTemplate.tags.push(['k', 'podcast:item:guid']);
        // i tag contains the actual identifier with URL hint
        const itemTag = ['i', `podcast:item:guid:${options.track.itemGuid}`];
        if (itdvUrl) {
          itemTag.push(itdvUrl);
        }
        eventTemplate.tags.push(itemTag);
      }

      if (options.track.podcastFeedGuid) {
        // k tag declares the identifier type
        eventTemplate.tags.push(['k', 'podcast:guid']);
        // i tag contains the actual identifier with URL hint
        const feedTag = ['i', `podcast:guid:${options.track.podcastFeedGuid}`];
        if (itdvUrl) {
          feedTag.push(itdvUrl);
        }
        eventTemplate.tags.push(feedTag);
      }

      if (options.track.publisherGuid) {
        // k tag declares the identifier type
        eventTemplate.tags.push(['k', 'podcast:publisher:guid']);
        // i tag contains the actual identifier with URL hint
        const publisherTag = ['i', `podcast:publisher:guid:${options.track.publisherGuid}`];
        if (itdvUrl) {
          publisherTag.push(itdvUrl);
        }
        eventTemplate.tags.push(publisherTag);
      }

      // Add album art image if available
      if (options.track.imageUrl) {
        eventTemplate.tags.push(['image', options.track.imageUrl]);
      }

      // Sign the event
      const event = finalizeEvent(eventTemplate, this.secretKey);
      
      // Create the nevent identifier for this event
      const neventData = {
        id: event.id,
        relays: this.relays.slice(0, 2), // Include first 2 relays as hints  
        author: event.pubkey,
        kind: 1
      };
      
      // Encode as nevent
      const nevent = nip19.neventEncode(neventData);
      
      // Verify event is properly formatted
      console.log('🔍 Event validation:', {
        hasId: !!event.id,
        hasValidId: event.id && event.id.length === 64,
        hasPubkey: !!event.pubkey,
        hasValidPubkey: event.pubkey && event.pubkey.length === 64,
        hasSignature: !!event.sig,
        hasValidSignature: event.sig && event.sig.length === 128,
        kind: event.kind,
        tagsCount: event.tags.length
      });

      // Publish to relays with detailed logging
      console.log('📡 Publishing boost note to relays:', this.relays);
      console.log('📝 Event details:', {
        id: event.id,
        kind: event.kind,
        created_at: event.created_at,
        tags: event.tags,
        content: event.content.substring(0, 100) + '...',
        nevent: `nostr:${nevent}`
      });
      
      try {
        const publishPromises = this.pool.publish(this.relays, event);
        
        // Wait for publish results with detailed logging
        const results = await Promise.allSettled(publishPromises);
        
        let successCount = 0;
        let failureCount = 0;
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            console.log(`✅ Published to ${this.relays[index]}`);
            successCount++;
          } else {
            console.warn(`❌ Failed to publish to ${this.relays[index]}:`, result.reason);
            failureCount++;
          }
        });
        
        console.log(`📊 Publish results: ${successCount} successful, ${failureCount} failed`);
        
        if (successCount > 0) {
          console.log('🎵 Boost note published successfully to Nostr relays');
          console.log(`🔗 View your boost: https://primal.net/e/${event.id}`);
          console.log(`🔗 Alternative: https://snort.social/e/${event.id}`);
          console.log(`🔗 Nostr reference: nostr:${nevent}`);
          console.log(`👤 Your Nostr profile: https://primal.net/p/${getPublicKey(this.secretKey)}`);
        } else {
          console.error('❌ Failed to publish to any relays');
        }
        
      } catch (publishError) {
        console.warn('⚠️ Failed to publish boost note:', publishError);
        // Continue anyway - the payment was successful
      }

      return {
        event,
        eventId: event.id,
        success: true,
        nevent: `nostr:${nevent}` // Include nevent for sharing
      };
    } catch (error) {
      console.error('Error posting boost to Nostr:', error);
      return {
        event: {} as Event,
        eventId: '',
        success: false,
        error: error instanceof Error ? error.message : 'Failed to post boost'
      };
    }
  }

  /**
   * Create a NIP-57/NIP-73 zap request (Kind 9734)
   */
  async createZapRequest(options: ZapRequestOptions): Promise<ZapRequest | null> {
    if (!this.secretKey || !this.publicKey) {
      console.error('No keys configured for zap request');
      return null;
    }

    try {
      // Create the zap request event template
      const eventTemplate: EventTemplate = {
        kind: 9734, // Zap request kind
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: options.comment || ''
      };

      // Add required tags for NIP-57
      eventTemplate.tags.push(['relays', ...options.relays]);
      eventTemplate.tags.push(['amount', options.amount.toString()]);
      eventTemplate.tags.push(['p', options.recipientPubkey]);

      // Add NIP-73 podcast metadata if provided
      if (options.track) {
        // Add podcast guid tags
        if (options.track.podcastFeedGuid) {
          eventTemplate.tags.push(['k', 'podcast:guid']);
          eventTemplate.tags.push([
            'i',
            `podcast:guid:${options.track.podcastFeedGuid}`,
            options.track.feedUrl || ''
          ]);
        }

        // Add episode/item guid tags
        if (options.track.itemGuid) {
          eventTemplate.tags.push(['k', 'podcast:item:guid']);
          const itemTag = [
            'i',
            `podcast:item:guid:${options.track.itemGuid}`
          ];
          
          // Add URL hint if available
          const itdvUrl = this.generateITDVUrl(options.track);
          if (itdvUrl) {
            itemTag.push(itdvUrl);
          }
          eventTemplate.tags.push(itemTag);
        }

        // Add publisher guid if available
        if (options.track.publisherGuid) {
          eventTemplate.tags.push(['k', 'podcast:publisher:guid']);
          eventTemplate.tags.push([
            'i',
            `podcast:publisher:guid:${options.track.publisherGuid}`,
            options.track.publisherUrl || ''
          ]);
        }
      }

      // Add lnurl tag if provided
      if (options.lnurl) {
        eventTemplate.tags.push(['lnurl', options.lnurl]);
      }

      // Sign the event
      const event = finalizeEvent(eventTemplate, this.secretKey);

      console.log('✅ Created zap request:', {
        eventId: event.id,
        kind: event.kind,
        tags: event.tags,
        amount: options.amount
      });

      return {
        event,
        eventId: event.id
      };
    } catch (error) {
      console.error('Failed to create zap request:', error);
      return null;
    }
  }

  /**
   * Execute a full zap flow with payment
   */
  async executeZap(
    lnurlOrAddress: string,
    options: ZapRequestOptions
  ): Promise<{ zapRequest: ZapRequest; invoice: string; paymentPreimage?: string; receipt?: ZapReceipt }> {
    try {
      // 1. Create the zap request
      console.log('1. Creating zap request...');
      const zapRequest = await this.createZapRequest(options);
      if (!zapRequest) {
        throw new Error('Failed to create zap request');
      }

      // 2. Get Lightning invoice from LNURL
      console.log('2. Fetching Lightning invoice from LNURL...');
      const invoice = await LNURLService.getZapInvoice(
        lnurlOrAddress,
        options.amount,
        zapRequest.event,
        options.comment
      );
      zapRequest.invoice = invoice;

      // 3. Pay the invoice via WebLN
      console.log('3. Paying invoice via WebLN...');
      let paymentPreimage: string | undefined;
      try {
        const paymentResponse = await WebLNService.payInvoice(invoice);
        paymentPreimage = paymentResponse.preimage;
        console.log('✓ Payment successful! Preimage:', paymentPreimage);
      } catch (payError) {
        console.warn('WebLN payment failed or was cancelled:', payError);
        // Return without payment - user can still see the invoice
        return { zapRequest, invoice };
      }

      // 4. Wait for zap receipt
      console.log('4. Waiting for zap receipt...');
      const receipt = await this.waitForZapReceipt(
        zapRequest.eventId,
        options.recipientPubkey,
        30000 // 30 second timeout
      );

      if (receipt) {
        console.log('✓ Zap receipt received:', receipt);
      } else {
        console.warn('⚠ Zap sent but receipt not found (may still arrive)');
      }

      return { zapRequest, invoice, paymentPreimage, receipt: receipt || undefined };
    } catch (error) {
      console.error('Zap execution failed:', error);
      throw error;
    }
  }

  /**
   * Wait for a zap receipt to appear on relays
   */
  async waitForZapReceipt(
    zapRequestId: string,
    recipientPubkey: string,
    timeoutMs: number = 30000
  ): Promise<ZapReceipt | null> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let subscription: any;

      const checkForReceipt = async () => {
        try {
          // Query for zap receipts
          const filter: Filter = {
            kinds: [9735],
            '#p': [recipientPubkey],
            since: Math.floor(startTime / 1000) - 60 // Look back 1 minute
          };

          const events = await this.pool.querySync(this.relays, filter);
          
          // Look for a receipt that references our zap request
          for (const event of events) {
            const descriptionTag = event.tags.find(tag => tag[0] === 'description');
            if (descriptionTag && descriptionTag[1]) {
              try {
                const zapRequestInReceipt = JSON.parse(descriptionTag[1]);
                if (zapRequestInReceipt.id === zapRequestId) {
                  // Found our receipt!
                  const zapService = getZapReceiptService(this.relays);
                  const receipt = zapService.parseZapReceipt(event);
                  resolve(receipt);
                  return;
                }
              } catch (e) {
                // Invalid description, skip
              }
            }
          }

          // Check if timeout reached
          if (Date.now() - startTime > timeoutMs) {
            console.warn('Zap receipt timeout reached');
            resolve(null);
            return;
          }

          // Check again in 2 seconds
          setTimeout(checkForReceipt, 2000);
        } catch (error) {
          console.error('Error checking for zap receipt:', error);
          resolve(null);
        }
      };

      // Start checking
      checkForReceipt();
    });
  }

  /**
   * Post a boost with automatic zap (full flow)
   */
  async postBoostWithZap(
    options: BoostOptions & { 
      recipientPubkey: string;
      lnurlOrAddress: string;
    }
  ): Promise<BoostResult & { 
    zapRequest?: ZapRequest;
    paymentPreimage?: string;
    zapReceipt?: ZapReceipt;
  }> {
    try {
      // Execute the full zap flow
      const zapResult = await this.executeZap(options.lnurlOrAddress, {
        amount: options.amount * 1000, // Convert sats to millisats
        recipientPubkey: options.recipientPubkey,
        comment: options.comment,
        relays: this.relays,
        track: options.track,
        lnurl: options.lnurlOrAddress
      });

      // Update options with the zap receipt if we got one
      if (zapResult.receipt) {
        options.zapReceipt = zapResult.receipt;
      }

      // Post the boost note with zap info
      const boostResult = await this.postBoost(options);

      return {
        ...boostResult,
        zapRequest: zapResult.zapRequest,
        paymentPreimage: zapResult.paymentPreimage,
        zapReceipt: zapResult.receipt
      };
    } catch (error) {
      console.error('Failed to post boost with zap:', error);
      return {
        event: {} as Event,
        eventId: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Fetch recent boosts from a user
   */
  async fetchUserBoosts(
    pubkey: string,
    limit: number = 20
  ): Promise<Event[]> {
    // Temporarily disabled to prevent filter errors
    console.log('🔍 User boosts fetch temporarily disabled to prevent relay filter errors');
    return [];
  }

  /**
   * Fetch boosts for a specific track
   */
  async fetchTrackBoosts(
    trackTitle: string,
    artist?: string,
    limit: number = 20
  ): Promise<Event[]> {
    // Temporarily disabled to prevent filter errors
    console.log('🔍 Track boosts fetch temporarily disabled to prevent relay filter errors');
    return [];
  }

  /**
   * Subscribe to live boosts
   */
  subscribeToBoosts(
    filters: {
      tracks?: Array<{ title: string; artist?: string }>;
      users?: string[];
    },
    callbacks: {
      onBoost: (event: Event) => void;
      onError?: (error: Error) => void;
    }
  ) {
    // Temporarily disabled to prevent filter errors
    // The issue is that nostr-tools is sending empty or malformed filters
    // which causes relay errors. We'll implement a proper solution later.
    console.log('🔍 Boost subscription temporarily disabled to prevent relay filter errors');
    
    return {
      close: () => {}
    };
  }

  /**
   * Parse boost data from an event
   */
  parseBoostEvent(event: Event): {
    amount?: number;
    trackTitle?: string;
    trackArtist?: string;
    trackAlbum?: string;
    comment?: string;
    timestamp: number;
  } | null {
    try {
      const amountTag = event.tags.find(tag => tag[0] === 'amount');
      const titleTag = event.tags.find(tag => tag[0] === 'track_title');
      const artistTag = event.tags.find(tag => tag[0] === 'track_artist');
      const albumTag = event.tags.find(tag => tag[0] === 'track_album');

      // Extract comment from content
      const contentLines = event.content.split('\n');
      const commentLine = contentLines.find(line => line.startsWith('💬'));
      const comment = commentLine ? commentLine.replace('💬 "', '').replace('"', '') : undefined;

      return {
        amount: amountTag ? parseInt(amountTag[1]) : undefined,
        trackTitle: titleTag?.[1],
        trackArtist: artistTag?.[1],
        trackAlbum: albumTag?.[1],
        comment,
        timestamp: event.created_at
      };
    } catch (error) {
      console.error('Error parsing boost event:', error);
      return null;
    }
  }

  /**
   * Close all connections
   */
  close() {
    this.pool.close(this.relays);
  }
}

// Singleton instance
let boostService: BoostToNostrService | null = null;

export function getBoostToNostrService(
  relays?: string[],
  secretKey?: Uint8Array
): BoostToNostrService {
  if (!boostService) {
    boostService = new BoostToNostrService(relays, secretKey);
  }
  return boostService;
}