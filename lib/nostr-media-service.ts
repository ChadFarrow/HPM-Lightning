import { 
  SimplePool, 
  finalizeEvent, 
  nip19,
  getPublicKey,
  type Event,
  type EventTemplate
} from 'nostr-tools';

export interface MediaPost {
  title: string;
  artist: string;
  album?: string;
  url: string;
  imageUrl?: string;
  duration?: number;
  type: 'song' | 'video' | 'podcast';
}

export interface NostrMediaPost {
  content: string;
  tags: string[][];
  kind: number;
  mediaMetadata: MediaPost;
}

export interface PostResult {
  success: boolean;
  eventId?: string;
  error?: string;
}

export class NostrMediaService {
  private pool: SimplePool;
  private relays: string[];

  constructor(relays: string[] = []) {
    this.pool = new SimplePool();
    this.relays = relays.length > 0 ? relays : [
      'wss://relay.damus.io',
      'wss://relay.snort.social',
      'wss://nos.lol',
      'wss://relay.nostr.band'
    ];
  }

  /**
   * Create a media post for Nostr
   */
  createMediaPost(
    media: MediaPost,
    message: string = '',
    hashtags: string[] = [],
    secretKey: Uint8Array
  ): NostrMediaPost {
    const publicKey = getPublicKey(secretKey);
    
    // Create content with media information
    let content = message;
    
    if (media.title) {
      content += `\n\n🎵 ${media.title}`;
    }
    
    if (media.artist) {
      content += ` by ${media.artist}`;
    }
    
    if (media.album) {
      content += ` (${media.album})`;
    }
    
    if (media.url) {
      content += `\n\n🔗 ${media.url}`;
    }

    // Create tags
    const tags: string[][] = [
      ['t', 'music'],
      ['t', 'value4value'],
      ['t', 'lightning'],
      ['url', media.url],
      ['title', media.title],
      ['artist', media.artist]
    ];

    if (media.album) {
      tags.push(['album', media.album]);
    }

    if (media.imageUrl) {
      tags.push(['image', media.imageUrl]);
    }

    if (media.duration) {
      tags.push(['duration', media.duration.toString()]);
    }

    // Add hashtags
    hashtags.forEach(tag => {
      tags.push(['t', tag]);
    });

    // Add app identifier
    tags.push(['app', 'hpm-lightning']);

    return {
      content,
      tags,
      kind: 1, // Regular note
      mediaMetadata: media
    };
  }

