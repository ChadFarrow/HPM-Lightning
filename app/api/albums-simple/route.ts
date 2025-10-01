import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Try to serve pre-generated static file first
    const staticDataPath = path.join(process.cwd(), 'public', 'static-albums.json');
    
    if (fs.existsSync(staticDataPath)) {
      const staticData = JSON.parse(fs.readFileSync(staticDataPath, 'utf8'));
      
      const response = NextResponse.json({
        ...staticData,
        static: true,
        loadTime: 'instant'
      });
      
      // Aggressive caching for static data
      response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400');
      response.headers.set('CDN-Cache-Control', 'max-age=7200');
      return response;
    }
    
    // Fallback to minimal hardcoded data if no static file exists
    const fallbackAlbums = [
      {
        title: "Bloodshot Lies",
        artist: "Doerfel Family",
        description: "The album",
        coverArt: "/placeholder-podcast.jpg",
        tracks: [
          {
            title: "Bloodshot Lies",
            duration: "3:45",
            url: "https://www.doerfelverse.com/audio/bloodshot-lies.mp3",
            trackNumber: 1
          }
        ],
        releaseDate: "2024-01-01",
        feedId: "fallback"
      }
    ];
    
    const response = NextResponse.json({
      albums: fallbackAlbums,
      count: fallbackAlbums.length,
      timestamp: new Date().toISOString(),
      static: false,
      fallback: true
    });
    
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    return response;
    
  } catch (error) {
    console.error('Error serving simple albums:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load albums',
        albums: [],
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
