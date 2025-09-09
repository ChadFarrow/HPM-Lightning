'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { useAudio } from '@/contexts/AudioContext';
import { BitcoinConnectPayment } from '@/components/BitcoinConnect';
import type { RSSValue } from '@/lib/rss-parser';
import dynamic from 'next/dynamic';
import { filterPodrollItems } from '@/lib/podroll-utils';
import confetti from 'canvas-confetti';

// Dynamic import for ControlsBar
const ControlsBar = dynamic(() => import('@/components/ControlsBar'), {
  loading: () => (
    <div className="mb-8 p-4 bg-gray-800/20 rounded-lg animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-8 bg-gray-700/50 rounded w-24"></div>
        <div className="h-8 bg-gray-700/50 rounded w-20"></div>
        <div className="h-8 bg-gray-700/50 rounded w-16"></div>
        <div className="h-8 bg-gray-700/50 rounded w-20"></div>
      </div>
    </div>
  ),
  ssr: true
});

interface Track {
  title: string;
  duration: string;
  url: string;
  trackNumber: number;
  image?: string;
  value?: RSSValue; // Track-level podcast:value data
  paymentRecipients?: Array<{ address: string; split: number; name?: string; fee?: boolean }>; // Pre-processed track payment recipients
}

interface RSSFunding {
  url: string;
  message?: string;
}

interface RSSPodRoll {
  url: string;
  title?: string;
  description?: string;
}

interface PodrollAlbum {
  title: string;
  artist: string;
  coverArt: string;
  url: string;
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
  funding?: RSSFunding[];
  podroll?: RSSPodRoll[];
  value?: RSSValue;
  publisher?: {
    feedGuid: string;
    feedUrl: string;
    medium: string;
  };
  paymentRecipients?: Array<{ address: string; split: number; name?: string; fee?: boolean }>;
}

interface AlbumDetailClientProps {
  albumTitle: string;
  initialAlbum: Album | null;
}

