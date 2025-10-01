// Utility functions for band configuration

export function generateBandSlug(bandName: string): string {
  return bandName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

export function getBandName(): string {
  // For client-side, check both process.env and window
  if (typeof window !== 'undefined') {
    // Client-side: check if env vars are available
    const bandName = process.env.NEXT_PUBLIC_BAND_NAME;
    console.log('Client-side band name:', bandName); // Debug log
    return bandName || '[YOUR_BAND_NAME]';
  }
  // Server-side
  return process.env.NEXT_PUBLIC_BAND_NAME || '[YOUR_BAND_NAME]';
}

export function getBandSlug(): string {
  // Use manual slug if provided, otherwise auto-generate from band name
  const manualSlug = process.env.NEXT_PUBLIC_BAND_SLUG;
  if (manualSlug && manualSlug !== '[your-band-slug]') {
    return manualSlug;
  }
  
  const bandName = getBandName();
  if (bandName === '[YOUR_BAND_NAME]') {
    return '[your-band-slug]';
  }
  
  return generateBandSlug(bandName);
}

export function getSiteTitle(): string {
  const bandName = getBandName();
  const defaultTitle = process.env.NEXT_PUBLIC_SITE_TITLE;
  
  if (defaultTitle && defaultTitle !== `${bandName} - Lightning Music Platform`) {
    return defaultTitle;
  }
  
  return `${bandName} - Lightning Music Platform`;
}