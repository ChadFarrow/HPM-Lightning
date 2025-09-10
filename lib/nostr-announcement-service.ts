import { 
  SimplePool, 
  finalizeEvent, 
  type Event,
  type EventTemplate,
  generateSecretKey,
  getPublicKey,
  nip19
} from 'nostr-tools';

export interface TrackAnnouncement {
  title: string;
  artist: string;
  album?: string;
  url: string;
  description?: string;
  image?: string;
  duration?: string;
  releaseDate?: string;
  itemGuid?: string;
  podcastFeedGuid?: string;
  feedUrl?: string;
  publisherGuid?: string;
}

export interface AnnouncementResult {
  event: Event;
  eventId: string;
  success: boolean;
  error?: string;
  nevent: string;
}

export class NostrAnnouncementService {
  private pool: SimplePool;
  private relays: string[];
  private secretKey: Uint8Array | null = null;
  private publicKey: string | null = null;

  constructor(
    relays: string[] = [],
    secretKey?: Uint8Array
  ) {
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
   * Set the keys for signing events (use your site's Nostr keypair)
   */
  setKeys(secretKey: Uint8Array) {
    this.secretKey = secretKey;
    this.publicKey = getPublicKey(secretKey);
  }

  /**
   * Generate new keys if needed (but you should use your existing site profile)
   */
  generateKeys(): { secretKey: Uint8Array; publicKey: string } {
    const secretKey = generateSecretKey();
    const publicKey = getPublicKey(secretKey);
    this.setKeys(secretKey);
    return { secretKey, publicKey };
  }

  /**
   * Create announcement content for a track/album
   */
  private createAnnouncementContent(track: TrackAnnouncement): string {
    let content = `🎵 New Release: "${track.title}"`;
    
    if (track.artist) {
      content += ` by ${track.artist}`;
    }
    
    if (track.album && track.album !== track.title) {
      content += `\nAlbum: ${track.album}`;
    }
    
    if (track.description) {
      content += `\n\n${track.description}`;
    }
    
    content += `\n\n🎧 Listen: ${track.url}`;
    
    return content;
  }

  /**
   * Post a track/album announcement to Nostr
   */
  async postAnnouncement(track: TrackAnnouncement): Promise<AnnouncementResult> {
    if (!this.secretKey || !this.publicKey) {
      return {
        event: {} as Event,
        eventId: '',
        success: false,
        error: 'No keys configured. Call setKeys() with your site keypair first.',
        nevent: ''
      };
    }

    try {
      const content = this.createAnnouncementContent(track);

      // Create event template (Kind 1 - Text Note)
      const eventTemplate: EventTemplate = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content
      };

      // Add music/podcast hashtags
      eventTemplate.tags.push(['t', 'music']);
      eventTemplate.tags.push(['t', 'podcast']);
      eventTemplate.tags.push(['t', 'NewMusic']);
      if (track.artist) {
        eventTemplate.tags.push(['t', track.artist.replace(/\s+/g, '')]);
      }

      // Add podcast metadata tags if available
      if (track.itemGuid) {
        eventTemplate.tags.push(['k', 'podcast:item:guid']);
        eventTemplate.tags.push(['i', `podcast:item:guid:${track.itemGuid}`, track.url]);
      }

      if (track.podcastFeedGuid) {
        eventTemplate.tags.push(['k', 'podcast:guid']);
        eventTemplate.tags.push(['i', `podcast:guid:${track.podcastFeedGuid}`, track.feedUrl || track.url]);
      }

      if (track.publisherGuid) {
        eventTemplate.tags.push(['k', 'podcast:publisher:guid']);
        eventTemplate.tags.push(['i', `podcast:publisher:guid:${track.publisherGuid}`, track.url]);
      }

      // Add URL as a reference
      eventTemplate.tags.push(['r', track.url]);

      // Sign the event
      const event = finalizeEvent(eventTemplate, this.secretKey);
      
      // Create nevent for sharing
      const neventData = {
        id: event.id,
        relays: this.relays.slice(0, 2),
        author: event.pubkey,
        kind: 1
      };
      
      const nevent = nip19.neventEncode(neventData);

      // Publish to relays
      console.log('📡 Publishing track announcement to Nostr relays:', this.relays);
      console.log('📝 Announcement details:', {
        id: event.id,
        kind: event.kind,
        created_at: event.created_at,
        tags: event.tags.length,
        content: content.substring(0, 100) + '...'
      });
      
      try {
        const publishPromises = this.pool.publish(this.relays, event);
        const results = await Promise.allSettled(publishPromises);
        
        let successCount = 0;
        let failureCount = 0;
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            console.log(`✅ Published announcement to ${this.relays[index]}`);
            successCount++;
          } else {
            console.warn(`❌ Failed to publish announcement to ${this.relays[index]}:`, result.reason);
            failureCount++;
          }
        });
        
        console.log(`📊 Announcement publish results: ${successCount} successful, ${failureCount} failed`);
        
        if (successCount > 0) {
          console.log('🎵 Track announcement published successfully to Nostr');
          console.log(`🔗 View announcement: https://primal.net/e/${event.id}`);
          console.log(`🔗 Nostr reference: nostr:${nevent}`);
        } else {
          console.error('❌ Failed to publish announcement to any relays');
        }
        
      } catch (publishError) {
        console.warn('⚠️ Failed to publish announcement:', publishError);
      }

      return {
        event,
        eventId: event.id,
        success: true,
        nevent: `nostr:${nevent}`
      };
    } catch (error) {
      console.error('Error posting announcement to Nostr:', error);
      return {
        event: {} as Event,
        eventId: '',
        success: false,
        error: error instanceof Error ? error.message : 'Failed to post announcement',
        nevent: ''
      };
    }
  }

  /**
   * Close all connections
   */
  close() {
    this.pool.close(this.relays);
  }
}

// Singleton instance for the site
let announcementService: NostrAnnouncementService | null = null;

export function getAnnouncementService(
  relays?: string[],
  secretKey?: Uint8Array
): NostrAnnouncementService {
  if (!announcementService) {
    announcementService = new NostrAnnouncementService(relays, secretKey);
  }
  return announcementService;
}