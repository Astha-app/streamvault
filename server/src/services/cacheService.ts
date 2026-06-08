import type { UnrestrictResult } from '../../../shared/types/api';

interface CacheEntry {
  data: UnrestrictResult;
  expiresAt: number; // Unix ms
}

/**
 * In-memory cache for resolved Real-Debrid links.
 * TTL is configurable via REALDEBRID_CACHE_TTL_MINUTES env var.
 *
 * NOTE: This is an in-process cache; it resets on server restart.
 * For production, swap with Redis or a persistent store.
 */
class RealDebridCacheService {
  private store = new Map<string, CacheEntry>();
  private ttlMs: number;

  constructor() {
    const ttlMinutes = parseInt(process.env.REALDEBRID_CACHE_TTL_MINUTES || '60', 10);
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  get(link: string): UnrestrictResult | null {
    const entry = this.store.get(link);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(link);
      return null;
    }
    return entry.data;
  }

  set(link: string, data: UnrestrictResult): void {
    const expiresAt = Date.now() + this.ttlMs;
    this.store.set(link, { data: { ...data, expiresAt: new Date(expiresAt).toISOString() }, expiresAt });
  }

  delete(link: string): void {
    this.store.delete(link);
  }

  clear(): void {
    this.store.clear();
  }

  status(): { count: number; keys: string[] } {
    this.evictExpired();
    return {
      count: this.store.size,
      // Only return non-sensitive keys (the original input link, not the download URL)
      keys: Array.from(this.store.keys()),
    };
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }
}

export const cacheService = new RealDebridCacheService();
