// Feature flag configuration
export const FEATURES = {
  LIGHTNING: process.env.NEXT_PUBLIC_ENABLE_LIGHTNING !== 'false', // Default enabled unless explicitly disabled
  BITCOIN_CONNECT: process.env.NEXT_PUBLIC_ENABLE_LIGHTNING !== 'false', // Default enabled unless explicitly disabled
  BOOSTS: process.env.NEXT_PUBLIC_ENABLE_LIGHTNING !== 'false', // Default enabled unless explicitly disabled
  NOSTR: process.env.NEXT_PUBLIC_ENABLE_LIGHTNING !== 'false', // Default enabled unless explicitly disabled
} as const;

// Helper functions
export const isLightningEnabled = () => FEATURES.LIGHTNING;
export const isBitcoinConnectEnabled = () => FEATURES.BITCOIN_CONNECT;
export const isBoostsEnabled = () => FEATURES.BOOSTS;
export const isNostrEnabled = () => FEATURES.NOSTR;