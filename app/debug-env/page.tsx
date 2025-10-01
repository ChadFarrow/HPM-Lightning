'use client';

export default function DebugEnvPage() {
  const bandName = process.env.NEXT_PUBLIC_BAND_NAME;
  const bandSlug = process.env.NEXT_PUBLIC_BAND_SLUG;
  const siteTitle = process.env.NEXT_PUBLIC_SITE_TITLE;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-8">Environment Variables Debug</h1>
      
      <div className="space-y-4 font-mono">
        <div>
          <strong>NEXT_PUBLIC_BAND_NAME:</strong> 
          <span className="ml-2 text-yellow-400">&quot;{bandName}&quot;</span>
        </div>
        <div>
          <strong>NEXT_PUBLIC_BAND_SLUG:</strong> 
          <span className="ml-2 text-yellow-400">&quot;{bandSlug}&quot;</span>
        </div>
        <div>
          <strong>NEXT_PUBLIC_SITE_TITLE:</strong> 
          <span className="ml-2 text-yellow-400">&quot;{siteTitle}&quot;</span>
        </div>
        <div>
          <strong>NEXT_PUBLIC_SITE_URL:</strong> 
          <span className="ml-2 text-yellow-400">&quot;{siteUrl}&quot;</span>
        </div>
      </div>

      <div className="mt-8">
        <strong>All NEXT_PUBLIC_ vars:</strong>
        <pre className="mt-2 p-4 bg-gray-900 rounded text-sm">
          {JSON.stringify(
            Object.fromEntries(
              Object.entries(process.env).filter(([key]) => key.startsWith('NEXT_PUBLIC_'))
            ), 
            null, 
            2
          )}
        </pre>
      </div>
    </div>
  );
}