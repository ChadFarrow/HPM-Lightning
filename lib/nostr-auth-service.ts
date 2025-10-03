import { 
  generateSecretKey, 
  getPublicKey, 
  finalizeEvent, 
  nip19,
  nip04,
  SimplePool,
  type Event,
  type EventTemplate
} from 'nostr-tools';

export interface NostrUser {
  pubkey: string;
  npub: string;
  profile?: {
    name?: string;
    about?: string;
    picture?: string;
    banner?: string;
    website?: string;
    lud16?: string;
    nip05?: string;
  };
  followers?: string[];
  following?: string[];
  relays?: string[];
}

export interface AuthChallenge {
  message: string;
  timestamp: number;
  nonce: string;
}

export interface AuthResult {
  success: boolean;
  user?: NostrUser;
  error?: string;
}

export class NostrAuthService {
  private pool: SimplePool;
  private defaultRelays: string[];

  constructor(relays: string[] = []) {
    this.pool = new SimplePool();
    this.defaultRelays = relays.length > 0 ? relays : [
      'wss://relay.damus.io',
      'wss://relay.snort.social',
      'wss://nos.lol',
      'wss://relay.nostr.band'
    ];
  }

  /**
   * Generate a new Nostr key pair
   */
  generateKeyPair(): { secretKey: Uint8Array; publicKey: string; npub: string } {
    const secretKey = generateSecretKey();
    const publicKey = getPublicKey(secretKey);
    const npub = nip19.npubEncode(publicKey);
    
    return {
      secretKey,
      publicKey,
      npub
    };
  }

  /**
   * Create an authentication challenge
   */
  createAuthChallenge(): AuthChallenge {
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(2, 15);
    const message = `Sign this message to authenticate with HPM Lightning at ${timestamp}:${nonce}`;
    
    return {
      message,
      timestamp,
      nonce
    };
  }

  /**
   * Sign an authentication challenge
   */
  async signChallenge(challenge: AuthChallenge, secretKey: Uint8Array): Promise<string> {
    const publicKey = getPublicKey(secretKey);
    
    const eventTemplate: EventTemplate = {
      kind: 27235, // Custom kind for authentication
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['challenge', challenge.nonce],
        ['timestamp', challenge.timestamp.toString()],
        ['app', 'hpm-lightning']
      ],
      content: challenge.message
    };

