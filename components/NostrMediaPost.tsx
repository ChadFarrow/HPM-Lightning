'use client';

import React, { useState } from 'react';
import { useNostrUser } from '@/contexts/NostrUserContext';
import { nostrMediaService, type MediaPost } from '@/lib/nostr-media-service';
import { 
  Share2, 
  Music, 
  Video, 
  Mic, 
  Hash, 
  MessageCircle, 
  Send,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface NostrMediaPostProps {
  media: MediaPost;
  onSuccess?: (eventId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function NostrMediaPost({ media, onSuccess, onError, className = '' }: NostrMediaPostProps) {
  const { user, isAuthenticated } = useNostrUser();
  const [message, setMessage] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [newHashtag, setNewHashtag] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postResult, setPostResult] = useState<{ success: boolean; eventId?: string; error?: string } | null>(null);
  const [postType, setPostType] = useState<'regular' | 'embedded' | 'boost'>('regular');
  const [boostAmount, setBoostAmount] = useState(1000);

  if (!isAuthenticated || !user) {
    return (
      <div className={`p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-md ${className}`}>
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Sign in with Nostr to post media
          </p>
        </div>
      </div>
    );
  }

  const addHashtag = () => {
    if (newHashtag.trim() && !hashtags.includes(newHashtag.trim())) {
      setHashtags([...hashtags, newHashtag.trim()]);
      setNewHashtag('');
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter(t => t !== tag));
  };

  const handlePost = async () => {
    if (!user) return;

    setIsPosting(true);
    setPostResult(null);

    try {
      // Get user's secret key from session
      const session = localStorage.getItem('nostr_user_session');
      if (!session) {
        throw new Error('No user session found');
      }

      const parsedSession = JSON.parse(session);
      if (!parsedSession.hasSecretKey) {
        throw new Error('No secret key available for posting');
      }

      const encryptedKey = localStorage.getItem('nostr_secret_key');
      if (!encryptedKey) {
        throw new Error('No encrypted secret key found');
      }

      const keyBytes = atob(encryptedKey);
      const secretKey = new Uint8Array(keyBytes.split('').map(c => c.charCodeAt(0)));

      let result;
      
      switch (postType) {
        case 'embedded':
          result = await nostrMediaService.postEmbeddedMedia(
            media,
            message,
            hashtags,
            secretKey
          );
          break;
        case 'boost':
          result = await nostrMediaService.postMediaBoost(
            media,
            boostAmount,
            message,
            secretKey
          );
          break;
        default:
          result = await nostrMediaService.postMedia(
            media,
            message,
            hashtags,
            secretKey
          );
      }

      setPostResult(result);
      
      if (result.success) {
        onSuccess?.(result.eventId!);
      } else {
        onError?.(result.error || 'Failed to post');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setPostResult({ success: false, error: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsPosting(false);
    }
  };

  const getMediaIcon = () => {
    switch (media.type) {
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'podcast':
        return <Mic className="w-5 h-5" />;
      default:
        return <Music className="w-5 h-5" />;
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-4">
        {getMediaIcon()}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Post to Nostr
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Share {media.title} by {media.artist} with your Nostr followers
          </p>
        </div>
      </div>

      {/* Media Preview */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
        <div className="flex items-center space-x-3">
          {media.imageUrl && (
            <img
              src={media.imageUrl}
              alt={media.title}
              className="w-12 h-12 rounded object-cover"
            />
          )}
          <div className="flex-1">
            <p className="font-medium text-gray-900 dark:text-white">{media.title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{media.artist}</p>
            {media.album && (
              <p className="text-xs text-gray-500 dark:text-gray-500">{media.album}</p>
            )}
          </div>
        </div>
      </div>

      {/* Post Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Post Type
        </label>
        <div className="flex space-x-2">
          <button
            onClick={() => setPostType('regular')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              postType === 'regular'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Regular Post
          </button>
          <button
            onClick={() => setPostType('embedded')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              postType === 'embedded'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Embedded Media
          </button>
          <button
            onClick={() => setPostType('boost')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              postType === 'boost'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Boost Post
          </button>
        </div>
      </div>

      {/* Boost Amount (for boost posts) */}
      {postType === 'boost' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Boost Amount (sats)
          </label>
          <input
            type="number"
            value={boostAmount}
            onChange={(e) => setBoostAmount(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
            placeholder="1000"
          />
        </div>
      )}

      {/* Message */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a message about this track..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm resize-none"
          rows={3}
        />
      </div>

      {/* Hashtags */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Hashtags
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {hashtags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-sm"
            >
              <Hash className="w-3 h-3" />
              <span>{tag}</span>
              <button
                onClick={() => removeHashtag(tag)}
                className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            value={newHashtag}
            onChange={(e) => setNewHashtag(e.target.value)}
            placeholder="Add hashtag..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
            onKeyPress={(e) => e.key === 'Enter' && addHashtag()}
          />
          <button
            onClick={addHashtag}
            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Post Result */}
      {postResult && (
        <div className={`mb-4 p-3 rounded-md ${
          postResult.success 
            ? 'bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700'
            : 'bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700'
        }`}>
          <div className="flex items-center space-x-2">
            {postResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
            <p className={`text-sm ${
              postResult.success 
                ? 'text-green-800 dark:text-green-200'
                : 'text-red-800 dark:text-red-200'
            }`}>
              {postResult.success 
                ? `Posted successfully! Event ID: ${postResult.eventId}`
                : `Failed to post: ${postResult.error}`
              }
            </p>
          </div>
        </div>
      )}

      {/* Post Button */}
      <button
        onClick={handlePost}
        disabled={isPosting}
        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPosting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        <span>
          {isPosting 
            ? 'Posting...' 
            : postType === 'boost' 
              ? `Post Boost (${boostAmount} sats)`
              : 'Post to Nostr'
          }
        </span>
      </button>

      {/* User Info */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Posting as:</span>
          {user.profile?.picture ? (
            <img
              src={user.profile.picture}
              alt={user.profile.name || 'Profile'}
              className="w-4 h-4 rounded-full"
            />
          ) : (
            <div className="w-4 h-4 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <Music className="w-2 h-2 text-purple-600 dark:text-purple-400" />
            </div>
          )}
          <span>{user.profile?.name || user.npub.substring(0, 8) + '...'}</span>
        </div>
      </div>
    </div>
  );
}
