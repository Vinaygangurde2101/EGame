type CacheItem<T> = {
  value: T;
  expiresAt: number;
};

class MemoryCache {
  private store = new Map<string, CacheItem<any>>();

  get<T>(key: string): T | null {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number = 2000): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  invalidatePattern(pattern: string): void {
    for (const key of this.store.keys()) {
      if (key.includes(pattern)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }
}

export const cache = new MemoryCache();
