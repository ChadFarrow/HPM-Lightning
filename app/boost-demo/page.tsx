'use client';

import { useState } from 'react';
import { BoostButton } from '@/components/BoostButton';
import { BoostFeed } from '@/components/BoostFeed';
import { Zap, Music, Radio, Info, Code } from 'lucide-react';
import type { TrackMetadata } from '@/lib/boost-to-nostr-service';

export default function BoostDemo() {
  const [selectedTrack, setSelectedTrack] = useState<TrackMetadata | null>(null);

  // Example tracks for demo with podcast metadata
  const exampleTracks: TrackMetadata[] = [
    {
      title: 'Thunder Road',
      artist: 'Bruce Springsteen',
      album: 'Born to Run',
      url: 'https://example.com/thunder-road',
      timestamp: 125,
      duration: 290,
      podcastFeedGuid: 'feed-guid-123',
      itemGuid: 'episode-guid-456',
      feedUrl: 'https://example.com/feed.xml'
    },
    {
      title: 'Stairway to Heaven', 
      artist: 'Led Zeppelin',
      album: 'Led Zeppelin IV',
      url: 'https://example.com/stairway',
      timestamp: 240,
      duration: 482,
      podcastFeedGuid: 'feed-guid-789',
      itemGuid: 'episode-guid-101',
      feedUrl: 'https://example.com/zeppelin-feed.xml'
    },
    {
      title: 'Bohemian Rhapsody',
      artist: 'Queen', 
      album: 'A Night at the Opera',
      url: 'https://example.com/bohemian',
      timestamp: 180,
      duration: 354,
      podcastFeedGuid: 'feed-guid-112',
      itemGuid: 'episode-guid-131',
      feedUrl: 'https://example.com/queen-feed.xml'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
            <Zap className="w-10 h-10 text-yellow-500" />
            Boost to Nostr Demo
          </h1>
          <p className="text-gray-400 text-lg">
            Post track boosts directly to Nostr with Lightning zaps
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="space-y-2 text-sm text-gray-300">
              <p>
                <strong>Podcast Boost System</strong> - Using the same system as Fountain:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Kind 9735</strong> zap receipts for payments</li>
                <li><strong>Kind 1</strong> notes for comments/replies</li>
                <li><strong>NIP-73 i tags</strong> with podcast feed + episode GUIDs</li>
                <li>Queryable by any client using feed/item GUIDs</li>
              </ul>
              <p className="mt-2">
                This allows any podcast app to discover and display boosts for episodes across the network.
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Track Selection */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Music className="w-5 h-5 text-purple-500" />
              Select a Track to Boost
            </h2>
            
            <div className="space-y-3">
              {exampleTracks.map((track, index) => (
                <div
                  key={index}
                  className={`bg-gray-900 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedTrack?.title === track.title
                      ? 'ring-2 ring-yellow-500 bg-gray-800'
                      : 'hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedTrack(track)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{track.title}</h3>
                      <p className="text-sm text-gray-400">{track.artist}</p>
                      {track.album && (
                        <p className="text-xs text-gray-500 mt-1">{track.album}</p>
                      )}
                      {track.timestamp !== undefined && track.duration !== undefined && (
                        <div className="mt-2">
                          <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-yellow-500 h-full"
                              style={{ width: `${(track.timestamp / track.duration) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {Math.floor(track.timestamp / 60)}:{(track.timestamp % 60).toString().padStart(2, '0')} / 
                            {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                          </p>
                        </div>
                      )}
                    </div>
                    {selectedTrack?.title === track.title && (
                      <div className="ml-4 flex items-center gap-2">
                        <span className="text-xs text-yellow-500 font-medium">Selected</span>
                        <BoostButton 
                          track={track}
                          className="!px-3 !py-1.5 text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {selectedTrack && (
              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Boost "{selectedTrack.title}"
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Click the button below to post a boost to Nostr
                </p>
                <BoostButton 
                  track={selectedTrack}
                  showHistory={true}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Live Boost Feed */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Radio className="w-5 h-5 text-green-500" />
              Live Boost Feed
            </h2>
            
            <BoostFeed
              trackFilter={selectedTrack ? { 
                title: selectedTrack.title, 
                artist: selectedTrack.artist 
              } : undefined}
              showLive={false}
              limit={20}
            />
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-12 bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Code className="w-5 h-5 text-green-500" />
            How It Works
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-300">
            <div>
              <h4 className="font-medium text-white mb-2">Boost Creation</h4>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>User selects track and boost amount</li>
                <li>Optional comment is added</li>
                <li>System generates Nostr event with metadata</li>
                <li>Event is signed with user\'s Nostr key</li>
                <li>Posted to multiple relays for redundancy</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-2">Podcast Boost Event Structure</h4>
              <pre className="bg-gray-800 p-3 rounded-lg overflow-x-auto text-xs">
{`{
  "kind": 1,
  "content": "Great episode, love this part!\\n\\n#boost #music #podcast",
  "tags": [
    ["t", "boost"],
    ["t", "music"],
    ["t", "podcast"],
    ["i", "podcast:guid:feed-guid-123", "https://example.com/feed.xml"],
    ["i", "podcast:item:guid:episode-guid-456", "https://example.com/episode"],
    ["e", "zap_receipt_event_id", "", "zap"],
    ["client", "ITDV-Lightning"]
  ]
}`}
              </pre>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-400">
              💡 <strong>Integration Tip:</strong> Add the BoostButton component to any track player 
              to enable instant Nostr boosts with full metadata tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}