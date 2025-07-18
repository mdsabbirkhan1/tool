// Search Manager - Handles search functionality
class SearchManager {
    constructor(app) {
        this.app = app;
        this.searchInput = document.getElementById('search-input');
        this.clearSearchBtn = document.getElementById('clear-search');
        this.searchResults = [];
        this.searchTimeout = null;
        this.minSearchLength = 2;
        
        this.init();
    }

    init() {
        this.setupSearchInput();
        this.setupClearButton();
        this.setupKeyboardShortcuts();
    }

    setupSearchInput() {
        if (!this.searchInput) return;

        // Real-time search with debouncing
        this.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            this.debounceSearch(query);
            this.toggleClearButton(query.length > 0);
        });

        // Handle enter key
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.performSearch(this.searchInput.value.trim());
            }
            
            // Handle escape key to clear search
            if (e.key === 'Escape') {
                this.clearSearch();
            }
        });

        // Focus behavior
        this.searchInput.addEventListener('focus', () => {
            this.searchInput.parentElement.classList.add('focused');
        });

        this.searchInput.addEventListener('blur', () => {
            this.searchInput.parentElement.classList.remove('focused');
        });
    }

    setupClearButton() {
        if (!this.clearSearchBtn) return;

        this.clearSearchBtn.addEventListener('click', () => {
            this.clearSearch();
        });
    }

    setupKeyboardShortcuts() {
        // Ctrl/Cmd + K to focus search
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.focusSearch();
            }
        });
    }

    debounceSearch(query) {
        clearTimeout(this.searchTimeout);
        
        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, 300); // 300ms debounce
    }

    performSearch(query) {
        if (!query || query.length < this.minSearchLength) {
            this.clearSearchResults();
            return;
        }

        this.app.searchQuery = query;
        
        // Perform the search
        const results = this.searchTools(query);
        this.searchResults = results;
        
        // Update UI
        this.displaySearchResults(results);
        
        // Track search
        this.trackSearch(query, results.length);
    }

    searchTools(query) {
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        
        return this.app.tools.filter(tool => {
            // Calculate relevance score
            let score = 0;
            
            // Check name (highest weight)
            const nameMatch = this.calculateMatchScore(tool.name.toLowerCase(), searchTerms);
            score += nameMatch * 10;
            
            // Check description (medium weight)
            const descMatch = this.calculateMatchScore(tool.description.toLowerCase(), searchTerms);
            score += descMatch * 5;
            
            // Check keywords (medium weight)
            if (tool.keywords) {
                const keywordMatch = tool.keywords.some(keyword => 
                    searchTerms.some(term => keyword.toLowerCase().includes(term))
                );
                if (keywordMatch) score += 3;
            }
            
            // Check category (low weight)
            const categoryMatch = this.calculateMatchScore(tool.category.toLowerCase(), searchTerms);
            score += categoryMatch * 2;
            
            return score > 0;
        }).sort((a, b) => {
            // Sort by relevance (recalculate for sorting)
            const scoreA = this.calculateRelevanceScore(a, searchTerms);
            const scoreB = this.calculateRelevanceScore(b, searchTerms);
            return scoreB - scoreA;
        });
    }

    calculateMatchScore(text, searchTerms) {
        let score = 0;
        
        searchTerms.forEach(term => {
            if (text.includes(term)) {
                // Exact match gets higher score
                if (text === term) {
                    score += 10;
                } else if (text.startsWith(term)) {
                    score += 5;
                } else {
                    score += 1;
                }
            }
        });
        
        return score;
    }

    calculateRelevanceScore(tool, searchTerms) {
        let score = 0;
        
        // Name matching (highest priority)
        score += this.calculateMatchScore(tool.name.toLowerCase(), searchTerms) * 10;
        
        // Description matching
        score += this.calculateMatchScore(tool.description.toLowerCase(), searchTerms) * 5;
        
        // Keywords matching
        if (tool.keywords) {
            tool.keywords.forEach(keyword => {
                score += this.calculateMatchScore(keyword.toLowerCase(), searchTerms) * 3;
            });
        }
        
        // Category matching
        score += this.calculateMatchScore(tool.category.toLowerCase(), searchTerms) * 2;
        
        // Boost popular tools (based on usage)
        if (this.app.storageManager) {
            const usage = this.app.storageManager.getToolUsage(tool.id);
            score += Math.min(usage * 0.1, 5); // Cap boost at 5 points
        }
        
        return score;
    }

    displaySearchResults(results) {
        // Hide category-based view and show search results
        this.app.hideSearchResults();
        this.app.hideMostUsed();
        
        if (results.length > 0) {
            this.app.showSearchResults(results);
            
            // Update page title to reflect search
            document.title = `Search: ${this.app.searchQuery} - Tools Hub`;
        } else {
            this.app.showNoResults();
        }
    }

    clearSearchResults() {
        this.app.searchQuery = '';
        this.app.hideSearchResults();
        this.app.showMostUsedTools();
        
        // Reset page title
        document.title = 'Tools Hub - Your Ultimate Tool Collection';
    }

    clearSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
            this.toggleClearButton(false);
        }
        
        this.clearSearchResults();
        this.app.renderTools();
    }

    focusSearch() {
        if (this.searchInput) {
            this.searchInput.focus();
            this.searchInput.select();
        }
    }

    toggleClearButton(show) {
        if (this.clearSearchBtn) {
            this.clearSearchBtn.classList.toggle('hidden', !show);
        }
    }

    // Get search suggestions based on partial input
    getSuggestions(query, limit = 5) {
        if (!query || query.length < 1) return [];
        
        const suggestions = new Set();
        const queryLower = query.toLowerCase();
        
        // Add tool names that start with the query
        this.app.tools.forEach(tool => {
            if (tool.name.toLowerCase().startsWith(queryLower)) {
                suggestions.add(tool.name);
            }
        });
        
        // Add keywords that start with the query
        this.app.tools.forEach(tool => {
            if (tool.keywords) {
                tool.keywords.forEach(keyword => {
                    if (keyword.toLowerCase().startsWith(queryLower)) {
                        suggestions.add(keyword);
                    }
                });
            }
        });
        
        // Add categories that start with the query
        this.app.categories.forEach(category => {
            if (category.toLowerCase().startsWith(queryLower)) {
                suggestions.add(this.app.formatCategoryName(category));
            }
        });
        
        return Array.from(suggestions).slice(0, limit);
    }

    // Highlight search terms in text
    highlightSearchTerms(text, query) {
        if (!query) return text;
        
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        let highlightedText = text;
        
        searchTerms.forEach(term => {
            const regex = new RegExp(`(${this.escapeRegExp(term)})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
        });
        
        return highlightedText;
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    trackSearch(query, resultCount) {
        if (this.app.analyticsManager) {
            this.app.analyticsManager.trackEvent('search', {
                query: query,
                resultCount: resultCount,
                timestamp: Date.now()
            });
        }
    }

    // Get search history
    getSearchHistory() {
        const history = localStorage.getItem('search-history');
        return history ? JSON.parse(history) : [];
    }

    // Save search to history
    saveSearchHistory(query) {
        if (!query || query.length < this.minSearchLength) return;
        
        const history = this.getSearchHistory();
        
        // Remove if already exists
        const index = history.indexOf(query);
        if (index > -1) {
            history.splice(index, 1);
        }
        
        // Add to beginning
        history.unshift(query);
        
        // Keep only last 10 searches
        const trimmedHistory = history.slice(0, 10);
        
        localStorage.setItem('search-history', JSON.stringify(trimmedHistory));
    }

    // Clear search history
    clearSearchHistory() {
        localStorage.removeItem('search-history');
    }
}

// Add CSS for search functionality
const style = document.createElement('style');
style.textContent = `
    .search-container.focused {
        transform: scale(1.02);
        box-shadow: var(--shadow-medium);
    }
    
    mark {
        background-color: var(--accent-color);
        color: white;
        padding: 1px 3px;
        border-radius: 3px;
        font-weight: 600;
    }
    
    .search-suggestions {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--card-color);
        border: 1px solid var(--border-color);
        border-top: none;
        border-radius: 0 0 var(--border-radius) var(--border-radius);
        box-shadow: var(--shadow-medium);
        z-index: 1000;
        max-height: 200px;
        overflow-y: auto;
    }
    
    .search-suggestion {
        padding: 12px 16px;
        cursor: pointer;
        border-bottom: 1px solid var(--border-color);
        transition: background-color var(--transition-fast);
    }
    
    .search-suggestion:hover,
    .search-suggestion.active {
        background-color: var(--surface-color);
    }
    
    .search-suggestion:last-child {
        border-bottom: none;
    }
    
    .search-no-results {
        padding: 16px;
        text-align: center;
        color: var(--text-muted);
        font-style: italic;
    }
`;
document.head.appendChild(style);

// Make SearchManager available globally
window.SearchManager = SearchManager;