'use client';

import { useState, useRef, useEffect, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Pause, Music, Zap } from 'lucide-react';
import { BitcoinConnectPayment } from '@/components/BitcoinConnect';
import { useBitcoinConnect } from '@/contexts/BitcoinConnectContext';
import type { RSSValue, RSSValueRecipient } from '@/lib/rss-parser';
import confetti from 'canvas-confetti';

interface Track {
  title: string;
  duration: string;
  url: string;
  trackNumber: number;
  image?: string;
  value?: RSSValue; // Track-level podcast:value data
}

interface Album {
  title: string;
  artist: string;
  description: string;
  coverArt: string;
  tracks: Track[];
  releaseDate: string;
  feedId: string;
  feedUrl?: string;
  link?: string; // RSS channel link
  funding?: any[];
  value?: RSSValue;
  podroll?: any[];
  podcastGuid?: string; // Real podcast:guid from RSS feed
  publisher?: {
    feedGuid: string;
    feedUrl: string;
    medium: string;
  };
}

interface AlbumCardProps {
  album: Album;
  isPlaying?: boolean;
  onPlay: (album: Album, e: React.MouseEvent | React.TouchEvent) => void;
  className?: string;
}

function AlbumCard({ album, isPlaying = false, onPlay, className = '' }: AlbumCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showBoostSuccess, setShowBoostSuccess] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  
  const { checkConnection } = useBitcoinConnect();

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    // Only handle swipes, remove tap-to-play to prevent accidental plays
    if (isLeftSwipe) {
      // Left swipe - play next track (future enhancement)
      console.log('Left swipe detected - next track');
    } else if (isRightSwipe) {
      // Right swipe - play previous track (future enhancement)
      console.log('Right swipe detected - previous track');
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  const handleBoostSuccess = (response: any) => {
    setShowBoostSuccess(true);
    setShowBoostModal(false);
    setTimeout(() => setShowBoostSuccess(false), 3000);
    
    // Trigger multiple confetti bursts for dramatic effect
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      colors: ['#FFD700', '#FFA500', '#FF8C00', '#FFE55C', '#FFFF00']
    };

    function fire(particleRatio: number, opts: any) {
      confetti(Object.assign({}, defaults, opts, {
        particleCount: Math.floor(count * particleRatio)
      }));
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  const handleBoostError = (error: string) => {
    console.error('Boost failed:', error);
  };

  // Get Lightning payment recipients from RSS value data
  const getPaymentRecipients = (): Array<{ address: string; split: number; name?: string; fee?: boolean }> | null => {
    console.log('🔍 Checking album for podcast:value data:', album.title, { 
      hasAlbumValue: !!album.value,
      albumValueType: album.value?.type,
      albumValueMethod: album.value?.method,
      albumRecipients: album.value?.recipients?.length || 0,
      trackCount: album.tracks?.length || 0,
      firstTrackHasValue: !!(album.tracks?.[0]?.value)
    });
    
    // First, check if album has podcast:value Lightning recipients
    if (album.value && album.value.type === 'lightning' && album.value.method === 'keysend') {
      const recipients = album.value.recipients
        .filter(r => r.type === 'node') // Only include node recipients
        .map(r => ({
          address: r.address,
          split: r.split,
          name: r.name,
          fee: r.fee
        }));
      
      console.log('✅ Found album-level podcast:value recipients:', recipients);
      return recipients;
    }
    
    // If no album-level value, check first track for podcast:value data
    const firstTrack = album.tracks?.[0];
    if (firstTrack?.value && firstTrack.value.type === 'lightning' && firstTrack.value.method === 'keysend') {
      const recipients = firstTrack.value.recipients
        .filter(r => r.type === 'node') // Only include node recipients
        .map(r => ({
          address: r.address,
          split: r.split,
          name: r.name,
          fee: r.fee
        }));
      
      console.log('✅ Found track-level podcast:value recipients from first track:', recipients);
      return recipients;
    }
    
    console.log('❌ No podcast:value data found (checked album and first track), using fallback');
    return null; // Will use fallback single recipient
  };
  
  // Get fallback recipient for backwards compatibility
  const getFallbackRecipient = (): { address: string; amount: number } => {
    return {
      address: '03740ea02585ed87b83b2f76317a4562b616bd7b8ec3f925be6596932b2003fc9e',
      amount: 50
    };
  };

  const getAlbumUrl = (album: Album) => {
    // Create URL-friendly slug from album title
    // Handle special characters and punctuation more carefully
    const slug = album.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')       // Remove punctuation except spaces and hyphens
      .replace(/\s+/g, '-')           // Replace spaces with dashes
      .replace(/-+/g, '-')            // Replace multiple consecutive dashes with single dash
      .replace(/^-+|-+$/g, '');       // Remove leading/trailing dashes
    return `/album/${encodeURIComponent(slug)}`;
  };
  
  const albumUrl = getAlbumUrl(album);
  
  // Only log in development mode to improve production performance
  // Log only once when component mounts (not on every render)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
      if (isMobile) {
        console.log(`Mobile album card for "${album.title}": coverArt=${album.coverArt}`);
      }
      console.log(`🎵 Album card mounted: "${album.title}" -> URL: ${albumUrl}`);
    }
  }, []); // Empty dependency array = only run once on mount

  return (
    <div className={`group relative bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] active:scale-[0.98] block ${className}`}>
      
      <Link 
        href={albumUrl}
        onClick={(e) => {
          console.log(`🔗 Navigating to album: "${album.title}" -> ${albumUrl}`);
        }}
        aria-label={`View album details for ${album.title} by ${album.artist}`}
        className="block"
      >
      {/* Album Artwork */}
      <div 
        className="relative aspect-square overflow-hidden"
        onTouchStart={(e) => {
          // Only handle touch events on the artwork area, not on the play button
          if (!(e.target as HTMLElement).closest('button')) {
            onTouchStart(e);
          }
        }}
        onTouchMove={(e) => {
          if (!(e.target as HTMLElement).closest('button')) {
            onTouchMove(e);
          }
        }}
        onTouchEnd={(e) => {
          if (!(e.target as HTMLElement).closest('button')) {
            onTouchEnd(e);
          }
        }}
        onClick={(e) => {
          // Prevent navigation when clicking on the artwork area (play button handles its own clicks)
          if (!(e.target as HTMLElement).closest('button')) {
            // Let the Link handle the navigation
            console.log('🎵 Album artwork clicked - navigating to album page');
          }
        }}
      >
        <Image
          src={album.coverArt}
          alt={`${album.title} by ${album.artist}`}
          fill
          className={`object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          priority={false}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
        />
        
        {/* Loading placeholder */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
            <Music className="w-8 h-8 text-gray-400 animate-pulse" />
          </div>
        )}
        
        {/* Error placeholder */}
        {imageError && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
            <Music className="w-8 h-8 text-gray-400" />
          </div>
        )}

        {/* Play/Pause Overlay - Always visible on mobile, hover-based on desktop */}
        <div className="absolute inset-0 bg-black/20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              // Only trigger play if not scrolling
              const scrolling = document.body.classList.contains('is-scrolling');
              if (!scrolling) {
                onPlay(album, e);
              }
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              // Mark that we're interacting with button
              (e.currentTarget as HTMLElement).dataset.touched = 'true';
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              const button = e.currentTarget as HTMLElement;
              if (button.dataset.touched === 'true') {
                delete button.dataset.touched;
                // Small delay to ensure it's a deliberate tap, not accidental during scroll
                setTimeout(() => {
                  const scrolling = document.body.classList.contains('is-scrolling');
                  if (!scrolling) {
                    onPlay(album, e);
                  }
                }, 150);
              }
            }}
            className="w-16 h-16 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 active:bg-white/40 transition-colors duration-200 touch-manipulation pointer-events-auto"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-1" />
            )}
          </button>
        </div>

        {/* Lightning tip button - moved to top left */}
        <div className="absolute top-1 left-1 sm:top-2 sm:left-2 flex items-center gap-1 sm:gap-2">
          <button
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              // Force connection check before showing modal
              await checkConnection();
              setShowBoostModal(true);
            }}
            className="w-6 h-6 sm:w-7 sm:h-7 bg-yellow-500/90 hover:bg-yellow-600/90 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors z-10"
            aria-label={`Boost ${album.artist}`}
          >
            <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-black" />
          </button>
          
        </div>
        
        {/* Track count badge - kept on the right */}
        {album.tracks.length > 0 && (
          <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-black/50 backdrop-blur-sm rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs text-white">
            {album.tracks.length} {album.tracks.length !== 1 ? 'tracks' : 'track'}
          </div>
        )}
      </div>

      {/* Album Info */}
      <div className="p-2 sm:p-3 bg-black/70 backdrop-blur-sm">
        <h3 className="font-semibold text-white text-xs sm:text-sm leading-tight line-clamp-2 group-hover:text-blue-300 transition-colors duration-200">
          {album.title}
        </h3>
        <p className="text-gray-300 text-[10px] sm:text-xs mt-0.5 sm:mt-1 line-clamp-1">
          {album.artist}
        </p>
        
        {/* Release date and publisher indicator */}
        <div className="flex items-center justify-between mt-0.5 sm:mt-1">
          {album.releaseDate && (
            <p className="text-gray-400 text-[10px] sm:text-xs">
              {new Date(album.releaseDate).getFullYear()}
            </p>
          )}
        </div>
      </div>

      {/* Mobile touch feedback */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-white/5 opacity-0 group-active:opacity-100 transition-opacity duration-150" />
      </div>
      </Link>
      
      {/* Boost Modal */}
      {showBoostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Boost Artist
                </h3>
                <button
                  onClick={() => setShowBoostModal(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-3 rounded-lg overflow-hidden">
                  <Image
                    src={album.coverArt}
                    alt={album.title}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-white font-semibold">{album.title}</p>
                <p className="text-gray-400 text-sm">{album.artist}</p>
              </div>
              
              <BitcoinConnectPayment
                amount={100}
                description={`Boost for ${album.title} by ${album.artist}`}
                onSuccess={handleBoostSuccess}
                onError={handleBoostError}
                className="w-full"
                recipients={getPaymentRecipients() || undefined}
                recipient={getFallbackRecipient().address}
                enableBoosts={true}
                boostMetadata={{
                  title: album.title,
                  artist: album.artist,
                  album: album.title,
                  url: album.link,
                  appName: 'ITDV Lightning',
                  podcastFeedGuid: album.podcastGuid || album.feedId || `album-${encodeURIComponent(album.title.toLowerCase().replace(/\s+/g, '-'))}`,
                  itemGuid: `album-item-${encodeURIComponent(album.title.toLowerCase().replace(/\s+/g, '-'))}`,
                  feedUrl: album.feedUrl
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap with React.memo to prevent unnecessary re-renders
export default memo(AlbumCard);