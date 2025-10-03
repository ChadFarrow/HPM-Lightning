import { NWCService, type NWCConnection } from './nwc-service';
import { nostrAuthService, type NostrUser } from './nostr-auth-service';

export interface EnhancedNWCConfig {
  nostrUser: NostrUser;
  autoDetect: boolean;
  preferredWallets: string[];
}

export interface NWCDetectionResult {
  hasNWC: boolean;
  connectionString?: string;
  walletType?: string;
  confidence: number;
}

export class EnhancedNWCService extends NWCService {
  private nostrUser: NostrUser | null = null;

  /**
   * Set the authenticated Nostr user for enhanced NWC functionality
   */
  setNostrUser(user: NostrUser): void {
    this.nostrUser = user;
  }

  /**
   * Auto-detect NWC capability from Nostr user profile
   */
  async detectNWCCapability(user: NostrUser): Promise<NWCDetectionResult> {
    try {
      // Check if user has lud16 (Lightning address) in profile
      if (user.profile?.lud16) {
        return {
          hasNWC: true,
          walletType: 'lightning-address',
          confidence: 0.8
        };
      }

      // Check if user follows known NWC-compatible services
      const nwcServices = [
        'npub1alice', // Alby Hub
        'npub1bob',   // Mutiny
        'npub1charlie' // Other NWC services
      ];

      const followsNWCServices = user.following?.some(pubkey => 
        nwcServices.includes(pubkey)
      );

      if (followsNWCServices) {
        return {
          hasNWC: true,
          walletType: 'nwc-service',
          confidence: 0.6
        };
      }

      // Check if user has NWC connection string in profile metadata
      const nwcConnectionString = this.extractNWCFromProfile(user);
      if (nwcConnectionString) {
        return {
          hasNWC: true,
          connectionString: nwcConnectionString,
          walletType: 'profile-nwc',
          confidence: 0.9
        };
      }

      return {
        hasNWC: false,
        confidence: 0.1
      };
    } catch (error) {
      console.error('Error detecting NWC capability:', error);
      return {
        hasNWC: false,
        confidence: 0.0
      };
    }
  }

  /**
   * Extract NWC connection string from user profile
   */
  private extractNWCFromProfile(user: NostrUser): string | null {
    // Check website field for NWC connection string
    if (user.profile?.website?.includes('nostr+walletconnect://')) {
      return user.profile.website;
    }

    // Check about field for NWC connection string
    if (user.profile?.about?.includes('nostr+walletconnect://')) {
      return user.profile.about;
    }

    return null;
  }

  /**
   * Auto-configure NWC for authenticated Nostr user
   */
  async autoConfigureNWC(user: NostrUser): Promise<boolean> {
    try {
      this.setNostrUser(user);

      // Detect NWC capability
      const detection = await this.detectNWCCapability(user);
      
      if (!detection.hasNWC) {
        console.log('No NWC capability detected for user');
        return false;
      }

      // If we have a connection string, use it directly
      if (detection.connectionString) {
        await this.connect(detection.connectionString);
        return true;
      }

      // If user has Lightning address, try to detect compatible wallet
      if (user.profile?.lud16) {
        const walletConnection = await this.detectWalletFromLightningAddress(user.profile.lud16);
        if (walletConnection) {
          await this.connect(walletConnection);
          return true;
        }
      }

      // Try to detect from social connections
      if (user.following && user.following.length > 0) {
        const walletConnection = await this.detectWalletFromSocialConnections(user.following);
        if (walletConnection) {
          await this.connect(walletConnection);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error auto-configuring NWC:', error);
      return false;
    }
  }

  /**
   * Detect wallet connection from Lightning address
   */
  private async detectWalletFromLightningAddress(lud16: string): Promise<string | null> {
    try {
      // Common Lightning address patterns that might indicate NWC compatibility
      const nwcCompatibleDomains = [
        'getalby.com',
        'alby.me',
        'mutiny.ninja',
        'cashu.me'
      ];

      const domain = lud16.split('@')[1];
      if (nwcCompatibleDomains.includes(domain)) {
        // For now, we can't automatically generate NWC connection strings
        // This would require additional API calls or user input
        return null;
      }

      return null;
    } catch (error) {
      console.error('Error detecting wallet from Lightning address:', error);
      return null;
    }
  }

  /**
   * Detect wallet connection from social connections
   */
  private async detectWalletFromSocialConnections(following: string[]): Promise<string | null> {
    try {
      // Known NWC service pubkeys
      const nwcServices: { [key: string]: string } = {
        'npub1alice': 'nostr+walletconnect://alice@relay.damus.io?relay=wss://relay.damus.io&secret=...',
        'npub1bob': 'nostr+walletconnect://bob@relay.snort.social?relay=wss://relay.snort.social&secret=...',
        // Add more known NWC services
      };

      for (const pubkey of following) {
        if (nwcServices[pubkey]) {
          // This is a simplified example - in reality, you'd need to fetch
          // the actual connection string from the service
          return nwcServices[pubkey];
        }
      }

      return null;
    } catch (error) {
      console.error('Error detecting wallet from social connections:', error);
      return null;
    }
  }

  /**
   * Get enhanced payment metadata for Nostr users
   */
  getEnhancedPaymentMetadata(): any {
    if (!this.nostrUser) {
      return {};
    }

    return {
      nostrUser: {
        pubkey: this.nostrUser.pubkey,
        npub: this.nostrUser.npub,
        name: this.nostrUser.profile?.name,
        picture: this.nostrUser.profile?.picture
      },
      socialProof: {
        followers: this.nostrUser.followers?.length || 0,
        following: this.nostrUser.following?.length || 0
      }
    };
  }

  /**
   * Create enhanced payment request with Nostr metadata
   */
  async createEnhancedPaymentRequest(
    invoice: string,
    amount?: number,
    description?: string
  ): Promise<any> {
    const baseRequest = {
      invoice,
      amount,
      description
    };

    if (this.nostrUser) {
      return {
        ...baseRequest,
        metadata: this.getEnhancedPaymentMetadata(),
        nostrIntegration: true
      };
    }

    return baseRequest;
  }

  /**
   * Check if current connection is enhanced with Nostr data
   */
  isEnhanced(): boolean {
    return this.nostrUser !== null && this.isConnected();
  }

  /**
   * Get user's preferred payment settings
   */
  getUserPaymentPreferences(): any {
    if (!this.nostrUser) {
      return {};
    }

    return {
      preferredAmount: 1000, // Default 1000 sats
      autoBoost: false,
      includeSocialProof: true,
      nostrUser: this.nostrUser
    };
  }
}

// Export singleton instance
export const enhancedNWCService = new EnhancedNWCService();
