import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// In-memory cache for generated data
let generatedData: any = null;
let lastGenerated = 0;
const GENERATION_TTL = 10 * 60 * 1000; // 10 minutes

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRegenerate = searchParams.get('regenerate') === 'true';
    const clearCache = searchParams.get('clear') === 'true';
    const priority = searchParams.get('priority'); // 'high' for critical albums
    
    // Handle cache clearing
    const staticDataPath = path.join(process.cwd(), 'public', 'static-albums.json');
    
    if (clearCache) {
      // Clear in-memory cache (can't delete files in serverless/read-only environments)
      generatedData = null;
      lastGenerated = 0;
      console.log('🗑️ Cleared in-memory cache (file system is read-only)');
      
      return NextResponse.json({
        message: 'In-memory cache cleared successfully (file system is read-only)',
        cleared: true,
        note: 'Static file cannot be deleted in serverless environment',
        timestamp: new Date().toISOString()
      });
    }
    
    // Try to serve pre-generated static file first (unless forced regeneration)
    // Skip static file if regenerating or if we want to ignore old incomplete data
    const ignoreStaticFile = forceRegenerate || searchParams.get('ignore-static') === 'true';
    
    if (!ignoreStaticFile && fs.existsSync(staticDataPath)) {
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
    
    // Check in-memory cache (unless forced regeneration)
    const now = Date.now();
    if (!forceRegenerate && generatedData && (now - lastGenerated) < GENERATION_TTL) {
      console.log('📦 Serving cached generated data');
      const response = NextResponse.json({
        ...generatedData,
        static: false,
        cached: true,
        loadTime: 'cached'
      });
      
      response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=1800');
      response.headers.set('CDN-Cache-Control', 'max-age=600');
      return response;
    }
    
    // NEVER do live RSS parsing - only use pre-parsed static data
    console.log('⚠️ No static data available and live RSS parsing is disabled for performance and consistency');
    console.log('💡 To update album data, run: npm run update-static-data');
    
    // Return error indicating static data is missing
    return NextResponse.json(
      { 
        error: 'Static album data not available. Live RSS parsing is disabled.',
        albums: [],
        timestamp: new Date().toISOString(),
        note: 'Run npm run update-static-data to regenerate static album data'
      },
      { status: 503 }
    );
    
    
  } catch (error) {
    console.error('Error serving static albums:', error);
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