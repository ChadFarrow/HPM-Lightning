'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { useAudio } from '@/contexts/AudioContext';

interface Track {
  title: string;
  duration: string;
  url: string;
  trackNumber: number;
  image?: string;
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
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const { playAlbum } = useAudio();

  useEffect(() => {
    if (!initialPublisher) {
      loadPublisher();
    }
    loadPublisherArtwork();
  }, [publisherName, initialPublisher]);

  const loadPublisherArtwork = useCallback(async () => {
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
  }, [publisherName]);

  const loadPublisher = useCallback(async () => {
    try {
      setIsLoading(true);
      // Try fast static endpoint first
      let response = await fetch('/api/albums-static');
      
      if (!response.ok) {
        console.log('Static endpoint failed, falling back to RSS parsing...');
        response = await fetch('/api/albums');
      }
      
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
        // Sort albums by release date (newest first)
        const sortedAlbums = [...publisherAlbums].sort((a, b) => {
          // Handle missing dates by putting them at the end
          if (!a.releaseDate && !b.releaseDate) return 0;
          if (!a.releaseDate) return 1;
          if (!b.releaseDate) return -1;
          
          // Parse dates more robustly and sort newest first
          const dateA = new Date(a.releaseDate);
          const dateB = new Date(b.releaseDate);
          
          // Check for invalid dates
          if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
          if (isNaN(dateA.getTime())) return 1;
          if (isNaN(dateB.getTime())) return -1;
          
          return dateB.getTime() - dateA.getTime(); // Newest first
        });
        
        const firstAlbum = sortedAlbums[0];
        // Find an album with publisher data, or use defaults
        const albumWithPublisher = sortedAlbums.find((album: Album) => album.publisher) || firstAlbum;
        const publisherInfo: Publisher = {
          name: firstAlbum.artist,
          guid: albumWithPublisher.publisher?.feedGuid || 'no-guid',
          feedUrl: albumWithPublisher.publisher?.feedUrl || '',
          medium: albumWithPublisher.publisher?.medium || 'music',
          albums: sortedAlbums
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
  }, [publisherName]);

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
      {/* Background - Latest Release Artwork */}
      <div className="fixed inset-0 z-0">
        {/* Use latest release artwork as background */}
        {publisher.albums[0]?.coverArt && (
          <Image
            src={publisher.albums[0].coverArt}
            alt={`${publisher.albums[0].title} background`}
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
                    Hash Power Music
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
              {/* Latest Album Artwork as Hero */}
              <div className="flex-shrink-0 mx-auto lg:mx-0">
                <div className="w-64 h-64 lg:w-80 lg:h-80 relative rounded-xl shadow-2xl overflow-hidden border border-white/20">
                  <Image
                    src={publisher.albums[0]?.coverArt || publisherArtwork || '/placeholder-episode.jpg'}
                    alt={`${publisher.albums[0]?.title || publisher.name} artwork`}
                    fill
                    className="object-cover"
                    priority
                    sizes="(min-width: 1024px) 320px, 256px"
                  />
                  {/* Latest Release Label */}
                  {publisher.albums[0] && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-xs font-medium">
                      Latest Release
                    </div>
                  )}
                </div>
              </div>

              {/* Artist Info */}
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-6">
                  <h1 className="text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {publisher.name}
                  </h1>
                  <p className="text-xl lg:text-2xl text-gray-300 mb-4">Artist</p>
                  
                  {/* Latest Release Info */}
                  {publisher.albums[0] && (
                    <div className="mb-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                      <p className="text-sm text-gray-400 mb-1">Latest Release:</p>
                      <p className="font-semibold text-lg">{publisher.albums[0].title}</p>
                      {publisher.albums[0].releaseDate && (
                        <p className="text-sm text-gray-400 mt-1">
                          Released {new Date(publisher.albums[0].releaseDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-center lg:justify-start gap-4 text-sm text-gray-400 mb-6">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      {publisher.albums.length} {publisher.albums.length === 1 ? 'album' : 'albums'}
                    </span>
                  </div>

                  <div className="max-w-2xl mx-auto lg:mx-0 mb-6">
                    <p className="text-gray-300 leading-relaxed">
                      Browse all releases by {publisher.name}, sorted by release date
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Albums Grid */}
        <div className="container mx-auto px-4 pb-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Albums</h2>
              <button
                onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title={`Currently showing ${sortOrder === 'newest' ? 'newest' : 'oldest'} first`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d={sortOrder === 'newest' 
                      ? "M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" 
                      : "M3 4h13M3 8h9m-9 4h6m4-8v12m0 0l-4-4m4 4l4-4"} 
                  />
                </svg>
                <span>{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...publisher.albums].sort((a, b) => {
                // Handle missing dates
                if (!a.releaseDate && !b.releaseDate) return 0;
                if (!a.releaseDate) return 1;
                if (!b.releaseDate) return -1;
                
                // Parse dates more robustly
                const dateA = new Date(a.releaseDate);
                const dateB = new Date(b.releaseDate);
                
                // Check for invalid dates
                if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
                if (isNaN(dateA.getTime())) return 1;
                if (isNaN(dateB.getTime())) return -1;
                
                // Sort based on selected order
                return sortOrder === 'newest' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
              }).map((album, index) => (
                <div
                  key={`${album.feedId}-${index}`}
                  className="group relative"
                >
                  <Link
                    href={`/album/${getAlbumSlug(album)}`}
                    className="block"
                  >
                    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 hover:bg-white/10 transition-colors border border-white/10">
                      <div className="aspect-square mb-3 rounded overflow-hidden relative">
                        <Image
                          src={album.coverArt}
                          alt={album.title}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        
                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={(e) => handlePlayAlbum(album, e)}
                            className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-lg"
                            title={`Play ${album.title}`}
                          >
                            <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm mb-1 truncate group-hover:text-blue-400 transition-colors">
                        {album.title}
                      </h3>
                      <p className="text-xs text-gray-400 truncate">{album.artist}</p>
                      {album.releaseDate && (
                        <p className="text-xs text-gray-500 mt-1">{getReleaseYear(album.releaseDate)}</p>
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom spacing for audio player */}
        <div className="h-24" />
      </div>
    </div>
  );
}