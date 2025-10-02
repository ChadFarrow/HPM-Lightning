import { Metadata } from 'next';
import AlbumDetailClient from './AlbumDetailClient';
import { getBandName } from '@/lib/band-utils';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const albumTitle = decodeURIComponent(id).replace(/-/g, ' ');
  const bandName = getBandName();

  return {
      title: `${albumTitle} | ${bandName}`,
  description: `Listen to ${albumTitle} on ${bandName}`,
  };
}

async function getAlbumData(albumId: string) {
  // Skip SSR data fetching entirely - let client-side load from cache
  // This prevents SSR from causing dynamic RSS parsing
  console.log('🔄 Skipping SSR data fetch, will load client-side from cache');
  return null;
}

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const albumData = await getAlbumData(id);
  const albumTitle = decodeURIComponent(id).replace(/-/g, ' ');
  const albumSlug = id; // Keep the original slug for API calls

  return <AlbumDetailClient albumTitle={albumTitle} albumSlug={albumSlug} initialAlbum={albumData} />;
}