  /**
   * Post media to Nostr
   */
  async postMedia(
    media: MediaPost,
    message: string = '',
    hashtags: string[] = [],
    secretKey: Uint8Array
  ): Promise<PostResult> {
    try {
      const mediaPost = this.createMediaPost(media, message, hashtags, secretKey);
      
      const eventTemplate: EventTemplate = {
        kind: mediaPost.kind,
        created_at: Math.floor(Date.now() / 1000),
        tags: mediaPost.tags,
        content: mediaPost.content
      };

      const event = finalizeEvent(eventTemplate, secretKey);
      
      // Publish to relays
      const publishPromises = this.relays.map(async (relay) => {
        try {
          await this.pool.publish([relay], event);
          return { relay, success: true };
        } catch (error) {
          console.warn(`Failed to publish to ${relay}:`, error);
          return { relay, success: false, error };
        }
      });

      const results = await Promise.allSettled(publishPromises);
      const successfulPublishes = results.filter(
        result => result.status === 'fulfilled' && result.value.success
      );

      if (successfulPublishes.length > 0) {
        return {
          success: true,
          eventId: event.id
        };
      } else {
        return {
          success: false,
          error: 'Failed to publish to any relay'
        };
      }
    } catch (error) {
      console.error('Error posting media to Nostr:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create an embedded media post (for clients that support embedding)
   */
  createEmbeddedMediaPost(
    media: MediaPost,
    message: string = '',
    hashtags: string[] = [],
    secretKey: Uint8Array
  ): NostrMediaPost {
    const basePost = this.createMediaPost(media, message, hashtags, secretKey);
    
    // Add embedding-specific tags
    const embeddedTags = [...basePost.tags];
    
    // Add media type tag
    embeddedTags.push(['media_type', media.type]);
    
    // Add embedding hint
    embeddedTags.push(['embed', 'true']);
    
    // Add autoplay hint for compatible clients
    embeddedTags.push(['autoplay', 'true']);

    return {
      ...basePost,
      tags: embeddedTags
    };
  }

  /**
   * Post embedded media to Nostr
   */
  async postEmbeddedMedia(
    media: MediaPost,
    message: string = '',
    hashtags: string[] = [],
    secretKey: Uint8Array
  ): Promise<PostResult> {
    try {
      const embeddedPost = this.createEmbeddedMediaPost(media, message, hashtags, secretKey);
      
      const eventTemplate: EventTemplate = {
        kind: embeddedPost.kind,
        created_at: Math.floor(Date.now() / 1000),
        tags: embeddedPost.tags,
        content: embeddedPost.content,
      };

      const event = finalizeEvent(eventTemplate, secretKey);
      
      // Publish to relays
      const publishPromises = this.relays.map(async (relay) => {
        try {
          await this.pool.publish([relay], event);
          return { relay, success: true };
        } catch (error) {
          console.warn(`Failed to publish embedded media to ${relay}:`, error);
          return { relay, success: false, error };
        }
      });

      const results = await Promise.allSettled(publishPromises);
      const successfulPublishes = results.filter(
        result => result.status === 'fulfilled' && result.value.success
      );

      if (successfulPublishes.length > 0) {
        return {
          success: true,
          eventId: event.id
        };
      } else {
        return {
          success: false,
          error: 'Failed to publish embedded media to any relay'
        };
      }
    } catch (error) {
      console.error('Error posting embedded media to Nostr:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a boost post for media (NIP-57 compliant)
   */
  createMediaBoostPost(
    media: MediaPost,
    boostAmount: number,
    message: string = '',
    secretKey: Uint8Array
  ): NostrMediaPost {
    const publicKey = getPublicKey(secretKey);
    
    let content = message;
    if (media.title) {
      content += `\n\n🎵 ${media.title}`;
    }
    if (media.artist) {
      content += ` by ${media.artist}`;
    }

    const tags: string[][] = [
      ['t', 'music'],
      ['t', 'boost'],
      ['t', 'value4value'],
      ['t', 'lightning'],
      ['amount', boostAmount.toString()],
      ['url', media.url],
      ['title', media.title],
      ['artist', media.artist]
    ];

    if (media.album) {
      tags.push(['album', media.album]);
    }

    if (media.imageUrl) {
      tags.push(['image', media.imageUrl]);
    }

    // Add app identifier
    tags.push(['app', 'hpm-lightning']);

    return {
      content,
      tags,
      kind: 1, // Regular note
      mediaMetadata: media
    };
  }

  /**
   * Post media boost to Nostr
   */
  async postMediaBoost(
    media: MediaPost,
    boostAmount: number,
    message: string = '',
    secretKey: Uint8Array
  ): Promise<PostResult> {
    try {
      const boostPost = this.createMediaBoostPost(media, boostAmount, message, secretKey);
      
      const eventTemplate: EventTemplate = {
        kind: boostPost.kind,
        created_at: Math.floor(Date.now() / 1000),
        tags: boostPost.tags,
        content: boostPost.content,
      };

      const event = finalizeEvent(eventTemplate, secretKey);
      
      // Publish to relays
      const publishPromises = this.relays.map(async (relay) => {
        try {
          await this.pool.publish([relay], event);
          return { relay, success: true };
        } catch (error) {
          console.warn(`Failed to publish media boost to ${relay}:`, error);
          return { relay, success: false, error };
        }
      });

      const results = await Promise.allSettled(publishPromises);
      const successfulPublishes = results.filter(
        result => result.status === 'fulfilled' && result.value.success
      );

      if (successfulPublishes.length > 0) {
        return {
          success: true,
          eventId: event.id
        };
      } else {
        return {
          success: false,
          error: 'Failed to publish media boost to any relay'
        };
      }
    } catch (error) {
      console.error('Error posting media boost to Nostr:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.pool.close(this.relays);
  }
}

// Export singleton instance
export const nostrMediaService = new NostrMediaService();
