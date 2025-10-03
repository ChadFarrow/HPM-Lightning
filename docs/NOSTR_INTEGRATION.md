# Nostr Integration Features

This document outlines the Nostr integration features implemented in HPM Lightning.

## Overview

The Nostr integration provides enhanced user experience for Nostr users while maintaining RSS as the core foundation. This hybrid approach focuses on user acquisition and quality-of-life improvements.

## Features Implemented

### 1. Nostr Authentication System ✅
- **File**: `lib/nostr-auth-service.ts`
- **Purpose**: Handle Nostr key validation, signing, and user authentication
- **Features**:
  - Key pair generation and validation
  - Message signing for authentication
  - User profile fetching from Nostr relays
  - Session management with encrypted key storage

### 2. Nostr User Context ✅
- **File**: `contexts/NostrUserContext.tsx`
- **Purpose**: Manage authenticated Nostr user state across the app
- **Features**:
  - User authentication status
  - Profile data (followers, following, web of trust)
  - Auto-NWC configuration for authenticated users
  - Integration with existing Lightning context

### 3. Nostr Login Component ✅
- **File**: `components/NostrLogin.tsx`
- **Purpose**: User interface for Nostr authentication
- **Features**:
  - Key import (nsec/npub)
  - Key generation option
  - Authentication flow with signing
  - Integration with existing login systems

### 4. Enhanced NWC Integration ✅
- **File**: `lib/enhanced-nwc-service.ts`
- **Purpose**: Auto-configure NWC for authenticated Nostr users
- **Features**:
  - Detect NWC capability from Nostr profile
  - Auto-populate connection strings
  - Enhanced payment metadata with Nostr profile info
  - Social proof integration

### 5. Nostr Settings Page ✅
- **File**: `app/nostr-settings/page.tsx`
- **Purpose**: Centralized Nostr configuration
- **Features**:
  - Authentication status
  - Profile management
  - NWC connection management
  - Social data display

### 6. Nostr User Indicator ✅
- **File**: `components/NostrUserIndicator.tsx`
- **Purpose**: Display Nostr user status in header
- **Features**:
  - User profile display
  - Quick access to settings
  - Social stats (followers/following)
  - Logout functionality

### 7. Media Auto-posting ✅
- **File**: `lib/nostr-media-service.ts`
- **Purpose**: Handle media posting to Nostr
- **Features**:
  - Song/video posting with metadata
  - Embedding support for Nostr clients
  - Auto-play functionality
  - Boost posts with Lightning integration

### 8. Nostr Media Post Component ✅
- **File**: `components/NostrMediaPost.tsx`
- **Purpose**: User interface for media posting
- **Features**:
  - Post current track to Nostr
  - Custom message and hashtags
  - Multiple post types (regular, embedded, boost)
  - Preview before posting

## Integration Points

### Layout Integration
- **File**: `app/layout.tsx`
- Added `NostrUserProvider` to the provider chain
- Maintains existing functionality while adding Nostr features

### Header Integration
- **File**: `components/Header.tsx`
- Added `NostrUserIndicatorWithLogout` component
- Shows Nostr user status and provides quick access

## Usage

### For Users
1. Navigate to `/nostr-settings` to sign in with Nostr
2. Import existing keys or generate new ones
3. Access enhanced features like auto-NWC configuration
4. Post media directly to Nostr from the app

### For Developers
1. Use `useNostrUser()` hook to access Nostr user state
2. Use `useNostrAuth()` hook for authentication status
3. Use `useNostrNWC()` hook for NWC integration
4. Import services for advanced functionality

## Technical Details

### Authentication Flow
1. User provides Nostr key (nsec or npub)
2. System validates key format and structure
3. For private keys: creates and signs authentication challenge
4. Fetches user profile and social data from Nostr relays
5. Stores encrypted session data locally

### NWC Integration
1. Detects NWC capability from user profile
2. Checks for Lightning addresses and NWC service connections
3. Auto-configures NWC connection when possible
4. Enhances payment metadata with Nostr profile info

### Media Posting
1. Creates Nostr-compliant media posts
2. Supports multiple post types (regular, embedded, boost)
3. Publishes to multiple Nostr relays
4. Includes rich metadata for client embedding

## Security Considerations

- Private keys are encrypted and stored locally
- Session data expires after 24 hours
- Authentication challenges include timestamps and nonces
- All Nostr operations use proper signing and validation

## Future Enhancements

- Real-time Nostr feed integration
- Advanced social features (mutual follows, recommendations)
- Enhanced media embedding with autoplay
- Cross-platform synchronization

## Dependencies

- `nostr-tools`: Core Nostr functionality
- `@getalby/bitcoin-connect`: Lightning wallet integration
- Existing HPM Lightning infrastructure

## Testing

All components include error handling and fallback mechanisms. The system gracefully degrades when Nostr features are unavailable, maintaining full RSS functionality.
