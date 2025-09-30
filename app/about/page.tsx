'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b backdrop-blur-sm bg-black/30 pt-safe-plus pt-12" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <h1 className="text-4xl font-bold">{process.env.NEXT_PUBLIC_BAND_NAME || '[YOUR_BAND_NAME]'}</h1>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-8 text-center">
              About {process.env.NEXT_PUBLIC_BAND_NAME || '[YOUR_BAND_NAME]'}
            </h1>
            
            {/* Main Description */}
            <div className="bg-gray-900/50 rounded-lg p-8 mb-8">
              <p className="text-lg leading-relaxed mb-4">
                This is a Value4Value music platform powered by the Lightning Network. All music comes from RSS feeds with Podcasting 2.0 value tags, enabling direct Lightning payments to artists.
              </p>
              <p className="text-gray-400">
                This platform template can be used by any band or artist with existing V4V RSS feeds.
              </p>
            </div>

            {/* Add to Home Screen Instructions */}
            <div className="bg-gray-900/50 rounded-lg p-8 mb-8">
              <h2 className="text-2xl font-semibold mb-6">
                📱 Add to Your Home Screen
              </h2>
              <p className="text-gray-300 mb-6">
                Get quick access to this music platform by adding it to your phone&apos;s home screen. 
                It will work like a native app with offline support!
              </p>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* iOS Instructions */}
                <div className="bg-black/40 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="text-2xl">🍎</span> iPhone/iPad (Safari)
                  </h3>
                  <ol className="space-y-3 text-gray-300 text-sm">
                    <li className="flex gap-2">
                      <span className="text-blue-400 font-bold">1.</span>
                      <span>Open this site in Safari browser</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-400 font-bold">2.</span>
                      <span>Tap the Share button <span className="inline-block bg-gray-700 px-2 py-0.5 rounded text-xs">⎙</span> (square with arrow)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-400 font-bold">3.</span>
                      <span>Scroll down and tap &quot;Add to Home Screen&quot;</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-400 font-bold">4.</span>
                      <span>Name it (or keep the default)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-400 font-bold">5.</span>
                      <span>Tap &quot;Add&quot; in the top right corner</span>
                    </li>
                  </ol>
                  <div className="mt-4 p-3 bg-blue-900/30 rounded-lg border border-blue-500/20">
                    <p className="text-xs text-blue-300">
                      💡 The app icon will appear on your home screen and open in full-screen mode!
                    </p>
                  </div>
                </div>

                {/* Android Instructions */}
                <div className="bg-black/40 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="text-2xl">🤖</span> Android (Chrome)
                  </h3>
                  <ol className="space-y-3 text-gray-300 text-sm">
                    <li className="flex gap-2">
                      <span className="text-green-400 font-bold">1.</span>
                      <span>Open this site in Chrome browser</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-400 font-bold">2.</span>
                      <span>Tap the menu button <span className="inline-block bg-gray-700 px-2 py-0.5 rounded text-xs">⋮</span> (three dots)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-400 font-bold">3.</span>
                      <span>Select &quot;Add to Home screen&quot; or &quot;Install app&quot;</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-400 font-bold">4.</span>
                      <span>Name it (or keep the default)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-400 font-bold">5.</span>
                      <span>Tap &quot;Add&quot; or &quot;Install&quot;</span>
                    </li>
                  </ol>
                  <div className="mt-4 p-3 bg-green-900/30 rounded-lg border border-green-500/20">
                    <p className="text-xs text-green-300">
                      💡 You might see an &quot;Install&quot; banner at the bottom of the screen - just tap it!
                    </p>
                  </div>
                </div>
              </div>

              {/* Other Browsers */}
              <div className="mt-6 p-4 bg-yellow-900/20 rounded-lg border border-yellow-500/20">
                <p className="text-sm text-yellow-300">
                  <span className="font-semibold">Other browsers:</span> Firefox, Edge, Brave, and Samsung Internet also support this feature. 
                  Look for &quot;Add to Home Screen&quot; or &quot;Install&quot; in the browser menu (usually in the ⋮ or ≡ menu).
                </p>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-8 mb-12">
              <h2 className="text-2xl font-semibold mb-6">
                Features
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Value4Value Music</h3>
                  <p className="text-gray-400">
                    Support artists directly with Lightning Network payments. Stream music with built-in micropayment support.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">RSS Integration</h3>
                  <p className="text-gray-400">
                    Built on open standards using RSS feeds with Podcasting 2.0 value tags. Decentralized music distribution.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Lightning Payments</h3>
                  <p className="text-gray-400">
                    Instant Bitcoin payments to artists via Lightning Network. Auto-boost and manual boost support.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Progressive Web App</h3>
                  <p className="text-gray-400">
                    Install as a native app on mobile devices. Offline support and push notifications.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg transition-colors font-medium text-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Music
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}