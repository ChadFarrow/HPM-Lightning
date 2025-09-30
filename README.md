# Music Platform Template

A Lightning Network-powered Value4Value music platform template for bands and artists with existing RSS feeds. Built with Next.js, featuring instant Bitcoin payments, Nostr integration, and Podcasting 2.0 support.

## Quick Start

1. **Clone and install:**
   ```bash
   git clone [your-repo-url]
   cd [your-repo-name]
   npm install
   ```

2. **Configure your band:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your band information
   # Edit data/feeds.json with your RSS feed URLs
   ```

3. **Start development:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   Navigate to `http://localhost:3000`

## Configuration

### Requirements
- Existing RSS feeds with Podcasting 2.0 value tags
- Lightning payment info already configured in your feeds
- At least one album or publisher feed

### Setup Steps
1. Copy `.env.example` to `.env.local`
2. Update environment variables with your band name and information
3. Edit `data/feeds.json` with your RSS feed URLs
4. Add your own logo files to `/public/` directory
5. Update `public/manifest.json` with your app details
6. Customize colors and branding in `tailwind.config.js`

### Environment Variables
```bash
NEXT_PUBLIC_BAND_NAME="Your Band Name"
NEXT_PUBLIC_BAND_SLUG="your-band-slug"
NEXT_PUBLIC_SITE_TITLE="Your Site Title"
# See .env.example for full list
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test-feeds` - Test RSS feed parsing
- `npm run auto-add-publishers` - Auto-generate publisher feeds

## Features

### Core Functionality
- **Lightning Network Payments**: Instant Bitcoin payments via Bitcoin Connect
- **Value4Value Model**: Support artists directly with Lightning zaps and value splits
- **Auto Boost System**: Automatic payments when songs complete (with NWC integration)
- **Boostagrams**: Custom messages with Lightning boost payments
- **Nostr Integration**: NIP-57/NIP-73 compliant boost notes published to Nostr relays
- **Multi-Payment Recipients**: Automatic splitting to multiple Lightning addresses and nodes
- **RSS Feed Parsing**: Dynamic parsing of album and publisher feeds
- **Audio Streaming**: Full-featured audio player with playlist support
- **Progressive Web App (PWA)**: Install on mobile devices

### User Experience
- **Responsive Design**: Optimized for all screen sizes
- **Dark Theme**: Elegant dark interface throughout
- **Mobile-First**: Touch-friendly controls and navigation
- **Boost Modal System**: Elegant popup modals for Lightning payments
- **Smooth Animations**: Polished transitions and hover effects

## Architecture

- **Frontend**: Next.js 15.4.3 with TypeScript and App Router
- **Data Source**: RSS feeds with Podcasting 2.0 value tags (no database required)
- **Styling**: Tailwind CSS with custom components and dark theme
- **Audio Engine**: Custom AudioContext with HLS.js support
- **Lightning Integration**: Bitcoin Connect with WebLN and NWC support
- **Payment Methods**: Lightning addresses, node keysends, and multi-recipient splits
- **Nostr Integration**: NIP-57/NIP-73 boost notes with automatic relay publishing

## Content Structure

### Feed Types
- **Album Feeds**: Individual album or EP releases
- **Publisher Feeds**: Consolidated feeds for all releases from an artist/label

### Requirements
- RSS feeds must include Podcasting 2.0 `<podcast:value>` tags
- Lightning payment splits must be configured in feeds
- Valid audio enclosures (MP3 or supported formats)

## Lightning Network & Value4Value

### Payment Features
- **Bitcoin Connect Integration**: WebLN and NWC wallet support
- **Multi-Recipient Payments**: Automatic splitting to artists, collaborators, and platform
- **Lightning Addresses**: Full LNURL support for email-style Lightning payments
- **Node Keysends**: Direct payments to Lightning node public keys
- **Value Splits**: Podcasting 2.0 value tag parsing for payment distribution

### Nostr Integration
- **Boost Notes**: NIP-57/NIP-73 compliant boost posts to Nostr relays
- **Relay Publishing**: Automatic posting to major Nostr relays
- **Profile Integration**: Nostr profile links and metadata

### Supported Payment Methods
- **WebLN**: Browser extension wallets (Alby, Zeus, etc.)
- **NWC (Nostr Wallet Connect)**: Alby Hub, Mutiny, and other NWC-compatible wallets
- **Lightning Addresses**: user@getalby.com, user@strike.me, etc.
- **Node Pubkeys**: Direct keysend to Lightning node addresses

## API Endpoints

### Album Data
- `GET /api/albums-static-cached` - Cached album data (fast)
- `GET /api/albums-no-db` - Fresh album data (dynamic parsing)
- `GET /api/album/[id]` - Single album endpoint

### Feed Management
- **RSS Cache Location**: `/data/rss-cache/`
- **Feed Configuration**: `/data/feeds.json`
- **Static Data**: `/data/static/albums.json`

## Customization

### Branding
1. Replace logo files in `/public/` directory
2. Update `public/manifest.json` with your app details
3. Customize colors in `tailwind.config.js`
4. Update metadata in `app/layout.tsx`

### Content
1. Add your RSS feed URLs to `data/feeds.json`
2. Update about page content in `app/about/page.tsx`
3. Customize guide pages in `/app/*-guide/` directories

### Styling
- Tailwind CSS configuration in `tailwind.config.js`
- Global styles in `app/globals.css`
- Component styles throughout `/components/` directory

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on git push

### Other Platforms
- Supports any Node.js hosting platform
- Build with `npm run build`
- Start with `npm run start`

## Troubleshooting

### Missing Albums
If albums are not displaying:
1. Check RSS cache: `ls -la data/rss-cache/`
2. Clear cache: `rm -rf data/rss-cache/*`
3. Test feeds: `npm run test-feeds`

### Lightning Payment Issues
- **Wallet not connecting**: Check Bitcoin Connect status and wallet compatibility
- **Payment failures**: Verify Lightning address validity and node connectivity
- **NWC issues**: Confirm Nostr Wallet Connect string and relay connectivity

### RSS Feed Issues
- **Invalid feeds**: Check feed URLs and Podcasting 2.0 value tag format
- **Rate limiting**: Built-in retry logic with exponential backoff
- **Cache problems**: Clear browser cache and RSS cache directory

## Contributing

### Adding New Content
1. Add RSS feed URL to `/data/feeds.json`
2. Test feed parsing with `npm run test-feeds`
3. Verify content appears in development
4. Test Lightning payments and value splits

### Development
- Use TypeScript for type safety
- Follow Next.js best practices
- Test on both desktop and mobile devices
- Verify PWA functionality

## License

Open source - customize for your band's needs.

## Support

This is a template for bands to create their own Value4Value music platforms. Customize it with your own branding, RSS feeds, and Lightning payment information.