export default function AlbumDetailClient({ albumTitle, initialAlbum }: AlbumDetailClientProps) {
  const [album, setAlbum] = useState<Album | null>(initialAlbum);
  const [isLoading, setIsLoading] = useState(!initialAlbum);
  const [error, setError] = useState<string | null>(null);
  const [relatedAlbums, setRelatedAlbums] = useState<Album[]>([]);
  const [podrollAlbums, setPodrollAlbums] = useState<PodrollAlbum[]>([]);
  const [siteAlbums, setSiteAlbums] = useState<Album[]>([]);
  
  // Global audio context
  const { 
    playAlbum: globalPlayAlbum, 
    currentTrack,
    isPlaying: globalIsPlaying,
    pause: globalPause,
    resume: globalResume,
    toggleShuffle
  } = useAudio();

  // Lightning payment handlers
  const handleBoostSuccess = (response: any) => {
    console.log('✅ Boost successful:', response);
    
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
    console.error('❌ Boost failed:', error);
  };

  // Get Lightning payment recipients from pre-processed server-side data
  const getPaymentRecipients = (): Array<{ address: string; split: number; name?: string; fee?: boolean }> | null => {
    if (!album) return null;
    
    console.log('🔍 Checking album for payment recipients:', album.title, { 
      hasPaymentRecipients: !!album.paymentRecipients,
      recipientCount: album.paymentRecipients?.length || 0
    });
    
    // Use pre-processed payment recipients from server-side parsing
    if (album.paymentRecipients && album.paymentRecipients.length > 0) {
      console.log('✅ Found pre-processed payment recipients:', album.paymentRecipients);
      return album.paymentRecipients;
    }
    
    console.log('❌ No payment recipients found, using fallback');
    return null; // Will use fallback single recipient
  };

  // Get Lightning payment recipients for a specific track
  const getTrackPaymentRecipients = (track: Track): Array<{ address: string; split: number; name?: string; fee?: boolean }> | null => {
    if (!track) return null;
    
    // Use pre-processed track payment recipients from server-side parsing
    if (track.paymentRecipients && track.paymentRecipients.length > 0) {
      return track.paymentRecipients;
    }
    
    // Fallback to album-level payment recipients if track doesn't have its own
    return getPaymentRecipients();
  };
  
  // Get fallback recipient for backwards compatibility
  const getFallbackRecipient = (): { address: string; amount: number } => {
    return {
      address: '03740ea02585ed87b83b2f76317a4562b616bd7b8ec3f925be6596932b2003fc9e',
      amount: 50
    };
  };
  
  // Background state
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const preloadAttemptedRef = useRef(false);

  useEffect(() => {
    setIsClient(true);
    
    const checkDevice = () => {
      setIsDesktop(window.innerWidth > 768);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);


  // Load album data if not provided
  useEffect(() => {
    if (!initialAlbum) {
      loadAlbum();
    } else {
      // Preload background image for desktop
      if (isDesktop && !preloadAttemptedRef.current) {
        preloadAttemptedRef.current = true;
        preloadBackgroundImage(initialAlbum);
      }
      loadRelatedAlbums();
      // Load site albums first, then load podroll albums
      loadSiteAlbums().then(() => {
        loadPodrollAlbums();
      });
    }
  }, [albumTitle, initialAlbum, isDesktop]);

  const preloadBackgroundImage = async (albumData: Album) => {
    if (!albumData.coverArt) return;
    
    try {
      console.log('🎨 Preloading background image for desktop:', albumData.coverArt);
      
      const img = new window.Image();
      img.onload = () => {
        console.log('✅ Background image preloaded successfully');
        setBackgroundImage(albumData.coverArt);
        setBackgroundLoaded(true);
      };
      img.onerror = () => {
        console.error('❌ Background image preload failed');
        setBackgroundImage(null);
        setBackgroundLoaded(true);
      };
      
      img.decoding = 'async';
      img.src = albumData.coverArt;
    } catch (error) {
      console.error('❌ Error preloading background image:', error);
      setBackgroundImage(null);
      setBackgroundLoaded(true);
    }
  };

  const loadAlbum = async () => {
    try {
      setIsLoading(true);
      // Use the static cached data which now includes complete podcast:value data
      const response = await fetch('/api/albums-static');
      
      if (!response.ok) {
        throw new Error('Failed to load albums');
      }

      const data = await response.json();
      const albums = data.albums || [];
      
      // Find the album by title matching (same logic as the individual endpoint)
      const createSlug = (title: string) => 
        title.toLowerCase()
          .replace(/[^\w\s-]/g, '')       // Remove punctuation except spaces and hyphens
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '');
      
      // Try different matching strategies
      const foundAlbum = albums.find((album: Album) => {
        const albumDataTitle = album.title;
        const titleMatch = albumDataTitle.toLowerCase() === albumTitle.toLowerCase();
        const slugMatch = createSlug(albumDataTitle) === albumTitle.toLowerCase();
        const compatMatch = albumDataTitle.toLowerCase().replace(/\s+/g, '-') === albumTitle.toLowerCase();
        
        // Flexible matching: check if the album title starts with the decoded ID
        const baseTitle = albumDataTitle.toLowerCase().split(/\s*[-–]\s*/)[0];
        const baseTitleSlug = createSlug(baseTitle);
        const flexibleMatch = baseTitleSlug === albumTitle.toLowerCase();
        
        return titleMatch || slugMatch || compatMatch || flexibleMatch;
      });

      if (foundAlbum) {
        setAlbum(foundAlbum);
        setError(null);
        
        if (isDesktop && !preloadAttemptedRef.current) {
          preloadAttemptedRef.current = true;
          preloadBackgroundImage(foundAlbum);
        }
        
        loadRelatedAlbums();
        // We already have the albums data, so set it and load podroll
        setSiteAlbums(albums);
        loadPodrollAlbums();
      } else {
        setError('Album not found');
      }
    } catch (err) {
      console.error('Error loading album:', err);
      setError('Failed to load album');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSiteAlbums = async () => {
    try {
      const response = await fetch('/api/albums-static');
      if (response.ok) {
        const data = await response.json();
        const albums = data.albums || [];
        setSiteAlbums(albums);
        return albums;
      }
    } catch (error) {
      console.error('Error loading site albums:', error);
    }
    return [];
  };

  const loadRelatedAlbums = async () => {
    try {
      // Try fast static endpoint first
      let response = await fetch('/api/albums-static');
      
      if (!response.ok) {
        response = await fetch('/api/albums');
      }
      if (response.ok) {
        const data = await response.json();
        const albums = data.albums || [];
        
        // Don't show random albums - only show podroll connections
        setRelatedAlbums([]); // No random albums
      }
    } catch (error) {
      console.error('Error loading related albums:', error);
    }
  };

  const loadPodrollAlbums = async () => {
    if (!album?.podroll || album.podroll.length === 0) return;
    
    try {
      // First, get all albums from the site to check for matches
      let albums: Album[] = siteAlbums;
      if (albums.length === 0) {
        try {
          const response = await fetch('/api/albums-static');
          if (response.ok) {
            const data = await response.json();
            albums = data.albums || [];
            setSiteAlbums(albums);
          }
        } catch (error) {
          console.error('Error loading site albums for podroll matching:', error);
        }
      }
      
      const podrollData: PodrollAlbum[] = [];
      
      // Filter out non-music podcast feeds from podrolls
      const filteredPodroll = filterPodrollItems(album.podroll);
      
      // Process each podroll item
      for (const podrollItem of filteredPodroll) {
        // Check if this podroll URL matches any album on the site
        const matchingAlbum = albums.find(siteAlbum => 
          siteAlbum.feedUrl === podrollItem.url
        );
        
        if (matchingAlbum) {
          // Use the site album data
          podrollData.push({
            title: matchingAlbum.title,
            artist: matchingAlbum.artist,
            coverArt: matchingAlbum.coverArt,
            url: podrollItem.url
          });
        } else {
          // Try to fetch external feed data
          try {
            const response = await fetch(`/api/test-single-feed?url=${encodeURIComponent(podrollItem.url)}`);
            if (response.ok) {
              const data = await response.json();
              if (data.album) {
                podrollData.push({
                  title: data.album.title || podrollItem.title || 'Unknown Album',
                  artist: data.album.artist || 'Unknown Artist',
                  coverArt: data.album.coverArt || '/placeholder-episode.jpg',
                  url: podrollItem.url
                });
              }
            }
          } catch (error) {
            console.error(`Error fetching podroll album for ${podrollItem.url}:`, error);
            // Fallback to basic podroll data
            podrollData.push({
              title: podrollItem.title || 'Unknown Album',
              artist: 'Unknown Artist',
              coverArt: '/placeholder-episode.jpg',
              url: podrollItem.url
            });
          }
        }
      }
      
      setPodrollAlbums(podrollData);
    } catch (error) {
      console.error('Error loading podroll albums:', error);
    }
  };

  const handlePlayAlbum = () => {
    if (!album) return;
    
    const audioTracks = album.tracks.map(track => ({
      ...track,
      artist: album.artist,
      album: album.title,
      image: track.image || album.coverArt
    }));
    
    // Debug: Check if tracks have value data
    console.log('🔍 Audio tracks being passed to globalPlayAlbum:', audioTracks.map(t => ({
      title: t.title,
      hasValue: !!t.value,
      valueType: t.value?.type
    })));
    
    globalPlayAlbum(audioTracks, 0, album.title);
  };

  const handlePlayTrack = (track: Track, index: number) => {
    if (!album) return;
    
    const audioTracks = album.tracks.map(t => ({
      ...t,
      artist: album.artist,
      album: album.title,
      image: t.image || album.coverArt
    }));
    
    // Debug: Check if tracks have value data
    console.log('🔍 Audio tracks being passed to globalPlayAlbum (single track):', audioTracks.map(t => ({
      title: t.title,
      hasValue: !!t.value,
      valueType: t.value?.type
    })));
    
    globalPlayAlbum(audioTracks, index, album.title);
  };


  const isTrackPlaying = (track: Track) => {
    return currentTrack?.url === track.url && globalIsPlaying;
  };

  const formatDuration = (duration: string): string => {
    if (!duration) return '0:00';
    if (duration.includes(':')) return duration;
    
    const seconds = parseInt(duration);
    if (!isNaN(seconds)) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return duration;
  };

  const getReleaseYear = () => {
    if (!album) return '';
    try {
      return new Date(album.releaseDate).getFullYear();
    } catch {
      return '';
    }
  };

  const getAlbumSlug = (albumData: Album) => {
    return albumData.title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const getPublisherSlug = (publisherName: string) => {
    return publisherName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Combine and deduplicate related albums
  const getCombinedRelatedAlbums = () => {
    const combined: Array<Album | PodrollAlbum> = [];
    const seen = new Set<string>();
    
    // Add site albums first (they have priority)
    relatedAlbums.forEach(album => {
      const key = `${album.title.toLowerCase()}|${album.artist.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(album);
      }
    });
    
    // Add podroll albums that aren't duplicates
    podrollAlbums.forEach(podrollAlbum => {
      const key = `${podrollAlbum.title.toLowerCase()}|${podrollAlbum.artist.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(podrollAlbum);
      }
    });
    
    return combined.slice(0, 8); // Limit to 8 total albums
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error || (!album && !isLoading)) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <h1 className="text-2xl font-semibold mb-4">{error || 'Album not found'}</h1>
        <Link 
          href="/"
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          ← Back to albums
        </Link>
      </div>
    );
  }

  // TypeScript guard: album is guaranteed to be non-null here or we're loading
  if (!album) {
    // Still loading, show spinner
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Dynamic Background with Bloodshot Lies fallback */}
      <div className="fixed inset-0 z-0">
        {/* Primary album background */}
        {backgroundImage && backgroundLoaded ? (
          <Image
            src={backgroundImage}
            alt={`${album.title} background`}
            fill
            className="object-cover w-full h-full"
            priority
          />
        ) : (
          /* Fallback to default background */
          <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black"></div>
        )}
        
        {/* Dynamic overlay based on album */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-black/90 to-gray-900/95"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
                  title="Back to albums"
                >
                  <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </Link>
                
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                    Into the Doerfel-Verse
                  </Link>
                  <span className="text-gray-600">/</span>
                  <span className="font-medium truncate max-w-[200px]">{album.title}</span>
                </div>
              </div>

              {/* Desktop Version Info */}
              <div className="hidden sm:block text-xs text-gray-400">
                {album.tracks.length} tracks • {getReleaseYear()}
              </div>
            </div>
          </div>
        </header>

        {/* Album Hero Section */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Album Artwork */}
              <div className="flex-shrink-0 mx-auto lg:mx-0">
                <div className="w-64 h-64 lg:w-80 lg:h-80 relative rounded-xl shadow-2xl overflow-hidden border border-white/20 group cursor-pointer">
                  <Image
                    src={album.coverArt}
                    alt={album.title}
                    fill
                    className="object-cover"
                    priority
                    sizes="(min-width: 1024px) 320px, 256px"
                  />
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={handlePlayAlbum}
                      className="p-4 lg:p-6 bg-white/20 backdrop-blur-sm border border-white/40 text-white rounded-full hover:scale-110 hover:bg-white/30 transition-all shadow-2xl"
                      title={`Play ${album.title}`}
                    >
                      <svg className="w-8 h-8 lg:w-12 lg:h-12 ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Album Info */}
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-6">
                  <h1 className="text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {album.title}
                  </h1>
                  <p className="text-xl lg:text-2xl text-gray-300 mb-2">{album.artist}</p>
                  
                  {/* Publisher Link */}
                  {album.publisher && (
                    <div className="mb-4">
                      <Link
                        href={`/publisher/${getPublisherSlug(album.artist)}`}
                        className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        title={`View all albums by ${album.artist}`}
                      >
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                        View all albums by {album.artist}
                      </Link>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-center lg:justify-start gap-4 text-sm text-gray-400 mb-6">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      {getReleaseYear()}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      {album.tracks.length} tracks
                    </span>
                  </div>

                  {album.description && (
                    <div className="max-w-2xl mx-auto lg:mx-0 mb-6">
                      <p className="text-gray-300 leading-relaxed">{album.description}</p>
                    </div>
                  )}

                </div>

                {/* Play Controls */}
                <div className="flex items-center justify-center lg:justify-start gap-4 mb-8">
                  <button
                    onClick={handlePlayAlbum}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Play className="w-5 h-5" />
                    <span className="font-semibold">Play Album</span>
                  </button>
                  
                  <button
                    onClick={() => toggleShuffle()}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm border border-white/20"
                    title="Shuffle"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.83 13.41L13.42 14.82L16.55 17.95L14.5 20H20V14.5L17.96 16.54L14.83 13.41M14.5 4L16.54 6.04L4 18.59L5.41 20L17.96 7.46L20 9.5V4M10.59 9.17L5.41 4L4 5.41L9.17 10.58L10.59 9.17Z"/>
                    </svg>
                  </button>
                  
                  {/* Lightning Payment Button */}
                  <BitcoinConnectPayment
                    amount={50}
                    description={`⚡ 50 sats boost from ITDV Lightning`}
                    onSuccess={handleBoostSuccess}
                    onError={handleBoostError}
                    recipients={getPaymentRecipients() || undefined}
                    recipient={getFallbackRecipient().address}
                    boostMetadata={{
                      title: album.title,
                      artist: album.artist,
                      album: album.title,
                      url: `https://doerfelverse.com/album/${encodeURIComponent(albumTitle)}`,
                      appName: 'ITDV Lightning'
                    }}
                  />
                </div>

                {/* Funding Information - Support This Artist */}
                {album.funding && album.funding.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-3 text-white text-center lg:text-left">Support This Artist</h3>
                    <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                      {album.funding.map((funding, index) => (
                        <a
                          key={index}
                          href={funding.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-all transform hover:scale-105 flex items-center gap-2"
                        >
                          💝 {funding.message || 'Support'}
                        </a>
                      ))}
                    </div>
                  </div>
                )}


              </div>
            </div>
          </div>
        </div>

        {/* Track List */}
        <div className="container mx-auto px-4 pb-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold">Tracks</h2>
              </div>
              
              <div className="divide-y divide-white/5">
                {album.tracks.map((track, index) => {
                  const isCurrentTrack = currentTrack?.url === track.url;
                  const isCurrentlyPlaying = isTrackPlaying(track);
                  
                  return (
                    <div
                      key={track.trackNumber}
                      className={`flex items-center gap-4 p-4 hover:bg-white/5 transition-colors cursor-pointer group ${
                        isCurrentTrack ? 'bg-white/10' : ''
                      }`}
                      onClick={() => handlePlayTrack(track, index)}
                    >
                      {/* Track Number / Play Icon */}
                      <div className="w-8 flex items-center justify-center">
                        {isCurrentlyPlaying ? (
                          <div className="w-4 h-4 flex items-center justify-center">
                            <div className="w-1 h-3 bg-blue-400 animate-pulse mr-0.5"></div>
                            <div className="w-1 h-2 bg-blue-400 animate-pulse delay-75 mr-0.5"></div>
                            <div className="w-1 h-4 bg-blue-400 animate-pulse delay-150"></div>
                          </div>
                        ) : (
                          <span className={`text-sm font-medium ${isCurrentTrack ? 'text-blue-400' : 'text-gray-400 group-hover:text-white'}`}>
                            {track.trackNumber}
                          </span>
                        )}
                      </div>

                      {/* Track Artwork */}
                      <div className="w-12 h-12 relative flex-shrink-0 rounded overflow-hidden">
                        <Image
                          src={track.image || album.coverArt}
                          alt={track.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-4 h-4 text-white" />
                        </div>
                      </div>

                      {/* Track Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium truncate ${
                          isCurrentTrack ? 'text-blue-400' : 'text-white'
                        }`}>
                          {track.title}
                        </h3>
                        <p className="text-sm text-gray-400 truncate">{album.artist}</p>
                      </div>

                      {/* Duration */}
                      <div className="text-sm text-gray-400 font-mono">
                        {formatDuration(track.duration)}
                      </div>

                      {/* Track Lightning Boost Button */}
                      <div 
                        className="flex items-center justify-center ml-2"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent track play when clicking boost
                        }}
                      >
                        <BitcoinConnectPayment
                          amount={50}
                          description={`⚡ 50 sats boost from ITDV Lightning`}
                          onSuccess={handleBoostSuccess}
                          onError={handleBoostError}
                          recipients={getTrackPaymentRecipients(track) || undefined}
                          recipient={getFallbackRecipient().address}
                          className="scale-75"
                          boostMetadata={{
                            title: track.title,
                            artist: album.artist,
                            album: album.title,
                            episode: track.title,
                            url: `https://doerfelverse.com/album/${encodeURIComponent(albumTitle)}`,
                            appName: 'ITDV Lightning'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Related Albums - Only Podroll Connections */}
        {(() => {
          const combinedAlbums = getCombinedRelatedAlbums();
          return combinedAlbums.length > 0 && (
            <div className="container mx-auto px-4 pb-8">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-6">Related Shows</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {combinedAlbums.map((relatedItem, index) => {
                    // Check if this is a site album (has tracks) or podroll album (has url)
                    const isSiteAlbum = 'tracks' in relatedItem;
                    
                    if (isSiteAlbum) {
                      // Site album - use Link for internal navigation
                      return (
                        <Link
                          key={`site-${index}`}
                          href={`/album/${getAlbumSlug(relatedItem as Album)}`}
                          className="group block"
                        >
                          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 hover:bg-white/10 transition-colors border border-white/10">
                            <div className="aspect-square mb-3 rounded overflow-hidden">
                              <Image
                                src={relatedItem.coverArt}
                                alt={relatedItem.title}
                                width={200}
                                height={200}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <h3 className="font-semibold text-sm mb-1 truncate group-hover:text-blue-400 transition-colors">
                              {relatedItem.title}
                            </h3>
                            <p className="text-xs text-gray-400 truncate">{relatedItem.artist}</p>
                          </div>
                        </Link>
                      );
                    } else {
                      // Podroll album - check if it exists on the site
                      const podrollItem = relatedItem as PodrollAlbum;
                      const matchingSiteAlbum = siteAlbums.find(siteAlbum => 
                        siteAlbum.feedUrl === podrollItem.url
                      );
                      
                      if (matchingSiteAlbum) {
                        // Found on site - use internal link
                        return (
                          <Link
                            key={`internal-${index}`}
                            href={`/album/${getAlbumSlug(matchingSiteAlbum)}`}
                            className="group block"
                          >
                            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 hover:bg-white/10 transition-colors border border-white/10">
                              <div className="aspect-square mb-3 rounded overflow-hidden">
                                <Image
                                  src={podrollItem.coverArt}
                                  alt={podrollItem.title}
                                  width={200}
                                  height={200}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              </div>
                              <h3 className="font-semibold text-sm mb-1 truncate group-hover:text-blue-400 transition-colors">
                                {podrollItem.title}
                              </h3>
                              <p className="text-xs text-gray-400 truncate">{podrollItem.artist}</p>
                            </div>
                          </Link>
                        );
                      } else {
                        // External podcast - use RSS feed link
                        return (
                          <a
                            key={`external-${index}`}
                            href={podrollItem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block"
                          >
                            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 hover:bg-white/10 transition-colors border border-white/10 relative">
                              {/* External link indicator */}
                              <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500/80 rounded-full flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </div>
                              <div className="aspect-square mb-3 rounded overflow-hidden">
                                <Image
                                  src={podrollItem.coverArt}
                                  alt={podrollItem.title}
                                  width={200}
                                  height={200}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              </div>
                              <h3 className="font-semibold text-sm mb-1 truncate group-hover:text-blue-400 transition-colors">
                                {podrollItem.title}
                              </h3>
                              <p className="text-xs text-gray-400 truncate">{podrollItem.artist}</p>
                            </div>
                          </a>
                        );
                      }
                    }
                  })}
                </div>
              </div>
            </div>
          );
        })()}


        {/* Bottom spacing for audio player */}
        <div className="h-24" />
      </div>
    </div>
  );
}