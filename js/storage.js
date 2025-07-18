// Storage Manager - Handles local storage operations
class StorageManager {
    constructor() {
        this.storageKeys = {
            toolUsage: 'tools-usage',
            userPreferences: 'user-preferences',
            searchHistory: 'search-history',
            favoriteTools: 'favorite-tools',
            recentTools: 'recent-tools',
            appData: 'app-data'
        };
        
        this.init();
    }

    init() {
        this.initializeStorage();
        this.cleanupOldData();
    }

    initializeStorage() {
        // Initialize storage structures if they don't exist
        Object.values(this.storageKeys).forEach(key => {
            if (!this.getItem(key)) {
                switch (key) {
                    case this.storageKeys.toolUsage:
                        this.setItem(key, {});
                        break;
                    case this.storageKeys.userPreferences:
                        this.setItem(key, this.getDefaultPreferences());
                        break;
                    case this.storageKeys.searchHistory:
                    case this.storageKeys.favoriteTools:
                    case this.storageKeys.recentTools:
                        this.setItem(key, []);
                        break;
                    case this.storageKeys.appData:
                        this.setItem(key, {
                            version: '1.0.0',
                            installDate: Date.now(),
                            lastUsed: Date.now()
                        });
                        break;
                }
            }
        });
    }

    getDefaultPreferences() {
        return {
            theme: 'auto', // 'light', 'dark', 'auto'
            language: 'en',
            itemsPerPage: 20,
            showUsageStats: true,
            enableNotifications: true,
            autoSave: true,
            compactView: false,
            showCategories: true,
            defaultCategory: 'all'
        };
    }

    // Generic storage methods
    setItem(key, value) {
        try {
            const serializedValue = JSON.stringify({
                data: value,
                timestamp: Date.now(),
                version: '1.0'
            });
            localStorage.setItem(key, serializedValue);
            return true;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return false;
        }
    }

    getItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (!item) return defaultValue;
            
