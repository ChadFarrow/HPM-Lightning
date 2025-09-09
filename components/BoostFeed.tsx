'use client';

import { useState, useEffect } from 'react';
import { Zap, Music, User, Clock, MessageCircle, RefreshCw, Radio } from 'lucide-react';
import { getBoostToNostrService } from '@/lib/boost-to-nostr-service';
import type { Event } from 'nostr-tools';

interface BoostFeedProps {
  trackFilter?: { title: string; artist?: string };
  userFilter?: string;
  limit?: number;
  showLive?: boolean;
  className?: string;
}

export function BoostFeed({
  trackFilter,
  userFilter,
  limit = 50,
  showLive = true,
  className = ''
}: BoostFeedProps) {
  const [boosts, setBoosts] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Fetch historical boosts
  const fetchBoosts = async () => {
    setLoading(true);
    try {
      const service = getBoostToNostrService();
      
      let fetchedBoosts: Event[] = [];
      
      if (trackFilter) {
        fetchedBoosts = await service.fetchTrackBoosts(
          trackFilter.title,
          trackFilter.artist,
          limit
        );
      } else if (userFilter) {
        fetchedBoosts = await service.fetchUserBoosts(userFilter, limit);
      } else {
        // Fetch all recent boosts - would need to implement this method
        // For now, we'll just show live boosts
        fetchedBoosts = [];
      }
      
      setBoosts(fetchedBoosts);
    } catch (error) {
      console.error('Error fetching boosts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to live boosts
  useEffect(() => {
    if (!showLive) return;

    // For now, disable live subscriptions to avoid relay filter errors
    // The boost button will add boosts to the feed directly
    setIsSubscribed(false);
    
    // Uncomment when relay filter issues are resolved:
    /*
    const service = getBoostToNostrService();
    
    const filters: Parameters<typeof service.subscribeToBoosts>[0] = {};
    
    if (trackFilter) {
      filters.tracks = [trackFilter];
    }
    if (userFilter) {
      filters.users = [userFilter];
    }

    const sub = service.subscribeToBoosts(filters, {
      onBoost: (event) => {
        setBoosts(prev => {
          const exists = prev.some(b => b.id === event.id);
          if (exists) return prev;
          return [event, ...prev].slice(0, limit);
        });
      },
      onError: (err) => {
        console.error('Boost subscription error:', err);
      }
    });

    setIsSubscribed(true);

    return () => {
      sub.close();
      setIsSubscribed(false);
    };
    */
  }, [showLive, trackFilter, userFilter, limit]);

  // Initial fetch
  useEffect(() => {
    fetchBoosts();
  }, [trackFilter, userFilter]);

  // Listen for local boost events from BoostButton
  useEffect(() => {
    const handleNewBoost = (event: CustomEvent) => {
      const { event: nostrEvent } = event.detail;
      setBoosts(prev => {
        // Check if boost already exists
        const exists = prev.some(b => b.id === nostrEvent.id);
        if (exists) return prev;
        
        // Add new boost to the beginning
        return [nostrEvent, ...prev].slice(0, limit);
      });
    };

    window.addEventListener('newBoost', handleNewBoost as EventListener);
    return () => window.removeEventListener('newBoost', handleNewBoost as EventListener);
  }, [limit]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'just now';
    }
  };

  const parseBoostContent = (content: string) => {
    const lines = content.split('\n');
    const boost: any = {};

    lines.forEach(line => {
      if (line.startsWith('⚡ Boosted')) {
        boost.amount = line.replace('⚡ Boosted ', '').replace(' sats', '');
      } else if (line.startsWith('🎵')) {
        boost.title = line.replace('🎵 ', '');
      } else if (line.startsWith('👤')) {
        boost.artist = line.replace('👤 ', '');
      } else if (line.startsWith('💿')) {
        boost.album = line.replace('💿 ', '');
      } else if (line.startsWith('💬')) {
        boost.comment = line.replace('💬 "', '').replace('"', '');
      } else if (line.startsWith('⏱️')) {
        boost.timestamp = line.replace('⏱️ ', '');
      }
    });

    return boost;
  };

  const shortenPubkey = (pubkey: string) => {
    return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
  };

  return (
    <div className={`bg-gray-900 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Boost Feed
            {trackFilter && (
              <span className="text-sm text-gray-400">
                for {trackFilter.title}
              </span>
            )}
          </h3>
          <div className="flex items-center gap-2">
            {showLive && isSubscribed && (
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-green-500 animate-pulse" />
                <span className="text-xs text-gray-400">Live</span>
              </div>
            )}
            <button
              onClick={fetchBoosts}
              disabled={loading}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-400">
          {boosts.length} boost{boosts.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Loading state */}
      {loading && boosts.length === 0 && (
        <div className="p-8 text-center">
          <div className="inline-flex items-center gap-2 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Loading boosts...</span>
          </div>
        </div>
      )}

      {/* Boosts list */}
      <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
        {boosts.map((boost) => {
          const parsed = parseBoostContent(boost.content);
          
          return (
            <div key={boost.id} className="p-4 hover:bg-gray-800/50 transition-colors">
              {/* Boost header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="font-semibold text-yellow-500">
                      {parsed.amount || '??? sats'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTime(boost.created_at)}
                  </span>
                </div>
              </div>

              {/* Track info */}
              {(parsed.title || parsed.artist) && (
                <div className="mb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Music className="w-3 h-3 text-gray-500" />
                    <span className="text-white">{parsed.title || 'Unknown'}</span>
                    {parsed.artist && (
                      <>
                        <span className="text-gray-500">by</span>
                        <span className="text-gray-300">{parsed.artist}</span>
                      </>
                    )}
                  </div>
                  {parsed.album && (
                    <p className="text-xs text-gray-500 ml-5">{parsed.album}</p>
                  )}
                  {parsed.timestamp && (
                    <p className="text-xs text-gray-600 ml-5">at {parsed.timestamp}</p>
                  )}
                </div>
              )}

              {/* Comment */}
              {parsed.comment && (
                <div className="flex items-start gap-2 mb-2">
                  <MessageCircle className="w-3 h-3 text-gray-500 mt-0.5" />
                  <p className="text-sm text-gray-300 italic">&ldquo;{parsed.comment}&rdquo;</p>
                </div>
              )}

              {/* User info */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <User className="w-3 h-3" />
                <span>{shortenPubkey(boost.pubkey)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {!loading && boosts.length === 0 && (
        <div className="p-8 text-center">
          <Zap className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400">No boosts found</p>
          <p className="text-sm text-gray-500 mt-1">
            {trackFilter 
              ? 'Be the first to boost this track!' 
              : 'Boosts will appear here when posted'}
          </p>
        </div>
      )}
    </div>
  );
}