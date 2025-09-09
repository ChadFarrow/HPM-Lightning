import { 
  SimplePool, 
  finalizeEvent, 
  type Event,
  type EventTemplate,
  generateSecretKey,
  getPublicKey
} from 'nostr-tools';
import { getZapReceiptService, type ZapReceipt } from './zap-receipt-service';

/**
 * Service for posting track boosts to Nostr
 * Creates Kind 1 notes with track metadata and zap information
 */

export interface TrackMetadata {
  title: string;
  artist: string;
  album?: string;
  url?: string;
  imageUrl?: string;
  timestamp?: number; // Current playback position in seconds
  duration?: number; // Total track duration in seconds
  // Podcast-specific metadata
  podcastFeedGuid?: string;
  itemGuid?: string;
  feedUrl?: string;
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
      'wss://relay.damus.io',
      'wss://relay.primal.net',
      'wss://relay.snort.social', 
      'wss://nos.lol',
      'wss://relay.nostr.band',
      'wss://nostr.wine',
      'wss://eden.nostr.land',
      'wss://nostr.fmt.wiz.biz',
      'wss://relay.current.fyi',
      'wss://brb.io'
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
  generateKeys(): { secretKey: Uint8Array; publicKey: string } {
    const secretKey = generateSecretKey();
    const publicKey = getPublicKey(secretKey);
    this.setKeys(secretKey);
    return { secretKey, publicKey };
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
   * Create a boost post for Nostr
   */
  private createBoostContent(options: BoostOptions): string {
    const { comment, track, zapReceipt } = options;
    
    // For podcast boosts, the content should primarily be the user's message
    // The amount will be referenced via zap receipt
    let content = '';
    
    if (comment) {
      content = comment;
    } else {
      // Default message if no comment provided
      content = `Boosted "${track.title}" by ${track.artist}`;
    }
    
    // Add relevant hashtags
    const hashtags = ['#boost', '#music', '#podcast'];
    if (options.tags) {
      hashtags.push(...options.tags);
    }
    
    content += '\n\n' + hashtags.join(' ');
    
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
      const content = this.createBoostContent(options);

      // Create event template
      const eventTemplate: EventTemplate = {
        kind: 1, // Text note
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content
      };

      // Add hashtags for discoverability
      eventTemplate.tags.push(['t', 'boost']);
      eventTemplate.tags.push(['t', 'music']);
      eventTemplate.tags.push(['t', 'podcast']);

      // Add NIP-73 i tags for podcast metadata
      if (options.track.podcastFeedGuid) {
        // Feed GUID with URL hint
        const feedTag = ['i', `podcast:guid:${options.track.podcastFeedGuid}`];
        if (options.track.feedUrl) {
          feedTag.push(options.track.feedUrl);
        }
        eventTemplate.tags.push(feedTag);
      }

      if (options.track.itemGuid) {
        // Item GUID with URL hint
        const itemTag = ['i', `podcast:item:guid:${options.track.itemGuid}`];
        if (options.track.url) {
          itemTag.push(options.track.url);
        }
        eventTemplate.tags.push(itemTag);
      }

      // If we have a direct track URL, add as i tag
      if (options.track.url && !options.track.itemGuid) {
        eventTemplate.tags.push(['i', options.track.url]);
      }

      // Reference the zap receipt if available (this provides the amount)
      if (options.zapReceipt) {
        eventTemplate.tags.push(['e', options.zapReceipt.id, '', 'zap']);
      }

      // Add client tag
      eventTemplate.tags.push(['client', 'ITDV-Lightning']);

      // Sign the event
      const event = finalizeEvent(eventTemplate, this.secretKey);
      
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
        content: event.content.substring(0, 100) + '...'
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
        success: true
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
   * Post a boost with automatic zap
   * This creates a zap and then posts about it
   */
  async postBoostWithZap(
    options: BoostOptions & { recipientPubkey: string }
  ): Promise<BoostResult & { zapReceipt?: ZapReceipt }> {
    // Note: Actual zapping requires Lightning wallet integration
    // This is a placeholder for the full implementation
    // You would need to:
    // 1. Create a zap request (Kind 9734)
    // 2. Get Lightning invoice from recipient's LNURL
    // 3. Pay the invoice
    // 4. Wait for zap receipt (Kind 9735)
    // 5. Post the boost with the receipt

    // For now, just post the boost without the actual zap
    const result = await this.postBoost(options);
    return result;
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