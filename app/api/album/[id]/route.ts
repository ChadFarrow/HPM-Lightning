import { NextResponse } from 'next/server';
import { FeedManager } from '@/lib/feed-manager';
import { RSSParser } from '@/lib/rss-parser';

// Cache for individual albums to avoid repeated RSS parsing
let albumCache: Map<string, { data: any; timestamp: number }> = new Map();
const ALBUM_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const albumId = decodeURIComponent(id);
    
    console.log(`🔍 Looking for single album with ID: "${albumId}"`);
    
    // Check cache first
    const cached = albumCache.get(albumId);
    if (cached && Date.now() - cached.timestamp < ALBUM_CACHE_TTL) {
      console.log(`📦 Serving cached album: "${albumId}"`);
      const response = NextResponse.json({ 
        album: cached.data,
        cached: true,
        timestamp: new Date().toISOString()
      });
      
      // Add cache headers for better performance
      response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600');
      return response;
    }
    
    // Get feeds directly from FeedManager (uses feeds.json, no database)
    const feeds = FeedManager.getActiveFeeds();
    const albumFeeds = feeds.filter(feed => feed.type === 'album');
    
    // Helper function to create URL slug (same as homepage)
    const createSlug = (title: string) => 
      title.toLowerCase()
        .replace(/[^\w\s-]/g, '')       // Remove punctuation except spaces and hyphens
        .replace(/\s+/g, '-')           // Replace spaces with dashes
        .replace(/-+/g, '-')            // Replace multiple consecutive dashes with single dash
        .replace(/^-+|-+$/g, '');       // Remove leading/trailing dashes
    
    // Find the matching album feed first
    let matchingFeed = null;
    
    // First try direct feed ID match (fastest)
    for (const feed of albumFeeds) {
      if (feed.id === albumId) {
        matchingFeed = feed;
        console.log(`✅ Found direct feedId match: "${feed.id}"`);
        break;
      }
    }
    
    // If no direct match, try parsing RSS feeds to match by album title
    if (!matchingFeed) {
      console.log(`🔍 No direct feedId match, searching by album title...`);
      
      for (const feed of albumFeeds) {
        try {
          console.log(`🎵 Testing feed: ${feed.title}`);
          
          // Parse this feed to get the actual album data
          const albumData = await RSSParser.parseAlbumFeed(feed.originalUrl);
          if (!albumData?.title) continue;
          
          // Try various matching patterns with the actual album title
          const albumTitle = albumData.title;
          const titleMatch = albumTitle.toLowerCase() === albumId.toLowerCase();
          const slugMatch = createSlug(albumTitle) === albumId.toLowerCase();
          const compatMatch = albumTitle.toLowerCase().replace(/\s+/g, '-') === albumId.toLowerCase();
          
          // Flexible matching: check if the album title starts with the decoded ID
          const baseTitle = albumTitle.toLowerCase().split(/\s*[-–]\s*/)[0];
          const baseTitleSlug = createSlug(baseTitle);
          const flexibleMatch = baseTitleSlug === albumId.toLowerCase();
          
          if (titleMatch || slugMatch || compatMatch || flexibleMatch) {
            matchingFeed = feed;
            // Store the already parsed album data to avoid re-parsing
            (matchingFeed as any)._parsedAlbumData = albumData;
            console.log(`✅ Found title match: "${albumTitle}" -> "${feed.id}"`);
            break;
          }
        } catch (error) {
          console.log(`⚠️ Failed to parse feed ${feed.id} for title matching:`, error);
          continue; // Try next feed
        }
      }
    }
    
    // If no feed found, check static albums data as fallback
    if (!matchingFeed) {
      console.log(`🔍 No feed match, checking static albums data...`);
      
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const staticAlbumsPath = path.join(process.cwd(), 'public', 'static-albums.json');
        const staticAlbumsData = await fs.readFile(staticAlbumsPath, 'utf8');
        const staticAlbumsJson = JSON.parse(staticAlbumsData);
        const staticAlbums = staticAlbumsJson.albums || [];
        console.log(`📊 Static albums loaded: ${staticAlbums.length} albums found`);
        
        // Search static albums for matching ID
        const matchingStaticAlbum = staticAlbums.find((album: any) => {
          const titleMatch = album.title?.toLowerCase() === albumId.toLowerCase();
          const slugMatch = createSlug(album.title || '') === albumId.toLowerCase();
          const compatMatch = album.title?.toLowerCase().replace(/\s+/g, '-') === albumId.toLowerCase();
          
          // Flexible matching: check if the album title starts with the decoded ID
          const baseTitle = album.title?.toLowerCase().split(/\s*[-–]\s*/)[0] || '';
          const baseTitleSlug = createSlug(baseTitle);
          const flexibleMatch = baseTitleSlug === albumId.toLowerCase();
          
          return titleMatch || slugMatch || compatMatch || flexibleMatch;
        });
        
        if (matchingStaticAlbum) {
          console.log(`✅ Found static album match: "${matchingStaticAlbum.title}"`);
          
          // Return static album data directly (it's already in the correct format)
          const album = {
            ...matchingStaticAlbum,
            feedId: 'static-' + albumId,
            feedUrl: 'static-data',
            lastUpdated: new Date().toISOString()
          };
          
          const parseTime = 0; // Static data doesn't need parse time
          console.log(`✅ Successfully returned static album in ${parseTime}ms: "${album?.title || 'Unknown'}"`);
          
          return NextResponse.json({ 
            album,
            parseTime: `${parseTime}ms`,
            timestamp: new Date().toISOString(),
            source: 'static-data'
          });
        }
      } catch (error) {
        console.log(`⚠️ Failed to check static albums data:`, error);
      }
      
      console.log(`❌ No matching album found for: "${albumId}"`);
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }
    
    console.log(`✅ Found matching feed: "${matchingFeed.title || matchingFeed.id}"`);
    
    // Parse only the single RSS feed we need (or reuse already parsed data)
    console.log(`🎵 Parsing single RSS feed: ${matchingFeed.originalUrl}`);
    const startTime = Date.now();
    
    let albumData;
    
    // If we already parsed this feed during title matching, reuse the data
    if ((matchingFeed as any)._parsedAlbumData) {
      console.log(`♻️ Reusing already parsed album data`);
      albumData = (matchingFeed as any)._parsedAlbumData;
    } else {
      albumData = await RSSParser.parseAlbumFeed(matchingFeed.originalUrl);
    }
    
    if (!albumData) {
      return NextResponse.json({ error: 'Failed to parse album' }, { status: 500 });
    }
    
    // Add feed metadata (same as albums-no-db endpoint)
    const album = {
      ...albumData,
      feedId: matchingFeed.id,
      feedUrl: matchingFeed.originalUrl,
      lastUpdated: matchingFeed.lastUpdated
    };
    
    const parseTime = Date.now() - startTime;
    console.log(`✅ Successfully parsed album in ${parseTime}ms: "${album?.title || 'Unknown'}"`);
    
    // Cache the result
    albumCache.set(albumId, { data: album, timestamp: Date.now() });
    
    const response = NextResponse.json({ 
      album,
      parseTime: `${parseTime}ms`,
      timestamp: new Date().toISOString(),
      cached: false
    });
    
    // Add cache headers for better performance
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    return response;
    
  } catch (error) {
    console.error('❌ Error fetching single album:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch album',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}