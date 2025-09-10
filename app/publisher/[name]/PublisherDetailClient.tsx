'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { useAudio } from '@/contexts/AudioContext';
import { BitcoinConnectPayment } from '@/components/BitcoinConnect';
import type { RSSValue } from '@/lib/rss-parser';

interface Track {
  title: string;
  duration: string;
  url: string;
  trackNumber: number;
  image?: string;
  itemGuid?: string;
  value?: RSSValue;
  paymentRecipients?: Array<{ address: string; split: number; name?: string; fee?: boolean }>;
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
  funding?: any[];
  podroll?: any[];
  publisher?: {
    feedGuid: string;
    feedUrl: string;
    medium: string;
  };
  podcastGuid?: string;
  value?: RSSValue;
  paymentRecipients?: Array<{ address: string; split: number; name?: string; fee?: boolean }>;
}

interface Publisher {
  name: string;
  guid: string;
  feedUrl: string;
  medium: string;
  albums: Album[];
}

interface PublisherDetailClientProps {
  publisherName: string;
  initialPublisher: Publisher | null;
}

export default function PublisherDetailClient({ publisherName, initialPublisher }: PublisherDetailClientProps) {
  const [publisher, setPublisher] = useState<Publisher | null>(initialPublisher);
  const [publisherArtwork, setPublisherArtwork] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!initialPublisher);
  const [error, setError] = useState<string | null>(null);
  const [expandedAlbums, setExpandedAlbums] = useState<Set<string>>(new Set());
  const { playAlbum, playTrack, currentTrack } = useAudio();

  useEffect(() => {
    if (!initialPublisher) {
      loadPublisher();
    }
    loadPublisherArtwork();
  }, [publisherName, initialPublisher]);

  const loadPublisherArtwork = async () => {
    try {
      const response = await fetch('/publishers.json');
      if (response.ok) {
        const publishers = await response.json();
        const decodedName = decodeURIComponent(publisherName);
        const currentPublisher = publishers.find((pub: any) => 
          pub.name.toLowerCase() === decodedName.toLowerCase() ||
          pub.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') === 
          decodedName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '')
        );
        
        if (currentPublisher?.latestAlbum?.coverArt) {
          setPublisherArtwork(currentPublisher.latestAlbum.coverArt);
        }
      }
    } catch (error) {
      console.warn('Could not load artist artwork:', error);
    }
  };

  const loadPublisher = async () => {
    try {
      setIsLoading(true);
      // Only use static data - no live RSS parsing fallback
      const response = await fetch('/api/albums-static');
      
      if (!response.ok) {
        throw new Error('Failed to load albums');
      }

      const data = await response.json();
      const albums = data.albums || [];
      
      // Create slug for matching
      const createSlug = (name: string) => 
        name.toLowerCase()
          .replace(/[^\w\s-]/g, '') // Remove punctuation except spaces and hyphens
          .replace(/\s+/g, '-')     // Replace spaces with hyphens
          .replace(/-+/g, '-')      // Collapse multiple hyphens
          .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
      
      const decodedName = decodeURIComponent(publisherName);
      const nameSlug = createSlug(decodedName);
      
      // Find albums by this publisher
      const publisherAlbums = albums.filter((album: Album) => {
        // Match by artist name (since publishers are usually artists)
        const artistSlug = createSlug(album.artist);
        const artistLower = album.artist.toLowerCase();
        const decodedLower = decodedName.toLowerCase();
        
        // Exact match or slug match, but exclude if this artist is just featured
        if (artistSlug === nameSlug || artistLower === decodedLower) {
          return true;
        }
        
        // Don't include albums where this artist is just featured (contains "feat." or "featuring")
        return false;
      });

      if (publisherAlbums.length > 0) {
        const firstAlbum = publisherAlbums[0];
        // Find an album with publisher data, or use defaults
        const albumWithPublisher = publisherAlbums.find((album: Album) => album.publisher) || firstAlbum;
        const publisherInfo: Publisher = {
          name: firstAlbum.artist,
          guid: albumWithPublisher.publisher?.feedGuid || 'no-guid',
          feedUrl: albumWithPublisher.publisher?.feedUrl || '',
          medium: albumWithPublisher.publisher?.medium || 'music',
          albums: publisherAlbums
        };
        
        setPublisher(publisherInfo);
        setError(null);
      } else {
        setError('Artist not found');
      }
    } catch (err) {
      console.error('Error loading artist:', err);
      setError('Failed to load artist');
    } finally {
      setIsLoading(false);
    }
  };

  const getAlbumSlug = (album: Album) => {
    return album.title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const getReleaseYear = (releaseDate: string) => {
    try {
      return new Date(releaseDate).getFullYear();
    } catch {
      return '';
    }
  };

  const handlePlayAlbum = (album: Album, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking play button
    e.stopPropagation();
    
    // Map album tracks to the expected format
    const tracks = album.tracks.map(track => ({
      ...track,
      artist: album.artist,
      album: album.title,
      image: track.image || album.coverArt
    }));
    
    playAlbum(tracks, 0, album.title);
  };

  // Get aggregated payment recipients from all albums
  const getPublisherPaymentRecipients = () => {
    // Find the first album with payment recipients
    const albumWithRecipients = publisher?.albums.find(album => 
      album.paymentRecipients && album.paymentRecipients.length > 0
    );
    
    if (albumWithRecipients?.paymentRecipients) {
      return albumWithRecipients.paymentRecipients;
    }
    
    // Fallback: If no payment recipients found, return empty array
    // BitcoinConnectPayment will handle the fallback
    return [];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error || !publisher) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <h1 className="text-2xl font-semibold mb-4">{error || 'Artist not found'}</h1>
        <Link 
          href="/"
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          ← Back to albums
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        {/* Use artist artwork as background */}
        {(publisherArtwork || publisher.albums[0]?.coverArt) && (
          <Image
            src={publisherArtwork || publisher.albums[0].coverArt}
            alt={`${publisher.name} background`}
            fill
            className="object-cover w-full h-full"
            priority
          />
        )}
        
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
                  <span className="font-medium truncate max-w-[200px]">{publisher.name}</span>
                </div>
              </div>

              {/* Desktop Info */}
              <div className="hidden sm:block text-xs text-gray-400">
                {publisher.albums.length} albums
              </div>
            </div>
          </div>
        </header>

        {/* Artist Hero Section */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Artist Artwork */}
              <div className="flex-shrink-0 mx-auto lg:mx-0">
                <div className="w-64 h-64 lg:w-80 lg:h-80 relative rounded-xl shadow-2xl overflow-hidden border border-white/20">
                  <Image
                    src={publisherArtwork || publisher.albums[0]?.coverArt || '/placeholder-episode.jpg'}
                    alt={publisher.name}
                    fill
                    className="object-cover"
                    priority
                    sizes="(min-width: 1024px) 320px, 256px"
                  />
                </div>
              </div>

              {/* Artist Info */}
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-6">
                  <h1 className="text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {publisher.name}
                  </h1>
                  <p className="text-xl lg:text-2xl text-gray-300 mb-4">Artist</p>
                  
                  <div className="flex items-center justify-center lg:justify-start gap-4 text-sm text-gray-400 mb-6">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      {publisher.albums.length} albums
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w2 h-2 bg-green-400 rounded-full"></span>
                      {publisher.medium}
                    </span>
                  </div>

                  <div className="max-w-2xl mx-auto lg:mx-0 mb-6">
                    <p className="text-gray-300 leading-relaxed">
                      All albums by {publisher.name}
                    </p>
                  </div>

                  {/* Boost Button */}
                  {publisher.albums.some(album => album.paymentRecipients && album.paymentRecipients.length > 0) && (
                    <div className="flex justify-center lg:justify-start">
                      <BitcoinConnectPayment
                        amount={50}
                        recipients={getPublisherPaymentRecipients()}
                        enableBoosts={true}
                        boostMetadata={{
                          title: `Support ${publisher.name}`,
                          artist: publisher.name,
                          url: `https://itdv.podtards.com/publisher/${publisherName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}`,
                          appName: 'ITDV Lightning',
                          podcastFeedGuid: publisher.guid,
                          feedUrl: publisher.feedUrl,
                          publisherGuid: publisher.guid,
                          publisherUrl: `https://itdv.podtards.com/publisher/${publisherName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}`
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Albums List with Expandable Tracks */}
        <div className="container mx-auto px-4 pb-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Albums</h2>
            <div className="space-y-6">
              {publisher.albums.map((album, index) => {
                const albumKey = `${album.feedId}-${index}`;
                const isExpanded = expandedAlbums.has(albumKey);
                
                return (
                  <div
                    key={albumKey}
                    className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden"
                  >
                    {/* Album Header */}
                    <div className="p-4">
                      <div className="flex gap-4">
                        {/* Album Cover */}
                        <div className="flex-shrink-0">
                          <Link href={`/album/${getAlbumSlug(album)}`}>
                            <Image
                              src={album.coverArt}
                              alt={album.title}
                              width={120}
                              height={120}
                              className="rounded-lg hover:opacity-90 transition-opacity"
                            />
                          </Link>
                        </div>
                        
                        {/* Album Info */}
                        <div className="flex-1">
                          <Link href={`/album/${getAlbumSlug(album)}`}>
                            <h3 className="text-lg font-semibold hover:text-blue-400 transition-colors">
                              {album.title}
                            </h3>
                          </Link>
                          <p className="text-sm text-gray-400 mb-2">{album.artist}</p>
                          {album.releaseDate && (
                            <p className="text-xs text-gray-500 mb-3">{getReleaseYear(album.releaseDate)}</p>
                          )}
                          
                          {/* Album Actions */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => handlePlayAlbum(album, e)}
                              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                            >
                              <Play size={16} />
                              <span className="text-sm">Play Album</span>
                            </button>
                            
                            {album.paymentRecipients && album.paymentRecipients.length > 0 && (
                              <BitcoinConnectPayment
                                amount={50}
                                recipients={album.paymentRecipients}
                                className="scale-90"
                                enableBoosts={true}
                                boostMetadata={{
                                  title: album.title,
                                  artist: album.artist,
                                  album: album.title,
                                  url: `https://itdv.podtards.com/album/${getAlbumSlug(album)}`,
                                  appName: 'ITDV Lightning',
                                  podcastFeedGuid: album.podcastGuid,
                                  feedUrl: album.feedUrl
                                }}
                              />
                            )}
                            
                            <button
                              onClick={() => {
                                const newExpanded = new Set(expandedAlbums);
                                if (isExpanded) {
                                  newExpanded.delete(albumKey);
                                } else {
                                  newExpanded.add(albumKey);
                                }
                                setExpandedAlbums(newExpanded);
                              }}
                              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              <span>{album.tracks.length} tracks</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expandable Track List */}
                    {isExpanded && (
                      <div className="border-t border-white/10">
                        <div className="p-4 space-y-2">
                          {album.tracks.map((track, trackIndex) => {
                            const isPlaying = currentTrack?.url === track.url;
                            
                            return (
                              <div
                                key={`${track.url}-${trackIndex}`}
                                className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors"
                              >
                                <button
                                  onClick={() => {
                                    const fullTrack = {
                                      ...track,
                                      artist: album.artist,
                                      album: album.title,
                                      image: track.image || album.coverArt
                                    };
                                    playTrack(fullTrack);
                                  }}
                                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                                >
                                  <Play size={12} className={isPlaying ? 'text-blue-400' : ''} />
                                </button>
                                
                                <span className="text-sm text-gray-400 w-8">
                                  {track.trackNumber}
                                </span>
                                
                                <span className={`flex-1 text-sm ${isPlaying ? 'text-blue-400' : ''}`}>
                                  {track.title}
                                </span>
                                
                                <span className="text-sm text-gray-500">
                                  {track.duration}
                                </span>
                                
                                {(track.paymentRecipients && track.paymentRecipients.length > 0) || 
                                 (album.paymentRecipients && album.paymentRecipients.length > 0) ? (
                                  <BitcoinConnectPayment
                                    amount={50}
                                    recipients={track.paymentRecipients || album.paymentRecipients || []}
                                    className="scale-75"
                                    enableBoosts={true}
                                    boostMetadata={{
                                      title: track.title,
                                      artist: album.artist,
                                      album: album.title,
                                      url: `https://itdv.podtards.com/album/${getAlbumSlug(album)}#${track.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}`,
                                      appName: 'ITDV Lightning',
                                      itemGuid: track.itemGuid,
                                      podcastFeedGuid: album.podcastGuid,
                                      feedUrl: album.feedUrl
                                    }}
                                  />
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom spacing for audio player */}
        <div className="h-24" />
      </div>
    </div>
  );
}