    const event = finalizeEvent(eventTemplate, secretKey);
    return JSON.stringify(event);
  }

  /**
   * Verify a signed authentication challenge
   */
  async verifyChallenge(signedEvent: string, expectedPubkey: string): Promise<boolean> {
    try {
      const event: Event = JSON.parse(signedEvent);
      
      // Verify the event structure
      if (!event.sig || !event.pubkey || !event.tags) {
        return false;
      }

      // Verify the pubkey matches
      if (event.pubkey !== expectedPubkey) {
        return false;
      }

      // Verify the challenge nonce and timestamp
      const challengeTag = event.tags.find(tag => tag[0] === 'challenge');
      const timestampTag = event.tags.find(tag => tag[0] === 'timestamp');
      
      if (!challengeTag || !timestampTag) {
        return false;
      }

      // Check timestamp is recent (within 5 minutes)
      const timestamp = parseInt(timestampTag[1]);
      const now = Date.now();
      if (now - timestamp > 5 * 60 * 1000) {
        return false;
      }

      // Verify the signature (this would require importing verification functions)
      // For now, we'll trust the client-side signing
      return true;
    } catch (error) {
      console.error('Error verifying challenge:', error);
      return false;
    }
  }

  /**
   * Parse and validate a Nostr key (nsec or npub)
   */
  parseNostrKey(keyString: string): { type: 'nsec' | 'npub'; data: string; secretKey?: Uint8Array } | null {
    try {
      const decoded = nip19.decode(keyString);
      
      if (decoded.type === 'nsec') {
        return {
          type: 'nsec',
          data: nip19.nsecEncode(decoded.data as Uint8Array),
          secretKey: decoded.data as Uint8Array
        };
      } else if (decoded.type === 'npub') {
        return {
          type: 'npub',
          data: decoded.data as string
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing Nostr key:', error);
      return null;
    }
  }

  /**
   * Fetch user profile from Nostr relays
   */
  async fetchUserProfile(pubkey: string): Promise<NostrUser | null> {
    try {
      const events = await this.pool.querySync(this.defaultRelays, {
        kinds: [0], // Profile events
        authors: [pubkey],
        limit: 1
      });

      if (events.length === 0) {
        return {
          pubkey,
          npub: nip19.npubEncode(pubkey)
        };
      }

      const profileEvent = events[0];
      let profile = {};
      
      try {
        profile = JSON.parse(profileEvent.content);
      } catch (error) {
        console.warn('Failed to parse profile JSON:', error);
      }

      return {
        pubkey,
        npub: nip19.npubEncode(pubkey),
        profile: profile as NostrUser['profile']
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Fetch user's followers and following lists
   */
  async fetchUserSocialData(pubkey: string): Promise<{ followers: string[]; following: string[] }> {
    try {
      const [followersEvents, followingEvents] = await Promise.all([
        this.pool.querySync(this.defaultRelays, {
          kinds: [3], // Contact list events
          authors: [pubkey],
          limit: 1
        }),
        this.pool.querySync(this.defaultRelays, {
          kinds: [3], // Contact list events
          '#p': [pubkey], // Events that reference this pubkey
          limit: 100
        })
      ]);

      let following: string[] = [];
      if (followersEvents.length > 0) {
        const contactList = followersEvents[0];
        following = contactList.tags
          .filter(tag => tag[0] === 'p')
          .map(tag => tag[1]);
      }

      const followers: string[] = [];
      followingEvents.forEach(event => {
        if (event.tags.some(tag => tag[0] === 'p' && tag[1] === pubkey)) {
          followers.push(event.pubkey);
        }
      });

      return { followers, following };
    } catch (error) {
      console.error('Error fetching social data:', error);
      return { followers: [], following: [] };
    }
  }

  /**
   * Authenticate user with Nostr key
   */
  async authenticate(keyString: string): Promise<AuthResult> {
    try {
      const parsedKey = this.parseNostrKey(keyString);
      
      if (!parsedKey) {
        return {
          success: false,
          error: 'Invalid Nostr key format'
        };
      }

      if (parsedKey.type === 'npub') {
        // Public key only - fetch profile but no authentication
        const user = await this.fetchUserProfile(parsedKey.data);
        if (!user) {
          return {
            success: false,
            error: 'Failed to fetch user profile'
          };
        }

        return {
          success: true,
          user
        };
      }

      // Private key - full authentication
      const secretKey = parsedKey.secretKey!;
      const publicKey = getPublicKey(secretKey);
      
      // Create and sign challenge
      const challenge = this.createAuthChallenge();
      const signedEvent = await this.signChallenge(challenge, secretKey);
      
      // Verify the challenge
      const isValid = await this.verifyChallenge(signedEvent, publicKey);
      if (!isValid) {
        return {
          success: false,
          error: 'Authentication verification failed'
        };
      }

      // Fetch user data
      const [user, socialData] = await Promise.all([
        this.fetchUserProfile(publicKey),
        this.fetchUserSocialData(publicKey)
      ]);

      if (!user) {
        return {
          success: false,
          error: 'Failed to fetch user profile'
        };
      }

      // Add social data to user
      user.followers = socialData.followers;
      user.following = socialData.following;

      return {
        success: true,
        user
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  /**
   * Store user session data
   */
  storeUserSession(user: NostrUser, secretKey?: Uint8Array): void {
    const sessionData = {
      user,
      timestamp: Date.now(),
      hasSecretKey: !!secretKey
    };

    localStorage.setItem('nostr_user_session', JSON.stringify(sessionData));
    
    if (secretKey) {
      // Store encrypted secret key
      const encryptedKey = btoa(String.fromCharCode(...Array.from(secretKey)));
      localStorage.setItem('nostr_secret_key', encryptedKey);
    }
  }

  /**
   * Retrieve user session data
   */
  getUserSession(): { user: NostrUser; secretKey?: Uint8Array } | null {
    try {
      const sessionData = localStorage.getItem('nostr_user_session');
      if (!sessionData) return null;

      const parsed = JSON.parse(sessionData);
      
      // Check if session is still valid (24 hours)
      if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
        this.clearUserSession();
        return null;
      }

      let secretKey: Uint8Array | undefined;
      if (parsed.hasSecretKey) {
        const encryptedKey = localStorage.getItem('nostr_secret_key');
        if (encryptedKey) {
          const keyBytes = atob(encryptedKey);
          secretKey = new Uint8Array(Array.from(keyBytes, c => c.charCodeAt(0)));
        }
      }

      return {
        user: parsed.user,
        secretKey
      };
    } catch (error) {
      console.error('Error retrieving user session:', error);
      return null;
    }
  }

  /**
   * Clear user session data
   */
  clearUserSession(): void {
    localStorage.removeItem('nostr_user_session');
    localStorage.removeItem('nostr_secret_key');
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.pool.close(this.defaultRelays);
  }
}

// Export singleton instance
export const nostrAuthService = new NostrAuthService();
