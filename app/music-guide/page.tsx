'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function MusicGuidePage() {
  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/cannabis-records-studio.png"
          alt="Cannabis Records Studio"
          fill
          className="object-cover w-full h-full"
          loading="eager"
          quality={40}
          sizes="100vw"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k="
        />
        <div className="absolute inset-0 bg-black/80"></div>
      </div>

      {/* Content overlay */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b backdrop-blur-sm bg-black/50 pt-6" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <div className="container mx-auto px-6 py-2">
            <div className="flex items-center justify-between">
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Music</span>
              </Link>
              <h1 className="text-2xl font-bold">🎵 Music Streaming Guide</h1>
              {/* Logo placeholder */}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          <div className="prose prose-invert max-w-none">
            {/* Introduction */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/30">
              <h2 className="text-3xl font-bold mb-4 text-blue-400">🎵 Discover the DoerfelVerse</h2>
              <p className="text-lg mb-4">
                HPM Lightning features music from the <strong>DoerfelVerse</strong> - a collection of independent artists creating amazing music across multiple genres. From rock to electronic, bluegrass to experimental, there&apos;s something for every music lover.
              </p>
              
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 text-center">
                <h3 className="text-xl font-bold mb-2">🎯 What You&apos;ll Find</h3>
                <p className="text-lg">
                  <strong>40+ albums, EPs, and singles</strong> from talented independent artists, all available for streaming with optional Lightning payments.
                </p>
              </div>
            </div>

            {/* Artists */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/30">
              <h2 className="text-3xl font-bold mb-4 text-green-400">🎤 Featured Artists</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/70 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">🎸 Main Artists</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-sm">🎸</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">The Doerfels</h4>
                        <p className="text-sm text-gray-300">Main band with multiple albums</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-sm">🎵</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">CityBeach</h4>
                        <p className="text-sm text-gray-300">Alternative rock</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-sm">🎹</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">Middle Season</h4>
                        <p className="text-sm text-gray-300">Indie/experimental</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
                        <span className="text-sm">🎤</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">Ryan Fonda</h4>
                        <p className="text-sm text-gray-300">Singer-songwriter</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-black/70 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-3 text-purple-400">🎶 Additional Artists</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                        <span className="text-sm">🥁</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">Kurtisdrums</h4>
                        <p className="text-sm text-gray-300">Instrumental</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-sm">🎤</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">Sir TJ The Wrathful</h4>
                        <p className="text-sm text-gray-300">Hip-hop</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center">
                        <span className="text-sm">🎸</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">Generation Gap</h4>
                        <p className="text-sm text-gray-300">Rock</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                        <span className="text-sm">🎹</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">Jdog</h4>
                        <p className="text-sm text-gray-300">Electronic</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Types */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/30">
              <h2 className="text-3xl font-bold mb-4 text-yellow-400">📀 Content Types</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-black/30 rounded-lg p-6 text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">💿</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">Albums</h3>
                  <p className="text-sm mb-3">Full-length releases with 7+ tracks</p>
                  <div className="bg-black/30 rounded-lg p-3">
                    <p className="text-xs text-gray-300">Examples:</p>
                    <p className="text-sm font-semibold">Bloodshot Lies - The Album</p>
                    <p className="text-sm font-semibold">Music From The Doerfel-Verse</p>
                  </div>
                </div>

                <div className="bg-black/30 rounded-lg p-6 text-center">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📀</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-green-400">EPs</h3>
                  <p className="text-sm mb-3">Extended plays with 2-6 tracks</p>
                  <div className="bg-black/30 rounded-lg p-3">
                    <p className="text-xs text-gray-300">Examples:</p>
                    <p className="text-sm font-semibold">Think EP</p>
                    <p className="text-sm font-semibold">Various EPs</p>
                  </div>
                </div>

                <div className="bg-black/30 rounded-lg p-6 text-center">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🎵</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-purple-400">Singles</h3>
                  <p className="text-sm mb-3">Individual songs (1 track)</p>
                  <div className="bg-black/30 rounded-lg p-3">
                    <p className="text-xs text-gray-300">Examples:</p>
                    <p className="text-sm font-semibold">Various Singles</p>
                    <p className="text-sm font-semibold">Standalone Tracks</p>
                  </div>
                </div>
              </div>
            </div>

            {/* How to Listen */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/30">
              <h2 className="text-3xl font-bold mb-4 text-orange-400">🎧 How to Listen</h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Browse Music</h3>
                    <p className="mb-3">Explore the music collection:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-300">
                      <li><strong>Scroll through albums</strong> on the main page</li>
                      <li><strong>Use filters</strong> to find Albums, EPs, Singles, or Artists</li>
                      <li><strong>Switch views</strong> between grid and list layouts</li>
                      <li><strong>Search for specific artists</strong> or albums</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Start Playing</h3>
                    <p className="mb-3">Begin listening to music:</p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-300">
                      <li><strong>Click the play button</strong> on any album card</li>
                      <li><strong>Now Playing screen opens</strong> automatically</li>
                      <li><strong>Music starts streaming</strong> from the RSS feed</li>
                      <li><strong>Full album plays</strong> in track order</li>
                    </ol>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Control Playback</h3>
                    <p className="mb-3">Use the audio controls:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-black/30 rounded-lg p-3 text-center">
                        <h4 className="font-semibold text-green-400 mb-1">▶️ Play/Pause</h4>
                        <p className="text-xs">Start and stop playback</p>
                      </div>
                      <div className="bg-black/30 rounded-lg p-3 text-center">
                        <h4 className="font-semibold text-blue-400 mb-1">⏭️ Skip</h4>
                        <p className="text-xs">Next/previous tracks</p>
                      </div>
                      <div className="bg-black/30 rounded-lg p-3 text-center">
                        <h4 className="font-semibold text-purple-400 mb-1">🎚️ Seek</h4>
                        <p className="text-xs">Jump to any point</p>
                      </div>
                      <div className="bg-black/30 rounded-lg p-3 text-center">
                        <h4 className="font-semibold text-yellow-400 mb-1">🔊 Volume</h4>
                        <p className="text-xs">Adjust sound level</p>
                      </div>
                      <div className="bg-black/30 rounded-lg p-3 text-center">
                        <h4 className="font-semibold text-red-400 mb-1">🔀 Shuffle</h4>
                        <p className="text-xs">Randomize order</p>
                      </div>
                      <div className="bg-black/30 rounded-lg p-3 text-center">
                        <h4 className="font-semibold text-indigo-400 mb-1">🔁 Repeat</h4>
                        <p className="text-xs">Loop tracks</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Experience */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/30">
              <h2 className="text-3xl font-bold mb-4 text-purple-400">📱 Mobile Experience</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/70 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">📱 Progressive Web App</h3>
                  <p className="mb-3">Install HPM Lightning as a mobile app:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
                    <li>Visit the site on your mobile browser</li>
                    <li>Look for the install prompt</li>
                    <li>Add to home screen</li>
                    <li>Enjoy app-like experience</li>
                  </ol>
                </div>

                <div className="bg-black/70 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-3 text-green-400">👆 Touch Gestures</h3>
                  <p className="mb-3">Control music with swipes:</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-sm">👈</span>
                      </div>
                      <span className="text-sm">Swipe Left - Next Track</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-sm">👉</span>
                      </div>
                      <span className="text-sm">Swipe Right - Previous Track</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-sm">👆</span>
                      </div>
                      <span className="text-sm">Swipe Up - Toggle Shuffle</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
                        <span className="text-sm">👇</span>
                      </div>
                      <span className="text-sm">Swipe Down - Toggle Repeat</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Now Playing Screen */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/30">
              <h2 className="text-3xl font-bold mb-4 text-indigo-400">🎵 Now Playing Screen</h2>
              
              <p className="mb-4">
                The <strong>Now Playing Screen</strong> is your full-featured music player with beautiful album artwork and all the controls you need.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/70 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">🎨 Visual Features</h3>
                  <ul className="space-y-2 text-sm">
                    <li><strong>Full-screen album artwork</strong> with dynamic colors</li>
                    <li><strong>Track information display</strong> (title, artist, album)</li>
                    <li><strong>Progress visualization</strong> with animated elements</li>
                    <li><strong>Background blur effects</strong> for immersive experience</li>
                  </ul>
                </div>
                <div className="bg-black/70 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-3 text-green-400">🎛️ Controls</h3>
                  <ul className="space-y-2 text-sm">
                    <li><strong>All playback controls</strong> easily accessible</li>
                    <li><strong>Volume slider</strong> for precise control</li>
                    <li><strong>Seek bar</strong> to jump to any point</li>
                    <li><strong>Shuffle and repeat</strong> toggle buttons</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Audio Features */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/30">
              <h2 className="text-3xl font-bold mb-4 text-teal-400">🔊 Audio Features</h2>
              
              <div className="space-y-6">
                <div className="bg-black/70 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">🌐 Streaming Technology</h3>
                  <p className="mb-3">HPM Lightning uses advanced streaming technology:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                    <li><strong>Direct RSS feed streaming</strong> - no intermediate servers</li>
                    <li><strong>HLS.js support</strong> for adaptive streaming</li>
                    <li><strong>Multiple audio formats</strong> supported</li>
                    <li><strong>Background playback</strong> continues when browsing</li>
                  </ul>
                </div>

                <div className="bg-black/70 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-3 text-green-400">📱 Device Integration</h3>
                  <p className="mb-3">Seamless integration with your device:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                    <li><strong>Media Session API</strong> - shows in device media controls</li>
                    <li><strong>Lock screen controls</strong> on mobile devices</li>
                    <li><strong>Bluetooth integration</strong> for wireless headphones</li>
                    <li><strong>CarPlay/Android Auto</strong> compatibility</li>
                  </ul>
                </div>

                <div className="bg-black/70 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-3 text-purple-400">🎵 Playlist Management</h3>
                  <p className="mb-3">Smart playlist features:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                    <li><strong>Automatic album playlists</strong> - plays entire albums</li>
                    <li><strong>Track navigation</strong> - skip to any track in the album</li>
                    <li><strong>Shuffle mode</strong> - randomize track order</li>
                    <li><strong>Repeat modes</strong> - loop single tracks or entire albums</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Troubleshooting */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/30">
              <h2 className="text-3xl font-bold mb-4 text-red-400">🔧 Troubleshooting Audio Issues</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">Audio Won&apos;t Play</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-300">
                    <li><strong>Tap play button twice</strong> - browsers require user interaction</li>
                    <li><strong>Check internet connection</strong> - streaming requires internet</li>
                    <li><strong>Try different browser</strong> - some browsers have audio restrictions</li>
                    <li><strong>Enable JavaScript</strong> - required for audio functionality</li>
                    <li><strong>Check browser permissions</strong> - allow audio playback</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-yellow-400">Poor Audio Quality</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-300">
                    <li><strong>Check internet speed</strong> - slow connections affect quality</li>
                    <li><strong>Try refreshing the page</strong> - clears audio cache</li>
                    <li><strong>Close other tabs</strong> - free up bandwidth</li>
                    <li><strong>Check audio device</strong> - ensure speakers/headphones work</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-green-400">Mobile Issues</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-300">
                    <li><strong>Install as PWA</strong> - better mobile experience</li>
                    <li><strong>Allow background audio</strong> - enable in browser settings</li>
                    <li><strong>Check battery optimization</strong> - prevent app from sleeping</li>
                    <li><strong>Update browser</strong> - use latest version</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/30">
              <h2 className="text-3xl font-bold mb-4 text-indigo-400">💡 Tips for Better Listening</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/70 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">🎧 Audio Quality</h3>
                  <ul className="space-y-2 text-sm">
                    <li><strong>Use good headphones</strong> for best experience</li>
                    <li><strong>Close unnecessary tabs</strong> to free up bandwidth</li>
                    <li><strong>Use wired connection</strong> for stable streaming</li>
                    <li><strong>Adjust volume</strong> to comfortable levels</li>
                  </ul>
                </div>
                <div className="bg-black/70 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-3 text-green-400">📱 Mobile Tips</h3>
                  <ul className="space-y-2 text-sm">
                    <li><strong>Install as PWA</strong> for app-like experience</li>
                    <li><strong>Use swipe gestures</strong> for easy control</li>
                    <li><strong>Enable background playback</strong> in browser settings</li>
                    <li><strong>Keep device charged</strong> for long listening sessions</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">🎵 Start Listening Now</h2>
              <p className="text-lg mb-6">
                Discover amazing music from the DoerfelVerse and enjoy a premium streaming experience!
              </p>
              <div className="space-y-4">
                <Link 
                  href="/"
                  className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  🎵 Browse Music Now
                </Link>
                <div className="text-sm text-blue-100">
                  <p><strong>Experience the future of music streaming!</strong></p>
                  <p className="mt-2">🎵⚡</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
