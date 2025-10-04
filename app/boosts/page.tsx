'use client';

import { useState, useEffect } from 'react';
import { getBoostToNostrService } from '@/lib/boost-to-nostr-service';
import { type Event } from 'nostr-tools';
import { nip19, SimplePool } from 'nostr-tools';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface ParsedBoost {
  id: string;
  author: string;
  authorNpub: string;
  authorName?: string;  // Display name of the user
  content: string;
  userMessage?: string;  // User's custom message/comment
  amount?: string;
  trackTitle?: string;
  trackArtist?: string;
  trackAlbum?: string;
  timestamp: number;
  tags: string[][];
  url?: string;
  isFromApp?: boolean;  // Whether the boost was sent from this app
  replies?: ParsedReply[];
}

interface ParsedReply {
  id: string;
  author: string;
  authorNpub: string;
  authorName?: string;
  content: string;
  timestamp: number;
  replies?: ParsedReply[];  // Nested replies for threading
  depth?: number;          // Depth level for indentation
}

async function parseBoostFromEvent(event: Event): Promise<ParsedBoost | null> {
  try {
    // Extract amount from content (looking for "⚡ X sats")
    const amountMatch = event.content.match(/⚡\s*([\d.]+[MkK]?)\s*sats/);
    const amount = amountMatch ? amountMatch[1] : undefined;

    // Extract track info from content
    const titleMatch = event.content.match(/"([^"]+)"/);
    let trackTitle = titleMatch ? titleMatch[1] : undefined;

    // Look for track artist after "by" (but not "Sent by")
    let trackArtist: string | undefined;
    const artistMatches = event.content.match(/\sby:?\s+([^\n]+)/g);
    if (artistMatches) {
      for (const match of artistMatches) {
        if (!match.includes('Sent by')) {
          const artistMatch = match.match(/by:?\s+(.+?)(?=\n|$)/);
          if (artistMatch) {
            trackArtist = artistMatch[1].trim();
            break;
          }
        }
      }
    }

    // Look for sender after "Sent by" - be more flexible with whitespace and line endings
    const sentByMatch = event.content.match(/Sent\s+by:?\s+(.+?)(?=\n|$|🎧|nostr:)/i);
    let trackAlbum = sentByMatch ? sentByMatch[1].trim() : undefined;

    // Extract URL from content (both HPM format and Fountain format)
    let url = event.content.match(/🎧\s*(https?:\/\/[^\s]+)/)?.[1];
    if (!url) {
      // Try to extract any fountain.fm or other podcast URLs
      url = event.content.match(/(https?:\/\/[^\s]+)/)?.[1];
    }

    // For Fountain-style boosts, extract episode info from URL or tags
    if (!trackTitle && url?.includes('fountain.fm')) {
      // Check if there's an i tag with episode info
      const itemGuidTag = event.tags.find(tag =>
        tag[0] === 'i' && tag[1]?.includes('podcast:item:guid')
      );
      const podcastGuidTag = event.tags.find(tag =>
        tag[0] === 'i' && tag[1]?.includes('podcast:guid')
      );

      if (itemGuidTag && itemGuidTag[2]) {
        // Use the fountain URL from the tag
        url = itemGuidTag[2];
      }

      // Try to fetch metadata from nevent reference
      const neventMatch = event.content.match(/nostr:(nevent1[a-zA-Z0-9]+)/);
      if (neventMatch) {
        try {
          const neventString = neventMatch[1];
          const decoded = nip19.decode(neventString);

          if (decoded.type === 'nevent') {
            const neventData = decoded.data;
            // Fetch the referenced event to get metadata
            const pool = new SimplePool();
            const relays = [
              'wss://relay.primal.net',
              'wss://relay.fountain.fm',
              'wss://relay.nostr.band'
            ];

            const referencedEvents = await pool.querySync(relays, {
              ids: [neventData.id],
              limit: 1
            });

            pool.close(relays);

            if (referencedEvents.length > 0) {
              const refEvent = referencedEvents[0];
              // Try to extract title from referenced event content
              const refTitleMatch = refEvent.content.match(/"([^"]+)"/);
              if (refTitleMatch) {
                trackTitle = refTitleMatch[1];
              } else {
                // Use first line of referenced event
                const firstLine = refEvent.content.split('\n')[0]?.trim();
                if (firstLine && firstLine.length < 100 && !firstLine.startsWith('http')) {
                  trackTitle = firstLine;
                }
              }
            }
          }
        } catch (error) {
          console.warn('Failed to decode nevent reference:', error);
        }
      }

      // Extract type from URL (episode, show, album)
      let contentType = 'Episode';
      if (url?.includes('/show/')) {
        contentType = 'Show';
      } else if (url?.includes('/album/')) {
        contentType = 'Album';
      } else if (url?.includes('/episode/')) {
        contentType = 'Episode';
      }

      // If still no title, try other methods
      if (!trackTitle) {
        // Try to extract any quoted text from content as title
        const quotedText = event.content.match(/"([^"]+)"/)?.[1];

        // Extract the first line of content as potential title (before URL)
        const contentLines = event.content.split('\n');
        const firstLine = contentLines[0]?.trim();

        // Use content first line, quoted text, or fallback
        if (firstLine && firstLine.length > 0 && firstLine.length < 100 && !firstLine.startsWith('http')) {
          trackTitle = firstLine;
        } else {
          trackTitle = quotedText || `Fountain ${contentType}`;
        }
      }

      trackArtist = 'via Fountain';

      // Try to get show name from show URL
      if (podcastGuidTag && podcastGuidTag[2]) {
        // Extract show ID from URL and use as album reference
        const showId = podcastGuidTag[2].split('/').pop();
        if (showId && showId.length > 5) {
          trackAlbum = `Fountain Show`;
        }
      }
    }

    // Extract user message (text that isn't metadata)
    let userMessage: string | undefined = event.content;

    // Remove the standard boost formatting to get user's custom message
    userMessage = userMessage.replace(/⚡\s*[\d.]+[MkK]?\s*sats/, '').trim();
    // Remove bullet point that comes after the amount
    userMessage = userMessage.replace(/^•\s*/, '').trim();
    if (trackTitle) {
      userMessage = userMessage.replace(new RegExp(`"${trackTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'), '').trim();
    }
    if (trackArtist) {
      userMessage = userMessage.replace(new RegExp(`by\\s+${trackArtist.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), '').trim();
    }
    if (trackAlbum) {
      userMessage = userMessage.replace(new RegExp(`Sent\\s+by:?\\s*${trackAlbum.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi'), '').trim();
    }
    // Remove "From: [album name] " prefix - keep only the user's actual message
    userMessage = userMessage.replace(/^From:\s*.*?\s+([A-Z][a-z]+)/, '$1').trim();
    userMessage = userMessage.replace(/🎧\s*https?:\/\/[^\s]+/, '').trim();
    userMessage = userMessage.replace(/nostr:[a-zA-Z0-9]+/, '').trim();
    userMessage = userMessage.replace(/\n+/g, ' ').trim();
    // Remove any remaining bullet points and formatting artifacts
    userMessage = userMessage.replace(/^[•·\-\*\s]+|[•·\-\*\s]+$/g, '').trim();

    // If there's no meaningful message left, set to undefined
    if (!userMessage || userMessage.length < 3) {
      userMessage = undefined;
    }

    // Create npub from pubkey
    const authorNpub = nip19.npubEncode(event.pubkey);

    // Try to get author name from profile tags (this would need to be fetched separately in a real implementation)
    const authorName = event.pubkey.substring(0, 8) + '...'; // Fallback to truncated pubkey


    return {
      id: event.id,
      author: event.pubkey,
      authorNpub,
      authorName,
      content: event.content,
      userMessage,
      amount,
      trackTitle,
      trackArtist,
      trackAlbum,
      timestamp: event.created_at,
      tags: event.tags,
      url
    };
  } catch (error) {
    console.error('Error parsing boost event:', error);
    return null;
  }
}

async function fetchUserProfile(pubkey: string): Promise<string | undefined> {
  try {
    const pool = new SimplePool();
    const relays = [
      'wss://relay.primal.net',
      'wss://relay.snort.social',
      'wss://relay.nostr.band',
      'wss://relay.fountain.fm',
      'wss://relay.damus.io',
      'wss://chadf.nostr1.com'
    ];

    const profiles = await pool.querySync(relays, {
      kinds: [0], // Metadata events
      authors: [pubkey],
      limit: 1
    });

    if (profiles.length > 0) {
      const metadata = JSON.parse(profiles[0].content);
      return metadata.display_name || metadata.name || undefined;
    }

    pool.close(relays);
    return undefined;
  } catch (error) {
    console.warn('Failed to fetch user profile:', error);
    return undefined;
  }
}

function buildThreadedReplies(events: any[], rootEventId: string): ParsedReply[] {
  // Create a map of event ID to reply object
  const replyMap = new Map<string, ParsedReply>();
  const childrenMap = new Map<string, string[]>(); // parent ID -> child IDs

  // First pass: create all reply objects
  for (const event of events) {
    const reply: ParsedReply = {
      id: event.id,
      author: event.pubkey,
      authorNpub: nip19.npubEncode(event.pubkey),
      content: event.content,
      timestamp: event.created_at,
      replies: [],
      depth: 0
    };
    replyMap.set(event.id, reply);
  }

  // Second pass: build parent-child relationships
  for (const event of events) {
    const eTags = event.tags.filter((tag: string[]) => tag[0] === 'e');

    // Find the parent this reply is responding to
    let parentId = rootEventId; // Default to root

    // Look for the most recent 'e' tag which usually indicates the direct parent
    if (eTags.length > 0) {
      // The last e tag is typically the direct parent being replied to
      parentId = eTags[eTags.length - 1][1];
    }

    // Add this reply as a child of its parent
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    childrenMap.get(parentId)!.push(event.id);
  }

  // Third pass: build the threaded structure recursively
  function buildChildren(parentId: string, depth: number): ParsedReply[] {
    const children = childrenMap.get(parentId) || [];
    const result: ParsedReply[] = [];

    for (const childId of children) {
      const reply = replyMap.get(childId);
      if (reply) {
        reply.depth = depth;
        reply.replies = buildChildren(childId, depth + 1);
        result.push(reply);
      }
    }

    // Sort by timestamp (oldest first for chronological order)
    result.sort((a, b) => a.timestamp - b.timestamp);
    return result;
  }

  // Start with direct replies to the root event
  return buildChildren(rootEventId, 0);
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (days > 7) {
    return date.toLocaleDateString();
  } else if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return 'just now';
  }
}

// Recursive component for displaying threaded replies
function ThreadedReply({ reply, maxDepth = 3 }: { reply: ParsedReply; maxDepth?: number }) {
  const indentLevel = Math.min(reply.depth || 0, maxDepth);
  const marginLeft = indentLevel * 16; // 16px per level

  return (
    <div
      style={{ marginLeft: `${marginLeft}px` }}
      className={reply.depth && reply.depth > 0 ? 'border-l border-gray-700 pl-4' : ''}
    >
      <div className="bg-gray-900/50 rounded-lg p-4 mb-3">
        <div className="flex flex-col gap-2">
          {/* Reply content */}
          <div className="text-gray-300 text-sm break-words">
            {reply.content}
          </div>

          {/* Reply metadata */}
          <div className="flex flex-wrap gap-3 text-xs">
            <a
              href={`https://primal.net/p/${reply.author}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition"
            >
              {reply.authorName || `${reply.authorNpub.slice(0, 12)}...`}
            </a>
            <span className="text-gray-500">
              {formatTimestamp(reply.timestamp)}
            </span>
            <a
              href={`https://primal.net/e/${reply.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 transition"
            >
              View reply
            </a>
            {reply.depth !== undefined && reply.depth < maxDepth && (
              <span className="text-gray-600 text-xs">
                Level {reply.depth + 1}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {reply.replies && reply.replies.length > 0 && (
        <div className="mt-2">
          {reply.replies.map((nestedReply) => (
            <ThreadedReply
              key={nestedReply.id}
              reply={nestedReply}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function BoostsPage() {
  const [boosts, setBoosts] = useState<ParsedBoost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBoosts, setExpandedBoosts] = useState<Set<string>>(new Set());
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const [lastCacheTime, setLastCacheTime] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  const loadBoosts = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first (cache for 10 minutes)
      const cacheKey = 'all_boosts_cache';
      const cacheTimeKey = 'all_boosts_cache_time';
      const cacheValidDuration = 10 * 60 * 1000; // 10 minutes

      if (!forceRefresh) {
        const cachedData = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(cacheTimeKey);

        if (cachedData && cachedTime) {
          const timeSinceCache = Date.now() - parseInt(cachedTime);
          if (timeSinceCache < cacheValidDuration) {
            const parsedBoosts = JSON.parse(cachedData);
            console.log(`✅ Loading ${parsedBoosts.length} boosts from cache - data is fresh`, parsedBoosts);
            setBoosts(parsedBoosts);
            setLastCacheTime(parseInt(cachedTime));
            setLoading(false);
            return;
          }
        }
      }

      const service = getBoostToNostrService();
      const pool = new SimplePool();
      const relays = [
        'wss://relay.primal.net',
        'wss://relay.snort.social',
        'wss://relay.nostr.band',
        'wss://relay.fountain.fm',
        'wss://relay.damus.io',
        'wss://nos.lol'
      ];

      // Fetch boosts from HPM Lightning app specifically
      let allBoosts: any[] = [];

      try {
        console.log('🔍 Fetching all boosts from the network...');

        // Your Nostr pubkey from the boost you sent
        const yourPubkey = 'f7922a0adb3fa4dda5eecaa62f6f7ee6159f7f55e08036686c68e08382c34788';

        // Try multiple queries to find boosts
        const queries = [
          // Query 1: Events from your pubkey with image tag (indicates boost from HPM)
          pool.querySync(relays, {
            kinds: [1],
            authors: [yourPubkey],
            '#imeta': [''],
            limit: 100
          }),
          // Query 2: All recent events from your pubkey
          pool.querySync(relays, {
            kinds: [1],
            authors: [yourPubkey],
            limit: 100
          }),
          // Query 3: Events with 'r' tag (reference - your boosts use this)
          pool.querySync(relays, {
            kinds: [1],
            authors: [yourPubkey],
            '#r': [''],
            limit: 100
          })
        ];

        const results = await Promise.all(queries.map(q =>
          Promise.race([
            q,
            new Promise<[]>((_, reject) =>
              setTimeout(() => reject(new Error('Query timeout')), 10000)
            )
          ]).catch(err => {
            console.warn('Query failed:', err);
            return [];
          })
        ));

        // Combine and deduplicate results
        const seenIds = new Set();
        allBoosts = results.flat().filter(event => {
          if (seenIds.has(event.id)) return false;
          seenIds.add(event.id);
          return true;
        });

        console.log(`✅ Found ${allBoosts.length} potential boost events from ${results.map(r => r.length).join(', ')} queries`);
        pool.close(relays);
      } catch (error) {
        console.error('❌ Failed to fetch boosts:', error);
        allBoosts = [];
        pool.close(relays);
      }

      // Parse boosts and fetch replies progressively
      const parsedBoosts: ParsedBoost[] = [];
      let actualBoostCount = 0;

      // Process each boost and immediately fetch its replies
      for (let i = 0; i < allBoosts.length; i++) {
        const event = allBoosts[i];
        const parsedBoost = await parseBoostFromEvent(event);

        if (parsedBoost) {
          // Check if this event has podcast tags (for Fountain boosts) or boost-like content
          const hasPodcastTags = event.tags.some(tag =>
            (tag[0] === 'k' && tag[1]?.includes('podcast')) ||
            (tag[0] === 'i' && tag[1]?.includes('podcast'))
          );
          const hasBoostContent = parsedBoost.amount && event.content.includes('🎧');
          const isFountainBoost = hasPodcastTags && event.content.includes('fountain.fm');

          // Accept if it has boost content OR is a Fountain boost
          if (!hasBoostContent && !isFountainBoost) {
            continue; // Skip non-boost events
          }

          // Count as actual boost if it has the metadata
          if (parsedBoost.trackTitle || parsedBoost.trackArtist || isFountainBoost) {
            actualBoostCount++;
          }

          parsedBoost.isFromApp = true;
          parsedBoost.replies = []; // Start with empty replies
          parsedBoosts.push(parsedBoost);

          // Sort and update the display immediately after adding each boost
          const sortedBoosts = [...parsedBoosts].sort((a, b) => {
            const timeA = a.timestamp || 0;
            const timeB = b.timestamp || 0;
            return timeB - timeA;
          });

          setBoosts(sortedBoosts);
          setLoading(false); // Set loading to false after first boost

          // Start reply fetching in the background for first 5 boosts only (for faster loading)
          if (i < 5) {
            // Don't await - fetch replies in background
            setTimeout(async () => {
              try {
                // Use a shorter timeout for reply fetching
                const timeoutPromise = new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error('Reply fetch timeout')), 3000)
                );

                const replies = await Promise.race([
                  service.fetchReplies(parsedBoost.id, 10), // Reduced limit
                  timeoutPromise
                ]);

                if (replies.length > 0) {
                  console.log(`Found ${replies.length} replies for boost ${parsedBoost.id.substring(0, 8)}`);
                }

                if (replies.length > 0) {
                  // Map replies and fetch user profiles
                  const mappedReplies = await Promise.all(replies.map(async reply => {
                    const authorName = await fetchUserProfile(reply.pubkey);
                    return {
                      id: reply.id,
                      author: reply.pubkey,
                      authorNpub: nip19.npubEncode(reply.pubkey),
                      authorName: authorName || reply.pubkey.substring(0, 8) + '...', // Fallback to truncated key
                      content: reply.content,
                      timestamp: reply.created_at,
                      depth: 0,
                      replies: []
                    };
                  }));

                  // Update the specific boost with replies
                  setBoosts(prev => prev.map(b =>
                    b.id === parsedBoost.id ? { ...b, replies: mappedReplies } : b
                  ));
                }
              } catch (error) {
                console.warn('Failed to fetch replies for boost:', parsedBoost.id, error);
              }
            }, i * 100); // Stagger requests by 100ms each
          }
        }
      }

      // Cache the results after processing
      const currentTime = Date.now();

      // Wait a bit for replies to be fetched before caching
      setTimeout(() => {
        setBoosts(currentBoosts => {
          // Cache the current state with any replies that have been loaded
          localStorage.setItem(cacheKey, JSON.stringify(currentBoosts));
          localStorage.setItem(cacheTimeKey, currentTime.toString());
          setLastCacheTime(currentTime);
          console.log(`Cached ${currentBoosts.length} boosts with replies`);
          return currentBoosts;
        });
      }, 5000); // Wait 5 seconds for replies to load

      console.log(`Processed ${parsedBoosts.length} total events, ${actualBoostCount} actual boosts with caching enabled`);
    } catch (err) {
      console.error('Error loading boosts:', err);
      setError('Failed to load boosts from Nostr relays');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadBoosts();

    // Set up real-time subscription for new boosts from anyone
    const service = getBoostToNostrService();

    try {
      // Subscribe to new boosts from all users
      const subscription = service.subscribeToBoosts(
        {}, // No specific filter - get all boosts
        {
          onBoost: async (event) => {
            // Only process if it has podcast metadata (is an actual boost)
            const hasPodcastTags = event.tags.some(tag =>
              (tag[0] === 'k' && (tag[1] === 'podcast:guid' || tag[1] === 'podcast:item:guid' || tag[1] === 'podcast:publisher:guid')) ||
              (tag[0] === 'i' && tag[1]?.startsWith('podcast:'))
            );

            if (!hasPodcastTags) return;

            const parsedBoost = await parseBoostFromEvent(event);
            const isFountainBoost = event.content.includes('fountain.fm');

            // Accept HPM boosts (with amount) or Fountain boosts
            if (parsedBoost && ((parsedBoost.amount && (parsedBoost.trackTitle || parsedBoost.trackArtist)) || isFountainBoost)) {
              // Fetch threaded replies for real-time boost
              try {
                const threadedReplies = await service.fetchThreadedReplies(event.id, 3, 20);
                const mappedReplies = buildThreadedReplies(threadedReplies, event.id);

                // Recursively enrich replies with user profiles
                const enrichRepliesWithProfiles = async (replies: ParsedReply[]): Promise<ParsedReply[]> => {
                  return Promise.all(replies.map(async reply => {
                    const authorName = await fetchUserProfile(reply.author);
                    const enrichedReply = { ...reply, authorName };

                    // Recursively enrich nested replies
                    if (reply.replies && reply.replies.length > 0) {
                      enrichedReply.replies = await enrichRepliesWithProfiles(reply.replies);
                    }

                    return enrichedReply;
                  }));
                };

                const enrichedReplies = await enrichRepliesWithProfiles(mappedReplies);
                parsedBoost.replies = enrichedReplies;
              } catch (error) {
                console.warn('Failed to fetch threaded replies for real-time boost:', event.id, error);
                parsedBoost.replies = [];
              }

              setBoosts(prev => {
                // Check if boost already exists
                const exists = prev.some(b => b.id === parsedBoost.id);
                if (exists) return prev;

                // Add new boost to the beginning and sort by timestamp
                const updated = [parsedBoost, ...prev];
                return updated.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
              });
            }
          },
          onError: (err) => {
            console.error('Real-time boost subscription error:', err);
            setIsRealTimeActive(false);
          }
        }
      );

      setIsRealTimeActive(true);

      // Cleanup subscription on unmount
      return () => {
        if (subscription && typeof subscription.close === 'function') {
          subscription.close();
        }
        setIsRealTimeActive(false);
      };
    } catch (error) {
      console.error('Failed to set up real-time subscription:', error);
    }
  }, []);

  const filteredBoosts = boosts;

  // Calculate statistics
  const totalBoosts = boosts.length;
  // Since we're only pulling from the app's npub, all events should be boosts
  const actualBoosts = boosts.length;
  const totalSats = boosts.reduce((sum, boost) => {
    if (!boost.amount) return sum;

    let sats = 0;
    const amount = boost.amount;

    if (amount.endsWith('M')) {
      sats = parseFloat(amount.slice(0, -1)) * 1000000;
    } else if (amount.endsWith('k') || amount.endsWith('K')) {
      sats = parseFloat(amount.slice(0, -1)) * 1000;
    } else {
      sats = parseFloat(amount);
    }

    // Debug: Log unusual amounts for verification
    if (sats > 100000 || isNaN(sats)) {
      console.log(`Unusual sats amount: "${amount}" -> ${sats} for boost:`, boost.id.substring(0, 8));
    }

    return sum + (isNaN(sats) ? 0 : sats);
  }, 0);

  const toggleBoostExpansion = (boostId: string) => {
    setExpandedBoosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(boostId)) {
        newSet.delete(boostId);
      } else {
        newSet.add(boostId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Override parent layout background */}
      <style jsx global>{`
        body {
          background: linear-gradient(to bottom, rgb(17, 24, 39), rgb(0, 0, 0)) !important;
        }
        .min-h-screen.bg-gray-50 {
          background: transparent !important;
        }
      `}</style>
        <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-start mb-4">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
              <span>Back</span>
            </Link>
          </div>
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              ⚡ Boosts
            </h1>
          </div>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <p className="text-gray-400">
                Lightning boosts from anyone using this site
              </p>
              {isRealTimeActive && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Live Updates
                </div>
              )}
            </div>

            {mounted && (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => loadBoosts(true)}
                    className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition"
                  >
                    🔄 Refresh
                  </button>
                  <button
                    onClick={() => {
                      localStorage.removeItem('all_boosts_cache');
                      localStorage.removeItem('all_boosts_cache_time');
                      loadBoosts(true);
                    }}
                    className="px-4 py-2 bg-red-900/50 text-red-400 rounded-lg hover:bg-red-800/50 transition text-sm"
                  >
                    🗑️ Clear Cache
                  </button>
                </div>
                {lastCacheTime && (
                  <div className="text-xs text-gray-500">
                    Cached {formatTimestamp(Math.floor(lastCacheTime / 1000))}
                  </div>
                )}
              </div>
            )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm">
            <div className="text-2xl font-bold text-yellow-400">{actualBoosts}</div>
            <div className="text-gray-400">Actual Boosts</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm">
            <div className="text-2xl font-bold text-orange-400">
              {totalSats.toLocaleString()} sats
            </div>
            <div className="text-gray-400">Total Value</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm">
            <div className="text-xl font-bold text-gray-400">{totalBoosts}</div>
            <div className="text-gray-500 text-sm">Total Events</div>
          </div>
        </div>


        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-400">Loading boosts from Nostr relays...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => loadBoosts(true)}
              className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Try Again
            </button>
          </div>
        ) : filteredBoosts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-xl mb-2">No boosts found</p>
            <p className="text-sm">
              Be the first to send a boost!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBoosts.map((boost) => (
              <div
                key={boost.id}
                className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 hover:bg-gray-800/70 transition"
              >
                <div className="flex flex-col gap-4">
                  {/* Boost Info */}
                  <div className="flex-1">
                    {/* Amount - Always on its own line for mobile */}
                    {boost.amount && (
                      <div className="mb-3">
                        <span className="text-2xl font-bold text-yellow-400">
                          ⚡ {boost.amount} sats
                        </span>
                      </div>
                    )}

                    {/* Track Title - On its own line */}
                    {boost.trackTitle && (
                      <div className="mb-2">
                        <span className="text-lg text-white font-medium">
                          &ldquo;{boost.trackTitle}&rdquo;
                        </span>
                      </div>
                    )}

                    {/* Artist and Album - Better spacing */}
                    {(boost.trackArtist || boost.trackAlbum) && (
                      <div className="text-gray-400 mb-4 space-y-1">
                        {boost.trackArtist && (
                          <div className="text-base">by {boost.trackArtist}</div>
                        )}
                        {boost.trackAlbum && (
                          <div className="text-sm">Sent by: {boost.trackAlbum}</div>
                        )}
                      </div>
                    )}

                    {/* User Message */}
                    {boost.userMessage && (
                      <div className="mb-3">
                        <div className="text-gray-300 italic bg-gray-800/30 rounded-lg p-3 border-l-2 border-blue-400/50">
                          &ldquo;{boost.userMessage}&rdquo;
                        </div>
                      </div>
                    )}

                    {/* Links and Actions - Mobile-optimized */}
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3 items-center">
                      {boost.url && (
                        <a
                          href={boost.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-400 hover:text-orange-300 transition text-sm font-medium py-1"
                        >
                          🎧 Listen
                        </a>
                      )}
                      <a
                        href={`https://primal.net/e/${boost.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 transition text-sm py-1"
                      >
                        View on Nostr
                      </a>
                      <a
                        href={`https://primal.net/p/${boost.author}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition text-sm py-1"
                      >
                        Profile
                      </a>

                      {/* Show replies button if there are replies */}
                      {boost.replies && boost.replies.length > 0 && (
                        <button
                          onClick={() => toggleBoostExpansion(boost.id)}
                          className="text-gray-400 hover:text-gray-300 transition flex items-center gap-1 text-sm py-1"
                        >
                          💬 {boost.replies.length} {boost.replies.length === 1 ? 'reply' : 'replies'}
                          <span className="text-xs ml-1">
                            {expandedBoosts.has(boost.id) ? '▼' : '▶'}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Timestamp - Below actions on mobile */}
                    <div className="text-gray-500 text-sm mt-3 pt-2 border-t border-gray-700/50">
                      {formatTimestamp(boost.timestamp)}
                    </div>
                  </div>
                </div>

                {/* Threaded Replies Section */}
                {boost.replies && boost.replies.length > 0 && expandedBoosts.has(boost.id) && (
                  <div className="mt-4 border-l-2 border-gray-700 pl-4">
                    <div className="text-sm text-gray-400 font-semibold mb-3">
                      Replies ({boost.replies.length}):
                    </div>
                    <div className="space-y-2">
                      {boost.replies.map((reply) => (
                        <ThreadedReply
                          key={reply.id}
                          reply={reply}
                          maxDepth={3}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}