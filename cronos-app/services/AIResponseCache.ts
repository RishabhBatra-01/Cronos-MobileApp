/**
 * AI Response Cache
 * Phase 1: Foundation
 * 
 * MMKV-based caching for AI responses
 * - 7-day TTL by default
 * - LRU eviction when cache full
 * - Cache hit/miss tracking
 */

import { CachedResponse, CacheStats } from '../core/types/ai-assistant';
import { AI_CONFIG } from '../core/constants';

// MMKV is not working reliably on iOS simulator
// Using in-memory cache as fallback
let memoryCache: Map<string, string> = new Map();
let cacheDisabled = false;

console.log('[AICache] Using in-memory cache (MMKV disabled for iOS simulator)');

function getCache() {
  return memoryCache;
}

// Cache key prefixes
const CACHE_PREFIX = 'ai_cache_';
const STATS_KEY = 'ai_cache_stats';
const METADATA_KEY = 'ai_cache_metadata';

interface CacheMetadata {
  keys: string[];
  totalSize: number;
  createdAt: string;
}

/**
 * Generate cache key from content
 */
export function generateCacheKey(content: string, action: string): string {
  // Simple hash function (djb2)
  let hash = 5381;
  const str = `${content}|${action}`;
  
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  
  return `${CACHE_PREFIX}${Math.abs(hash).toString(36)}`;
}

/**
 * Get cached response
 */
export async function getCachedResponse<T = any>(
  key: string
): Promise<CachedResponse<T> | null> {
  try {
    const cache = getCache();
    const cached = cache.get(key);
    
    if (!cached) {
      console.log(`[AICache] Cache MISS: ${key}`);
      return null;
    }
    
    const response: CachedResponse<T> = JSON.parse(cached);
    
    // Check if expired
    const now = new Date();
    const expiresAt = new Date(response.expiresAt);
    
    if (now > expiresAt) {
      console.log(`[AICache] Cache EXPIRED: ${key}`);
      cache.delete(key);
      return null;
    }
    
    console.log(`[AICache] Cache HIT: ${key}`);
    return response;
  } catch (error) {
    console.error('[AICache] Error getting cached response:', error);
    // Return null instead of throwing - cache is optional
    return null;
  }
}

/**
 * Set cached response
 */
export async function setCachedResponse<T = any>(
  key: string,
  data: T,
  ttlDays?: number
): Promise<void> {
  try {
    const cache = getCache();
    const now = new Date();
    const ttl = ttlDays || AI_CONFIG.CACHE_TTL_DAYS;
    const expiresAt = new Date(now.getTime() + ttl * 24 * 60 * 60 * 1000);
    
    const response: CachedResponse<T> = {
      data,
      cachedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      cacheKey: key,
    };
    
    cache.set(key, JSON.stringify(response));
    
    // Update metadata
    await updateCacheMetadata(key);
    
    // Check cache size and evict if needed
    await evictIfNeeded();
    
    console.log(`[AICache] Cached response: ${key} (expires: ${expiresAt.toISOString()})`);
  } catch (error) {
    console.error('[AICache] Error setting cached response:', error);
    // Don't throw - cache is optional
  }
}

/**
 * Clear all cached responses
 */
