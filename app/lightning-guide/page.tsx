'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function LightningGuidePage() {
  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/placeholder-podcast.jpg"
          alt="Background Image"
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
              <h1 className="text-2xl font-bold">⚡ Lightning Payments Guide</h1>
              {/* Logo placeholder */}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          <div className="prose prose-invert max-w-none">
            {/* Introduction */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/30">
              <h2 className="text-3xl font-bold mb-4 text-yellow-400">⚡ Lightning Network & Value4Value</h2>
              <p className="text-lg mb-4">
                HPM Lightning uses Bitcoin&apos;s Lightning Network to enable <strong>Value4Value</strong> payments - a revolutionary model where you pay artists directly based on the value you receive from their music.
              </p>
              
              <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-4 text-center">
                <h3 className="text-xl font-bold mb-2">💡 Key Concept</h3>
                <p className="text-lg">
                  <strong>Pay what you think the music is worth</strong> - no fixed prices, no subscriptions, just direct support to artists.
                </p>
              </div>
            </div>

            {/* How Lightning Works */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/30">
              <h2 className="text-3xl font-bold mb-4 text-blue-400">🚀 How Lightning Payments Work</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-black/70 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-3 text-green-400">⚡ Instant</h3>
                  <p className="text-sm">Payments settle in seconds, not minutes or hours like traditional Bitcoin transactions.</p>
                </div>
                <div className="bg-black/70 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">💰 Micro-payments</h3>
                  <p className="text-sm">Pay as little as 1 satoshi (0.00000001 BTC) - perfect for supporting individual songs.</p>
                </div>
                <div className="bg-black/70 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-3 text-purple-400">💸 Low Fees</h3>
                  <p className="text-sm">Minimal transaction costs - often less than a penny for small payments.</p>
                </div>
                <div className="bg-black/70 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-3 text-yellow-400">🌍 Global</h3>
                  <p className="text-sm">Works worldwide without traditional banking systems or currency conversion.</p>
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-3">The Lightning Network</h3>
              <p className="mb-4">
                The Lightning Network is a second-layer solution built on top of Bitcoin that enables instant, low-cost payments. Think of it as a network of payment channels that allow you to send Bitcoin instantly without waiting for blockchain confirmations.
              </p>
            </div>

            {/* Payment Methods */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/30">
              <h2 className="text-3xl font-bold mb-4 text-green-400">💳 Supported Payment Methods</h2>
              
              <div className="space-y-6">
                <div className="bg-black/70 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">🌐 WebLN (Web Lightning)</h3>
                  <p className="mb-4">Browser extension wallets that integrate directly with websites:</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <h4 className="font-semibold text-yellow-400 mb-1">Alby</h4>
                      <p className="text-sm">Most popular WebLN wallet</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <h4 className="font-semibold text-green-400 mb-1">Zeus</h4>
                      <p className="text-sm">Mobile Lightning wallet</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <h4 className="font-semibold text-purple-400 mb-1">Phoenix</h4>
                      <p className="text-sm">Mobile-first Lightning wallet</p>
                    </div>
                  </div>
                </div>

                <div className="bg-black/70 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-3 text-purple-400">🔗 NWC (Nostr Wallet Connect)</h3>
                  <p className="mb-4">Connect your Lightning wallet through the Nostr protocol:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <h4 className="font-semibold text-blue-400 mb-1">Alby Hub</h4>
                      <p className="text-sm">Web-based Lightning wallet</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <h4 className="font-semibold text-green-400 mb-1">Mutiny Wallet</h4>
                      <p className="text-sm">Privacy-focused Lightning wallet</p>
                    </div>
                  </div>
                </div>

                <div className="bg-black/70 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-3 text-yellow-400">📧 Lightning Addresses</h3>
                  <p className="mb-4">Email-style addresses for Lightning payments:</p>
                  <div className="bg-black/70 rounded-lg p-4">
                    <div className="space-y-2">
                      <p className="text-sm"><strong>Examples:</strong></p>
                      <p className="font-mono text-blue-400">user@getalby.com</p>
                      <p className="font-mono text-green-400">artist@strike.me</p>
                      <p className="font-mono text-purple-400">musician@walletofsatoshi.com</p>
                    </div>
                    <p className="text-sm mt-3 text-gray-300">
                      <strong>Benefits:</strong> Easy to remember, universal compatibility, works across different wallet providers
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Getting Started */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/30">
              <h2 className="text-3xl font-bold mb-4 text-orange-400">🚀 Getting Started with Lightning Payments</h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Choose Your Wallet</h3>
                    <p className="mb-3">Select a Lightning wallet that works for you:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-300">
                      <li><strong>For beginners:</strong> Alby browser extension</li>
                      <li><strong>For mobile users:</strong> Zeus or Phoenix wallet</li>
                      <li><strong>For privacy:</strong> Mutiny Wallet</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Fund Your Wallet</h3>
                    <p className="mb-3">Add Bitcoin to your Lightning wallet:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-300">
                      <li>Buy Bitcoin from exchanges (Coinbase, Kraken, etc.)</li>
                      <li>Transfer Bitcoin to your Lightning wallet</li>
                      <li>Convert to Lightning balance</li>
                      <li>Start with small amounts (10,000-50,000 sats)</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Connect to HPM Lightning</h3>
                    <p className="mb-3">Connect your wallet to the platform:</p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-300">
                      <li>Click the Lightning wallet button in the header</li>
                      <li>Choose your connection method (WebLN, NWC, or Lightning Address)</li>
                      <li>Follow the wallet&apos;s connection prompts</li>
                      <li>Verify your connection is successful</li>
                    </ol>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Send Your First Boost</h3>
                    <p className="mb-3">Support an artist with a Lightning payment:</p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-300">
                      <li>Find an album you enjoy</li>
                      <li>Click the ⚡ Boost button</li>
                      <li>Set your payment amount (minimum 1 satoshi)</li>
                      <li>Add your name and a message (optional)</li>
                      <li>Confirm the payment in your wallet</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            {/* Boostagrams */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/30">
              <h2 className="text-3xl font-bold mb-4 text-purple-400">💬 Boostagrams</h2>
              
              <p className="mb-4">
                <strong>Boostagrams</strong> are special messages sent with Lightning payments. They&apos;re like digital tips with personal messages that artists can see and respond to.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-black/70 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">📝 Message Features</h3>
                  <ul className="space-y-2 text-sm">
                    <li><strong>250 characters</strong> maximum</li>
                    <li><strong>Include your name</strong> (optional)</li>
                    <li><strong>Custom amount</strong> (you decide how much)</li>
                    <li><strong>Published to Nostr</strong> - shared on decentralized social networks</li>
                  </ul>
                </div>
                <div className="bg-black/70 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-3 text-green-400">🎯 Best Practices</h3>
                  <ul className="space-y-2 text-sm">
                    <li>Share what you love about the music</li>
                    <li>Ask questions or start conversations</li>
                    <li>Support artists you want to hear more from</li>
                    <li>Use boostagrams to discover new music</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-4">
                <h3 className="text-lg font-bold mb-2">💡 Pro Tip</h3>
                <p className="text-sm">
                  Boostagrams are published to Nostr relays, so other music lovers can see your messages and discover new artists. It&apos;s like a decentralized social network for music support!
                </p>
              </div>
            </div>

            {/* Value Splits */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/30">
              <h2 className="text-3xl font-bold mb-4 text-indigo-400">🎯 Value Splits & Multi-Recipient Payments</h2>
              
              <p className="mb-4">
                Some albums support <strong>automatic value splitting</strong> - your payment is automatically distributed to multiple recipients based on the artist&apos;s preferences.
              </p>

              <div className="space-y-4">
                <div className="bg-black/70 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">🎵 How Value Splits Work</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-2xl">🎤</span>
                      </div>
                      <h4 className="font-semibold text-blue-400 mb-1">Artist</h4>
                      <p className="text-sm">Gets majority of payment</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-2xl">🎹</span>
                      </div>
                      <h4 className="font-semibold text-green-400 mb-1">Collaborators</h4>
                      <p className="text-sm">Producers, musicians, etc.</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-2xl">⚡</span>
                      </div>
                      <h4 className="font-semibold text-purple-400 mb-1">Platform</h4>
                      <p className="text-sm">2 sats for development</p>
                    </div>
                  </div>
                </div>

                <div className="bg-black/70 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-3 text-green-400">📊 Transparency</h3>
                  <p className="text-sm mb-3">
                    You can see exactly where your payment goes before confirming:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                    <li>Artist receives: 80% of payment</li>
                    <li>Producer receives: 15% of payment</li>
                    <li>Platform fee: 2 sats (fixed)</li>
                    <li>Total: 100% of your payment</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Troubleshooting */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/30">
              <h2 className="text-3xl font-bold mb-4 text-red-400">🔧 Troubleshooting Lightning Payments</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">Connection Issues</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-300">
                    <li><strong>Wallet not connecting:</strong> Check that your wallet is online and NWC is enabled</li>
                    <li><strong>Invalid connection string:</strong> Ensure the connection string is complete and valid</li>
                    <li><strong>Try disconnecting and reconnecting:</strong> Sometimes a fresh connection helps</li>
                    <li><strong>Use different wallet:</strong> Try WebLN if NWC doesn&apos;t work, or vice versa</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-yellow-400">Payment Failures</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-300">
                    <li><strong>Insufficient balance:</strong> Ensure your wallet has enough Lightning balance</li>
                    <li><strong>Invoice expired:</strong> Try generating a new payment request</li>
                    <li><strong>Node offline:</strong> Recipient&apos;s Lightning node must be online</li>
                    <li><strong>Amount too small:</strong> Minimum payment is 1 satoshi</li>
                    <li><strong>Network congestion:</strong> Try again in a few minutes</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-green-400">Best Practices</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-300">
                    <li><strong>Start small:</strong> Test with 10-50 sats before larger payments</li>
                    <li><strong>Keep wallet updated:</strong> Use the latest version of your wallet</li>
                    <li><strong>Check node status:</strong> Ensure your Lightning node is synced</li>
                    <li><strong>Backup your wallet:</strong> Always backup your seed phrase</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Why Lightning Matters */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/30">
              <h2 className="text-3xl font-bold mb-4 text-yellow-400">🌟 Why Lightning Payments Matter</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/70 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">For Artists</h3>
                  <ul className="space-y-2 text-sm">
                    <li><strong>Direct support:</strong> No intermediaries taking cuts</li>
                    <li><strong>Global reach:</strong> Receive payments from anywhere</li>
                    <li><strong>Instant settlement:</strong> Money arrives in seconds</li>
                    <li><strong>Transparent:</strong> See exactly who supports you</li>
                    <li><strong>Fair compensation:</strong> Based on actual value received</li>
                  </ul>
                </div>
                <div className="bg-black/70 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-3 text-green-400">For Listeners</h3>
                  <ul className="space-y-2 text-sm">
                    <li><strong>Pay what it&apos;s worth:</strong> No fixed prices or subscriptions</li>
                    <li><strong>Support creators directly:</strong> Your money goes to artists</li>
                    <li><strong>Micro-payments:</strong> Support individual songs affordably</li>
                    <li><strong>Global access:</strong> Works anywhere with internet</li>
                    <li><strong>Privacy:</strong> No personal data required</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">⚡ Ready to Start Supporting Artists?</h2>
              <p className="text-lg mb-6">
                Connect your Lightning wallet and start sending boosts to support the music you love!
              </p>
              <div className="space-y-4">
                <Link 
                  href="/"
                  className="inline-block bg-white text-yellow-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  🎵 Start Boosting Now
                </Link>
                <div className="text-sm text-yellow-100">
                  <p><strong>Join the Value4Value revolution!</strong></p>
                  <p className="mt-2">⚡🎵</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