            const parsed = JSON.parse(item);
            return parsed.data !== undefined ? parsed.data : defaultValue;
        } catch (error) {
            console.error('Failed to read from localStorage:', error);
            return defaultValue;
        }
    }

    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Failed to remove from localStorage:', error);
            return false;
        }
    }

    // Tool usage tracking
    incrementToolUsage(toolId) {
        const usage = this.getItem(this.storageKeys.toolUsage, {});
        usage[toolId] = (usage[toolId] || 0) + 1;
        this.setItem(this.storageKeys.toolUsage, usage);
        
        // Update recent tools
        this.addToRecentTools(toolId);
        
        // Update last used timestamp
        this.updateLastUsed();
    }

    getToolUsage(toolId) {
        const usage = this.getItem(this.storageKeys.toolUsage, {});
        return usage[toolId] || 0;
    }

    getAllToolUsage() {
        return this.getItem(this.storageKeys.toolUsage, {});
    }

    getMostUsedTools(limit = 10) {
        const usage = this.getAllToolUsage();
        
        return Object.entries(usage)
            .map(([toolId, count]) => ({ toolId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    resetToolUsage(toolId = null) {
        if (toolId) {
            const usage = this.getItem(this.storageKeys.toolUsage, {});
            delete usage[toolId];
            this.setItem(this.storageKeys.toolUsage, usage);
        } else {
            this.setItem(this.storageKeys.toolUsage, {});
        }
    }

    // Recent tools tracking
    addToRecentTools(toolId, maxItems = 20) {
        const recent = this.getItem(this.storageKeys.recentTools, []);
        
        // Remove if already exists
        const index = recent.findIndex(item => item.toolId === toolId);
        if (index > -1) {
            recent.splice(index, 1);
        }
        
        // Add to beginning
        recent.unshift({
            toolId,
            timestamp: Date.now()
        });
        
        // Keep only the most recent items
        const trimmed = recent.slice(0, maxItems);
        this.setItem(this.storageKeys.recentTools, trimmed);
    }

    getRecentTools(limit = 10) {
        const recent = this.getItem(this.storageKeys.recentTools, []);
        return recent.slice(0, limit);
    }

    clearRecentTools() {
        this.setItem(this.storageKeys.recentTools, []);
    }

    // Favorite tools
    addToFavorites(toolId) {
        const favorites = this.getItem(this.storageKeys.favoriteTools, []);
        if (!favorites.includes(toolId)) {
            favorites.push(toolId);
            this.setItem(this.storageKeys.favoriteTools, favorites);
            return true;
        }
        return false;
    }

    removeFromFavorites(toolId) {
        const favorites = this.getItem(this.storageKeys.favoriteTools, []);
        const index = favorites.indexOf(toolId);
        if (index > -1) {
            favorites.splice(index, 1);
            this.setItem(this.storageKeys.favoriteTools, favorites);
            return true;
        }
        return false;
    }

    isFavorite(toolId) {
        const favorites = this.getItem(this.storageKeys.favoriteTools, []);
        return favorites.includes(toolId);
    }

    getFavoriteTools() {
        return this.getItem(this.storageKeys.favoriteTools, []);
    }

    // User preferences
    setPreference(key, value) {
        const prefs = this.getItem(this.storageKeys.userPreferences, this.getDefaultPreferences());
        prefs[key] = value;
        this.setItem(this.storageKeys.userPreferences, prefs);
    }

    getPreference(key, defaultValue = null) {
        const prefs = this.getItem(this.storageKeys.userPreferences, this.getDefaultPreferences());
        return prefs[key] !== undefined ? prefs[key] : defaultValue;
    }

    getAllPreferences() {
        return this.getItem(this.storageKeys.userPreferences, this.getDefaultPreferences());
    }

    resetPreferences() {
        this.setItem(this.storageKeys.userPreferences, this.getDefaultPreferences());
    }

    // Search history
    addSearchQuery(query, maxHistory = 50) {
        if (!query || query.trim().length < 2) return;
        
        const history = this.getItem(this.storageKeys.searchHistory, []);
        const queryObj = {
            query: query.trim(),
            timestamp: Date.now(),
            count: 1
        };
        
        // Check if query already exists
        const existingIndex = history.findIndex(item => 
            item.query.toLowerCase() === query.toLowerCase()
        );
        
        if (existingIndex > -1) {
            // Update existing query
            history[existingIndex].count++;
            history[existingIndex].timestamp = Date.now();
            
            // Move to front
            const [updated] = history.splice(existingIndex, 1);
            history.unshift(updated);
        } else {
            // Add new query to front
            history.unshift(queryObj);
        }
        
        // Keep only recent searches
        const trimmed = history.slice(0, maxHistory);
        this.setItem(this.storageKeys.searchHistory, trimmed);
    }

    getSearchHistory(limit = 10) {
        const history = this.getItem(this.storageKeys.searchHistory, []);
        return history.slice(0, limit);
    }

    clearSearchHistory() {
        this.setItem(this.storageKeys.searchHistory, []);
    }

    // App data and statistics
    updateLastUsed() {
        const appData = this.getItem(this.storageKeys.appData, {});
        appData.lastUsed = Date.now();
        
        // Update usage session
        if (!appData.sessionStart || Date.now() - appData.sessionStart > 30 * 60 * 1000) {
            appData.sessionStart = Date.now();
            appData.sessionCount = (appData.sessionCount || 0) + 1;
        }
        
        this.setItem(this.storageKeys.appData, appData);
    }

    getAppStatistics() {
        const appData = this.getItem(this.storageKeys.appData, {});
        const toolUsage = this.getAllToolUsage();
        
        return {
            installDate: appData.installDate,
            lastUsed: appData.lastUsed,
            sessionCount: appData.sessionCount || 0,
            totalToolUsage: Object.values(toolUsage).reduce((sum, count) => sum + count, 0),
            uniqueToolsUsed: Object.keys(toolUsage).length,
            favoriteCount: this.getFavoriteTools().length,
            searchCount: this.getSearchHistory().length
        };
    }

    // Data management
    exportData() {
        const data = {};
        
        Object.entries(this.storageKeys).forEach(([name, key]) => {
            data[name] = this.getItem(key);
        });
        
        return {
            exportDate: Date.now(),
            version: '1.0',
            data: data
        };
    }

    importData(importData) {
        if (!importData || !importData.data) {
            throw new Error('Invalid import data');
        }
        
        try {
            Object.entries(importData.data).forEach(([name, value]) => {
                if (this.storageKeys[name]) {
                    this.setItem(this.storageKeys[name], value);
                }
            });
            
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }

    clearAllData() {
        Object.values(this.storageKeys).forEach(key => {
            this.removeItem(key);
        });
        
        this.initializeStorage();
    }

    // Storage cleanup
    cleanupOldData() {
        // Remove old entries from recent tools (older than 30 days)
        const recent = this.getItem(this.storageKeys.recentTools, []);
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        const cleanedRecent = recent.filter(item => item.timestamp > thirtyDaysAgo);
        if (cleanedRecent.length !== recent.length) {
            this.setItem(this.storageKeys.recentTools, cleanedRecent);
        }
        
        // Remove old search history (older than 90 days)
        const history = this.getItem(this.storageKeys.searchHistory, []);
        const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
        
        const cleanedHistory = history.filter(item => item.timestamp > ninetyDaysAgo);
        if (cleanedHistory.length !== history.length) {
            this.setItem(this.storageKeys.searchHistory, cleanedHistory);
        }
    }

    // Storage usage information
    getStorageUsage() {
        let totalSize = 0;
        const breakdown = {};
        
        Object.entries(this.storageKeys).forEach(([name, key]) => {
            const item = localStorage.getItem(key);
            const size = item ? new Blob([item]).size : 0;
            breakdown[name] = size;
            totalSize += size;
        });
        
        return {
            totalSize,
            breakdown,
            available: this.getAvailableStorage(),
            percentage: (totalSize / (5 * 1024 * 1024)) * 100 // Assuming 5MB limit
        };
    }

    getAvailableStorage() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Make StorageManager available globally
window.StorageManager = StorageManager;