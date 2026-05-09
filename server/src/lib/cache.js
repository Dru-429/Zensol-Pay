import NodeCache from 'node-cache';

// One shared in-memory cache for the whole API process.
// Note: This is per-node-process (won't share across multiple server instances).
export const cache = new NodeCache({
  stdTTL: 20,
  checkperiod: 60,
  useClones: false,
});

export async function getOrSet(cacheKey, ttlSeconds, loader) {
  const hit = cache.get(cacheKey);
  if (hit !== undefined) return hit;
  const value = await loader();
  cache.set(cacheKey, value, ttlSeconds);
  return value;
}

export function delKeys(keys) {
  for (const k of keys) {
    if (k) cache.del(k);
  }
}