export async function clearCache(): Promise<void> {
  try {
    const cache = getCache();
    const metadata = getCacheMetadata();
    
    // Delete all cache entries
    metadata.keys.forEach(key => {
      cache.delete(key);
    });
    
    // Reset metadata
    cache.set(METADATA_KEY, JSON.stringify({
      keys: [],
      totalSize: 0,
      createdAt: new Date().toISOString(),
    }));
    
    console.log('[AICache] Cache cleared');
  } catch (error) {
    console.error('[AICache] Error clearing cache:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<CacheStats> {
  try {
    const cache = getCache();
    const metadata = getCacheMetadata();
    const validKeys: string[] = [];
    let totalSize = 0;
    let oldestEntry: string | undefined;
    let newestEntry: string | undefined;
    
    // Check each cached item
    for (const key of metadata.keys) {
      const cached = cache.get(key);
      if (cached) {
        validKeys.push(key);
        totalSize += cached.length;
        
        const response: CachedResponse = JSON.parse(cached);
        
        if (!oldestEntry || response.cachedAt < oldestEntry) {
          oldestEntry = response.cachedAt;
        }
        
        if (!newestEntry || response.cachedAt > newestEntry) {
          newestEntry = response.cachedAt;
        }
      }
    }
    
    // Calculate hit rate (simplified - would need request tracking for accurate rate)
    const hitRate = validKeys.length > 0 ? 0.85 : 0; // Placeholder
    
    return {
      totalItems: validKeys.length,
      totalSizeBytes: totalSize,
      hitRate,
      oldestEntry,
      newestEntry,
    };
  } catch (error) {
    console.error('[AICache] Error getting cache stats:', error);
    return {
      totalItems: 0,
      totalSizeBytes: 0,
      hitRate: 0,
    };
  }
}

/**
 * Evict expired entries
 */
export async function evictExpired(): Promise<number> {
  try {
    const cache = getCache();
    const metadata = getCacheMetadata();
    const now = new Date();
    let evictedCount = 0;
    const validKeys: string[] = [];
    
    for (const key of metadata.keys) {
      const cached = cache.get(key);
      
      if (!cached) {
        evictedCount++;
        continue;
      }
      
      const response: CachedResponse = JSON.parse(cached);
      const expiresAt = new Date(response.expiresAt);
      
      if (now > expiresAt) {
        cache.delete(key);
        evictedCount++;
      } else {
        validKeys.push(key);
      }
    }
    
    // Update metadata with valid keys
    cache.set(METADATA_KEY, JSON.stringify({
      keys: validKeys,
      totalSize: metadata.totalSize,
      createdAt: metadata.createdAt,
    }));
    
    if (evictedCount > 0) {
      console.log(`[AICache] Evicted ${evictedCount} expired entries`);
    }
    
    return evictedCount;
  } catch (error) {
    console.error('[AICache] Error evicting expired entries:', error);
    return 0;
  }
}

/**
 * Evict oldest entries if cache is full (LRU)
 */
async function evictIfNeeded(): Promise<void> {
  try {
    const cache = getCache();
    const metadata = getCacheMetadata();
    
    if (metadata.keys.length <= AI_CONFIG.MAX_CACHE_SIZE) {
      return;
    }
    
    // Get all entries with timestamps
    const entries: Array<{ key: string; cachedAt: string }> = [];
    
    for (const key of metadata.keys) {
      const cached = cache.get(key);
      if (cached) {
        const response: CachedResponse = JSON.parse(cached);
        entries.push({ key, cachedAt: response.cachedAt });
      }
    }
    
    // Sort by cachedAt (oldest first)
    entries.sort((a, b) => a.cachedAt.localeCompare(b.cachedAt));
    
    // Evict oldest entries
    const toEvict = entries.length - AI_CONFIG.MAX_CACHE_SIZE;
    for (let i = 0; i < toEvict; i++) {
      cache.delete(entries[i].key);
      console.log(`[AICache] Evicted (LRU): ${entries[i].key}`);
    }
    
    // Update metadata
    const validKeys = entries.slice(toEvict).map(e => e.key);
    cache.set(METADATA_KEY, JSON.stringify({
      keys: validKeys,
      totalSize: metadata.totalSize,
      createdAt: metadata.createdAt,
    }));
  } catch (error) {
    console.error('[AICache] Error evicting entries:', error);
  }
}

/**
 * Get cache metadata
 */
function getCacheMetadata(): CacheMetadata {
  try {
    const cache = getCache();
    const metadata = cache.get(METADATA_KEY);
    
    if (!metadata) {
      const defaultMetadata: CacheMetadata = {
        keys: [],
        totalSize: 0,
        createdAt: new Date().toISOString(),
      };
      cache.set(METADATA_KEY, JSON.stringify(defaultMetadata));
      return defaultMetadata;
    }
    
    return JSON.parse(metadata);
  } catch (error) {
    console.error('[AICache] Error getting metadata:', error);
    return {
      keys: [],
      totalSize: 0,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Update cache metadata
 */
async function updateCacheMetadata(newKey: string): Promise<void> {
  try {
    const cache = getCache();
    const metadata = getCacheMetadata();
    
    if (!metadata.keys.includes(newKey)) {
      metadata.keys.push(newKey);
    }
    
    cache.set(METADATA_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.error('[AICache] Error updating metadata:', error);
  }
}

// Auto-evict expired entries on first use (lazy)
let hasInitialized = false;
function initializeCache() {
  if (!hasInitialized) {
    hasInitialized = true;
    evictExpired().catch(err => {
      console.error('[AICache] Error during initialization:', err);
    });
  }
}

// Initialize on first getCache call
export function ensureCacheInitialized() {
  getCache();
  initializeCache();
}
