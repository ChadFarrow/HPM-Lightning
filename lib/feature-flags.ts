// Feature flag configuration
export const FEATURES = {
  LIGHTNING: process.env.NEXT_PUBLIC_ENABLE_LIGHTNING === 'true',
  BITCOIN_CONNECT: process.env.NEXT_PUBLIC_ENABLE_LIGHTNING === 'true',
  BOOSTS: process.env.NEXT_PUBLIC_ENABLE_LIGHTNING === 'true',
  NOSTR: process.env.NEXT_PUBLIC_ENABLE_LIGHTNING === 'true',
} as const;

// Helper functions
export const isLightningEnabled = () => FEATURES.LIGHTNING;
export const isBitcoinConnectEnabled = () => FEATURES.BITCOIN_CONNECT;
export const isBoostsEnabled = () => FEATURES.BOOSTS;
export const isNostrEnabled = () => FEATURES.NOSTR;