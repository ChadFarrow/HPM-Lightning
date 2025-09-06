import { Metadata } from 'next';
import AlbumDetailClient from './AlbumDetailClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const albumTitle = decodeURIComponent(id).replace(/-/g, ' ');
  
  return {
      title: `${albumTitle} | Into the Doerfel-Verse`,
  description: `Listen to ${albumTitle} on Into the Doerfel-Verse`,
  };
}

async function getAlbumData(albumId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 
                   (process.env.NODE_ENV === 'production' 
                     ? 'https://itdv-site.vercel.app' 
                     : 'http://localhost:3000');
    
    console.log(`🚀 Fetching single album: ${albumId}`);
    const startTime = Date.now();
    
    // Use the new optimized single-album endpoint
    const response = await fetch(`${baseUrl}/api/album/${encodeURIComponent(albumId)}`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    const fetchTime = Date.now() - startTime;
    console.log(`⏱️ Album API fetch took: ${fetchTime}ms`);

    if (!response.ok) {
      console.error('Failed to fetch album:', response.status);
      return null;
    }

    const data = await response.json();
    return data.album || null;
  } catch (error) {
    console.error('Error fetching album data:', error);
    return null;
  }
}

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const albumData = await getAlbumData(id);
  const albumTitle = decodeURIComponent(id).replace(/-/g, ' ');

  return <AlbumDetailClient albumTitle={albumTitle} initialAlbum={albumData} />;
}