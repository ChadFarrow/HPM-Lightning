// Utility to resolve Lightning node pubkeys to Lightning Addresses using a public mapping
// Source mapping: https://github.com/ericpp/keysend-to-lnaddress/blob/master/node_to_addresses_mapping.json

type PubkeyToAddressMap = Record<string, string | string[]>;

interface CachedMap {
  data: PubkeyToAddressMap;
  timestamp: number;
}

const RAW_MAPPING_URL = 'https://raw.githubusercontent.com/ericpp/keysend-to-lnaddress/master/node_to_addresses_mapping.json';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

let inMemoryCache: CachedMap | null = null;

async function fetchMapping(): Promise<PubkeyToAddressMap> {
  // Use in-memory cache first
  if (inMemoryCache && Date.now() - inMemoryCache.timestamp < CACHE_TTL_MS) {
    return inMemoryCache.data;
  }

  try {
    // Start with our local mapping file
    let localMapping: PubkeyToAddressMap = {};
    try {
      const localMappingModule = await import('../data/lightning-recipients-mapping.json');
      const localData = localMappingModule.default || localMappingModule;
      
      // Extract nodeToLightningAddress mapping
      if (localData.nodeToLightningAddress) {
        Object.entries(localData.nodeToLightningAddress).forEach(([key, value]) => {
          if (typeof value === 'string') {
            localMapping[key.toLowerCase()] = value;
          }
        });
        console.log(`🏠 Loaded ${Object.keys(localMapping).length} local Lightning address mappings`);
      }
    } catch (localError) {
      console.warn('⚠️ Could not load local Lightning address mapping:', localError);
    }

    // Fetch external mapping and merge
    const response = await fetch(RAW_MAPPING_URL, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`Failed to fetch mapping: ${response.status}`);
    }
    const json = (await response.json()) as PubkeyToAddressMap;

    // Normalize external values to single string (prefer the first if array)
    const externalMapping: PubkeyToAddressMap = {};
    Object.entries(json).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        externalMapping[key.toLowerCase()] = value[0];
      } else if (typeof value === 'string') {
        externalMapping[key.toLowerCase()] = value;
      }
    });

    console.log(`🌐 Loaded ${Object.keys(externalMapping).length} external Lightning address mappings`);

    // Merge mappings - local takes precedence over external
    const combined: PubkeyToAddressMap = {
      ...externalMapping,
      ...localMapping // Local mappings override external ones
    };

    console.log(`✨ Combined total: ${Object.keys(combined).length} Lightning address mappings (${Object.keys(localMapping).length} local priority)`);

    inMemoryCache = { data: combined, timestamp: Date.now() };
    // Also persist to localStorage for client environments
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('pubkey_lnaddr_map', JSON.stringify(inMemoryCache));
      }
    } catch {}

    return combined;
  } catch (error) {
    // Try local mapping only if external fails
    try {
      const localMappingModule = await import('../data/lightning-recipients-mapping.json');
      const localData = localMappingModule.default || localMappingModule;
      
      const localOnlyMapping: PubkeyToAddressMap = {};
      if (localData.nodeToLightningAddress) {
        Object.entries(localData.nodeToLightningAddress).forEach(([key, value]) => {
          if (typeof value === 'string') {
            localOnlyMapping[key.toLowerCase()] = value;
          }
        });
        console.log(`🏠 Fallback: Using ${Object.keys(localOnlyMapping).length} local mappings only`);
        
        inMemoryCache = { data: localOnlyMapping, timestamp: Date.now() };
        return localOnlyMapping;
      }
    } catch {}

    // Attempt to load from localStorage if everything fails (client only)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cached = window.localStorage.getItem('pubkey_lnaddr_map');
        if (cached) {
          const parsed = JSON.parse(cached) as CachedMap;
          if (parsed && parsed.data) {
            inMemoryCache = parsed;
            return parsed.data;
          }
        }
      }
    } catch {}

    // As a last resort, return empty map
    return {} as PubkeyToAddressMap;
  }
}

export async function resolveLightningAddressForPubkey(pubkey: string): Promise<string | null> {
  if (!pubkey || pubkey.length < 66) return null;
  const map = await fetchMapping();
  const key = pubkey.toLowerCase();
  const value = map[key];
  if (!value) return null;
  // Basic sanity check that value looks like a Lightning address
  if (typeof value === 'string' && value.includes('@')) return value;
  return null;
}

export async function upgradeRecipientsWithDirectory<T extends { address: string; type?: string; name?: string }>(
  recipients: T[]
): Promise<T[]> {
  const upgraded = await Promise.all(
    recipients.map(async (r) => {
      const isLikelyPubkey = r.address && r.address.length === 66 && !r.address.includes('@');
      if ((r.type === 'node' || !r.type) && isLikelyPubkey) {
        try {
          const lnaddr = await resolveLightningAddressForPubkey(r.address);
          if (lnaddr) {
            return {
              ...r,
              type: 'lnaddress',
              address: lnaddr,
              // preserve original for debugging/use as fallback if needed by caller
              // @ts-ignore - attach non-typed helper field without leaking into external API
              originalAddress: r.address,
              name: r.name || lnaddr.split('@')[0]
            } as T;
          }
        } catch {}
      }
      return r;
    })
  );
  return upgraded;
}


