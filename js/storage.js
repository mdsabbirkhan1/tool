// Storage Management System for ToolsHub

window.Storage = {
  // Initialize storage system
  init() {
    this.setupStorageKeys();
    this.migrateOldData();
    this.cleanExpiredData();
  },

  // Setup storage keys from config
  setupStorageKeys() {
    this.keys = CONFIG.STORAGE_KEYS;
  },

  // Migrate old data format if needed
  migrateOldData() {
    // Check for old data format and migrate if necessary
    const version = this.get('version', '1.0.0');
    if (version !== '1.0.0') {
      // Perform migration logic here
      this.set('version', '1.0.0');
    }
  },

  // Clean expired data
  cleanExpiredData() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('toolshub_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data.expires && Date.now() > data.expires) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          // Invalid data, remove it
          localStorage.removeItem(key);
        }
      }
    });
  },

  // Generic storage methods
  set(key, value, expires = null) {
    try {
      const data = {
        value,
        timestamp: Date.now(),
        expires: expires ? Date.now() + expires : null
      };
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Storage error:', e);
      return false;
    }
  },

  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;

      const data = JSON.parse(item);
      
      // Check expiration
      if (data.expires && Date.now() > data.expires) {
        localStorage.removeItem(key);
        return defaultValue;
      }

      return data.value;
    } catch (e) {
      console.error('Storage retrieval error:', e);
      return defaultValue;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Storage removal error:', e);
      return false;
    }
  },

  // Theme Management
  theme: {
    get() {
      return Storage.get(Storage.keys.THEME, CONFIG.DEFAULT_THEME);
    },

    set(theme) {
      Storage.set(Storage.keys.THEME, theme);
      document.documentElement.setAttribute('data-theme', theme);
      
      // Dispatch theme change event
      window.dispatchEvent(new CustomEvent('themeChanged', { 
        detail: { theme } 
      }));
    },

    toggle() {
      const currentTheme = this.get();
      const newTheme = currentTheme === CONFIG.THEMES.LIGHT ? 
        CONFIG.THEMES.DARK : CONFIG.THEMES.LIGHT;
      this.set(newTheme);
      return newTheme;
    }
  },

  // Usage Statistics
  usage: {
    get() {
      return Storage.get(Storage.keys.USAGE_STATS, {
        totalClicks: 0,
        toolsUsed: {},
        categoriesViewed: {},
        searchQueries: [],
        lastVisit: null,
        visitCount: 0,
        timeSpent: 0,
        favoriteCategories: [],
        mostUsedTools: []
      });
    },

    set(stats) {
      Storage.set(Storage.keys.USAGE_STATS, stats);
    },

    update(updates) {
      const current = this.get();
      const updated = { ...current, ...updates };
      this.set(updated);
      return updated;
    },

    trackToolClick(toolId, toolName, category) {
      const stats = this.get();
      
      // Update total clicks
      stats.totalClicks++;
      
      // Update tools used
      if (!stats.toolsUsed[toolId]) {
        stats.toolsUsed[toolId] = {
          name: toolName,
          category: category,
          count: 0,
          lastUsed: null
        };
      }
      stats.toolsUsed[toolId].count++;
      stats.toolsUsed[toolId].lastUsed = new Date().toISOString();
      
      // Update categories viewed
      if (!stats.categoriesViewed[category]) {
        stats.categoriesViewed[category] = 0;
      }
      stats.categoriesViewed[category]++;
      
      // Update most used tools (top 10)
      const toolsList = Object.entries(stats.toolsUsed)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      stats.mostUsedTools = toolsList;
      
      this.set(stats);
      
      // Dispatch usage event
      window.dispatchEvent(new CustomEvent('toolUsed', {
        detail: { toolId, toolName, category, stats }
      }));
    },

    trackSearch(query) {
      const stats = this.get();
      
      // Add to search queries (keep last 50)
      stats.searchQueries.unshift({
        query: query,
        timestamp: new Date().toISOString()
      });
      
      if (stats.searchQueries.length > 50) {
        stats.searchQueries = stats.searchQueries.slice(0, 50);
      }
      
      this.set(stats);
    },

    trackVisit() {
      const stats = this.get();
      stats.visitCount++;
      stats.lastVisit = new Date().toISOString();
      this.set(stats);
    },

    trackTimeSpent(seconds) {
      const stats = this.get();
      stats.timeSpent += seconds;
      this.set(stats);
    },

    getPopularTools(limit = 10) {
      const stats = this.get();
      return stats.mostUsedTools.slice(0, limit);
    },

    getPopularCategories(limit = 5) {
      const stats = this.get();
      return Object.entries(stats.categoriesViewed)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([category, count]) => ({ category, count }));
    },

    getRecentSearches(limit = 10) {
      const stats = this.get();
      return stats.searchQueries.slice(0, limit);
    }
  },

  // Favorites Management
  favorites: {
    get() {
      return Storage.get(Storage.keys.FAVORITES, []);
    },

    set(favorites) {
      Storage.set(Storage.keys.FAVORITES, favorites);
    },

    add(toolId, toolData) {
      const favorites = this.get();
      
      // Check if already exists
      if (favorites.find(fav => fav.id === toolId)) {
        return false;
      }
      
      favorites.push({
        id: toolId,
        name: toolData.name,
        category: toolData.category,
        icon: toolData.icon,
        link: toolData.link,
        addedAt: new Date().toISOString()
      });
      
      this.set(favorites);
      
      // Dispatch favorite added event
      window.dispatchEvent(new CustomEvent('favoriteAdded', {
        detail: { toolId, toolData }
      }));
      
      return true;
    },

    remove(toolId) {
      const favorites = this.get();
      const filtered = favorites.filter(fav => fav.id !== toolId);
      
      if (filtered.length !== favorites.length) {
        this.set(filtered);
        
        // Dispatch favorite removed event
        window.dispatchEvent(new CustomEvent('favoriteRemoved', {
          detail: { toolId }
        }));
        
        return true;
      }
      
      return false;
    },

    toggle(toolId, toolData) {
      if (this.isFavorite(toolId)) {
        return this.remove(toolId);
      } else {
        return this.add(toolId, toolData);
      }
    },

    isFavorite(toolId) {
      const favorites = this.get();
      return favorites.some(fav => fav.id === toolId);
    },

    count() {
      return this.get().length;
    },

    getByCategory(category) {
      const favorites = this.get();
      return favorites.filter(fav => fav.category === category);
    }
  },

  // Search History
  searchHistory: {
    get() {
      return Storage.get(Storage.keys.SEARCH_HISTORY, []);
    },

    set(history) {
      Storage.set(Storage.keys.SEARCH_HISTORY, history);
    },

    add(query) {
      if (!query || query.trim().length < 2) return;
      
      const history = this.get();
      const cleanQuery = query.trim().toLowerCase();
      
      // Remove if exists
      const filtered = history.filter(item => item.query !== cleanQuery);
      
      // Add to beginning
      filtered.unshift({
        query: cleanQuery,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 20 searches
      const limited = filtered.slice(0, 20);
      
      this.set(limited);
    },

    remove(query) {
      const history = this.get();
      const filtered = history.filter(item => item.query !== query);
      this.set(filtered);
    },

    clear() {
      this.set([]);
    },

    getRecent(limit = 10) {
      return this.get().slice(0, limit);
    }
  },

  // Cookie Consent
  cookieConsent: {
    get() {
      return Storage.get(Storage.keys.COOKIE_CONSENT, null);
    },

    set(consent) {
      const expirationDays = CONFIG.COOKIES.CONSENT_DURATION;
      const expires = expirationDays * 24 * 60 * 60 * 1000; // Convert to milliseconds
      Storage.set(Storage.keys.COOKIE_CONSENT, consent, expires);
    },

    hasConsented() {
      const consent = this.get();
      return consent !== null;
    },

    isAccepted() {
      return this.get() === true;
    },

    accept() {
      this.set(true);
      
      // Dispatch consent event
      window.dispatchEvent(new CustomEvent('cookieConsent', {
        detail: { accepted: true }
      }));
    },

    decline() {
      this.set(false);
      
      // Clear non-essential data
      this.clearNonEssential();
      
      // Dispatch consent event
      window.dispatchEvent(new CustomEvent('cookieConsent', {
        detail: { accepted: false }
      }));
    },

    clearNonEssential() {
      // Clear analytics and tracking data
      Storage.remove(Storage.keys.USAGE_STATS);
      Storage.remove(Storage.keys.SEARCH_HISTORY);
    }
  },

  // PWA Management
  pwa: {
    isDismissed() {
      return Storage.get(Storage.keys.PWA_DISMISSED, false);
    },

    dismiss() {
      Storage.set(Storage.keys.PWA_DISMISSED, true);
    },

    reset() {
      Storage.remove(Storage.keys.PWA_DISMISSED);
    }
  },

  // User Preferences
  preferences: {
    get() {
      return Storage.get(Storage.keys.USER_PREFERENCES, {
        viewMode: 'grid', // 'grid' or 'list'
        itemsPerPage: CONFIG.TOOLS_PER_PAGE,
        defaultSort: CONFIG.FILTERS.DEFAULT_SORT,
        showDescriptions: true,
        autoPlayVideos: false,
        reducedMotion: false,
        highContrast: false,
        fontSize: 'normal', // 'small', 'normal', 'large'
        language: 'en',
        notifications: {
          newTools: true,
          updates: true,
          newsletters: false
        }
      });
    },

    set(preferences) {
      Storage.set(Storage.keys.USER_PREFERENCES, preferences);
    },

    update(updates) {
      const current = this.get();
      const updated = { ...current, ...updates };
      this.set(updated);
      return updated;
    },

    get(key) {
      const prefs = this.get();
      return prefs[key];
    },

    setPreference(key, value) {
      const prefs = this.get();
      prefs[key] = value;
      this.set(prefs);
      
      // Dispatch preference change event
      window.dispatchEvent(new CustomEvent('preferenceChanged', {
        detail: { key, value, preferences: prefs }
      }));
    }
  },

  // Export and Import
  export: {
    all() {
      const data = {};
      Object.values(Storage.keys).forEach(key => {
        const value = Storage.get(key);
        if (value !== null) {
          data[key] = value;
        }
      });
      
      return {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        data: data
      };
    },

    favorites() {
      return {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        favorites: Storage.favorites.get()
      };
    },

    downloadAsFile(data, filename = 'toolshub-data.json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      
      URL.revokeObjectURL(url);
    }
  },

  import: {
    fromData(data) {
      try {
        if (!data.version || !data.data) {
          throw new Error('Invalid data format');
        }
        
        Object.entries(data.data).forEach(([key, value]) => {
          if (Object.values(Storage.keys).includes(key)) {
            Storage.set(key, value);
          }
        });
        
        return true;
      } catch (e) {
        console.error('Import error:', e);
        return false;
      }
    },

    fromFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            const success = this.fromData(data);
            resolve(success);
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
      });
    }
  },

  // Utilities
  utils: {
    getStorageSize() {
      let totalSize = 0;
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('toolshub_')) {
          totalSize += localStorage.getItem(key).length;
        }
      });
      return totalSize;
    },

    getStorageQuota() {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        return navigator.storage.estimate();
      }
      return Promise.resolve({ quota: null, usage: null });
    },

    clearAll() {
      Object.values(Storage.keys).forEach(key => {
        Storage.remove(key);
      });
    },

    backup() {
      return Storage.export.all();
    },

    restore(data) {
      return Storage.import.fromData(data);
    }
  }
};

// Initialize storage system when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  Storage.init();
  
  // Track visit
  if (CONFIG.ANALYTICS.ENABLED) {
    Storage.usage.trackVisit();
  }
  
  // Track time spent on page
  let startTime = Date.now();
  
  window.addEventListener('beforeunload', function() {
    if (CONFIG.ANALYTICS.ENABLED) {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      Storage.usage.trackTimeSpent(timeSpent);
    }
  });
  
  // Page visibility API for more accurate time tracking
  if (document.visibilityState !== undefined) {
    let lastVisibilityChange = Date.now();
    
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) {
        // Page is hidden, track time spent
        const timeSpent = Math.floor((Date.now() - lastVisibilityChange) / 1000);
        if (CONFIG.ANALYTICS.ENABLED && timeSpent > 0) {
          Storage.usage.trackTimeSpent(timeSpent);
        }
      } else {
        // Page is visible again
        lastVisibilityChange = Date.now();
      }
    });
  }
});

// Make Storage globally available
window.Storage = Storage;