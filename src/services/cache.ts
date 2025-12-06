const CACHE_PREFIX = 'thumma_cache_';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours (though we refresh on load anyway)

interface CacheItem<T> {
    data: T;
    timestamp: number;
}

export const cacheService = {
    save: <T>(key: string, data: T) => {
        try {
            const item: CacheItem<T> = {
                data,
                timestamp: Date.now(),
            };
            const serialized = JSON.stringify(item);
            // Only cache if size is reasonable (< 5MB)
            if (serialized.length < 5 * 1024 * 1024) {
                localStorage.setItem(CACHE_PREFIX + key, serialized);
            } else {
                console.warn(`Cache item ${key} too large (${(serialized.length / 1024 / 1024).toFixed(2)}MB), skipping`);
            }
        } catch (error) {
            console.warn('Failed to save to cache:', error);
            // If quota exceeded, try to clear old cache items
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                console.warn('Storage quota exceeded, clearing cache');
                cacheService.clearAll();
            }
        }
    },

    load: <T>(key: string): T | null => {
        try {
            const itemStr = localStorage.getItem(CACHE_PREFIX + key);
            if (!itemStr) return null;

            const item: CacheItem<T> = JSON.parse(itemStr);
            // We could check expiry here, but since we always fetch fresh data 
            // in the background, we can be lenient with stale data for initial render.
            return item.data;
        } catch (error) {
            console.warn('Failed to load from cache:', error);
            return null;
        }
    },

    clear: (key: string) => {
        localStorage.removeItem(CACHE_PREFIX + key);
    },

    clearAll: () => {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    }
};

export const CACHE_KEYS = {
    PRODUCTS: 'products',
    CUSTOMERS: 'customers',
    SUPPLIERS: 'suppliers',
    CATEGORIES: 'categories',
    STORE_SETTINGS: 'store_settings',
    USERS: 'users',
    STORE_CREDITS: 'store_credits'
};
