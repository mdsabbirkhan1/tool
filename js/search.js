// Search System for ToolsHub

window.Search = {
  // Initialize search system
  init() {
    this.setupElements();
    this.setupEventListeners();
    this.loadSearchHistory();
    this.setupKeyboardShortcuts();
  },

  // Setup DOM elements
  setupElements() {
    this.searchBtn = Utils.dom.get('search-btn');
    this.searchModal = Utils.dom.get('search-modal');
    this.searchInput = Utils.dom.get('search-input');
    this.searchClose = Utils.dom.get('search-close');
    this.searchResults = Utils.dom.get('search-results');
    
    // Cache for search data
    this.searchData = [];
    this.searchCache = new Map();
    this.isLoading = false;
  },

  // Setup event listeners
  setupEventListeners() {
    // Search button click
    if (this.searchBtn) {
      this.searchBtn.addEventListener('click', () => this.openModal());
    }

    // Close button click
    if (this.searchClose) {
      this.searchClose.addEventListener('click', () => this.closeModal());
    }

    // Modal backdrop click
    if (this.searchModal) {
      this.searchModal.addEventListener('click', (e) => {
        if (e.target === this.searchModal) {
          this.closeModal();
        }
      });
    }

    // Search input
    if (this.searchInput) {
      this.searchInput.addEventListener('input', 
        Utils.performance.debounce((e) => this.handleSearch(e.target.value), CONFIG.SEARCH_DEBOUNCE)
      );
      
      this.searchInput.addEventListener('keydown', (e) => this.handleKeydown(e));
      this.searchInput.addEventListener('focus', () => this.showSearchHistory());
    }

    // ESC key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isModalOpen()) {
        this.closeModal();
      }
    });
  },

  // Setup keyboard shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K or / to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.openModal();
      } else if (e.key === '/' && !this.isInputFocused()) {
        e.preventDefault();
        this.openModal();
      }
    });
  },

  // Check if any input is focused
  isInputFocused() {
    const activeElement = document.activeElement;
    return activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    );
  },

  // Load tools data for search
  async loadSearchData() {
    if (this.searchData.length > 0) return this.searchData;

    try {
      this.isLoading = true;
      this.showLoadingState();

      // Try to get data from ToolsData if available
      if (window.ToolsData && window.ToolsData.getAllTools) {
        this.searchData = await window.ToolsData.getAllTools();
      } else {
        // Fallback: load from data files
        const responses = await Promise.all([
          fetch('data/development.json'),
          fetch('data/design.json'),
          fetch('data/productivity.json'),
          fetch('data/marketing.json'),
          fetch('data/analytics.json')
        ]);

        const dataArrays = await Promise.all(
          responses.map(response => response.ok ? response.json() : [])
        );

        this.searchData = dataArrays.flat();
      }

      this.isLoading = false;
      return this.searchData;
    } catch (error) {
      console.error('Error loading search data:', error);
      this.isLoading = false;
      this.showErrorState();
      return [];
    }
  },

  // Open search modal
  async openModal() {
    if (this.searchModal) {
      Utils.dom.addClass(this.searchModal, 'active');
      
      // Focus input after animation
      setTimeout(() => {
        if (this.searchInput) {
          this.searchInput.focus();
        }
      }, 100);

      // Load search data if not already loaded
      if (this.searchData.length === 0) {
        await this.loadSearchData();
      }

      // Show search history if input is empty
      if (!this.searchInput.value) {
        this.showSearchHistory();
      }
    }
  },

  // Close search modal
  closeModal() {
    if (this.searchModal) {
      Utils.dom.removeClass(this.searchModal, 'active');
      this.clearResults();
      
      // Clear input if desired
      if (this.searchInput) {
        this.searchInput.blur();
      }
    }
  },

  // Check if modal is open
  isModalOpen() {
    return this.searchModal && Utils.dom.hasClass(this.searchModal, 'active');
  },

  // Handle search input
  async handleSearch(query) {
    const trimmedQuery = query.trim();

    // Clear results if query is too short
    if (trimmedQuery.length < CONFIG.SEARCH.MIN_CHARACTERS) {
      if (trimmedQuery.length === 0) {
        this.showSearchHistory();
      } else {
        this.clearResults();
      }
      return;
    }

    // Check cache first
    const cacheKey = trimmedQuery.toLowerCase();
    if (this.searchCache.has(cacheKey)) {
      this.displayResults(this.searchCache.get(cacheKey), trimmedQuery);
      return;
    }

    // Load data if needed
    const data = await this.loadSearchData();
    
    // Perform search
    const results = this.performSearch(data, trimmedQuery);
    
    // Cache results
    this.searchCache.set(cacheKey, results);
    
    // Display results
    this.displayResults(results, trimmedQuery);

    // Track search
    if (CONFIG.ANALYTICS.TRACK_SEARCH) {
      Storage.usage.trackSearch(trimmedQuery);
      Storage.searchHistory.add(trimmedQuery);
    }
  },

  // Perform search on data
  performSearch(data, query) {
    const queryLower = query.toLowerCase();
    const results = [];

    for (const tool of data) {
      let score = 0;
      let matches = [];

      // Search in different fields with different weights
      const searchFields = [
        { field: 'name', weight: 10 },
        { field: 'description', weight: 5 },
        { field: 'category', weight: 3 },
        { field: 'features', weight: 2 }
      ];

      for (const { field, weight } of searchFields) {
        const value = tool[field];
        if (!value) continue;

        let fieldValue = '';
        if (Array.isArray(value)) {
          fieldValue = value.join(' ').toLowerCase();
        } else {
          fieldValue = value.toString().toLowerCase();
        }

        if (fieldValue.includes(queryLower)) {
          // Exact match gets higher score
          if (fieldValue === queryLower) {
            score += weight * 5;
          } else if (fieldValue.startsWith(queryLower)) {
            score += weight * 3;
          } else {
            score += weight;
          }

          matches.push({
            field: field,
            value: value,
            highlighted: this.highlightMatch(value, query)
          });
        }
      }

      if (score > 0) {
        results.push({
          ...tool,
          score: score,
          matches: matches
        });
      }
    }

    // Sort by score (highest first)
    results.sort((a, b) => b.score - a.score);

    // Limit results
    return results.slice(0, CONFIG.SEARCH.MAX_RESULTS);
  },

  // Highlight search matches
  highlightMatch(text, query) {
    if (!CONFIG.SEARCH.HIGHLIGHT_MATCHES) return text;
    
    const regex = new RegExp(`(${Utils.string.escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  },

  // Display search results
  displayResults(results, query) {
    if (!this.searchResults) return;

    if (results.length === 0) {
      this.showNoResults(query);
      return;
    }

    const resultsHtml = results.map(tool => this.createResultItem(tool, query)).join('');
    this.searchResults.innerHTML = resultsHtml;

    // Add click listeners
    this.attachResultListeners();
  },

  // Create individual result item
  createResultItem(tool, query) {
    const highlightedName = CONFIG.SEARCH.HIGHLIGHT_MATCHES ? 
      this.highlightMatch(tool.name, query) : tool.name;
    
    const highlightedDescription = CONFIG.SEARCH.HIGHLIGHT_MATCHES ? 
      this.highlightMatch(tool.description, query) : tool.description;

    return `
      <a href="${tool.link}" class="search-result" data-tool-id="${tool.id}" target="_blank" rel="noopener">
        <div class="search-result-icon">
          <i class="${tool.icon}"></i>
        </div>
        <div class="search-result-info">
          <div class="search-result-title">${highlightedName}</div>
          <div class="search-result-description">${Utils.string.truncate(highlightedDescription, 100)}</div>
        </div>
        <div class="search-result-category">${tool.category}</div>
      </a>
    `;
  },

  // Attach event listeners to results
  attachResultListeners() {
    const resultLinks = this.searchResults.querySelectorAll('.search-result');
    
    resultLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const toolId = link.dataset.toolId;
        const toolName = link.querySelector('.search-result-title').textContent;
        const category = link.querySelector('.search-result-category').textContent;

        // Track tool usage
        if (CONFIG.ANALYTICS.TRACK_CLICKS) {
          Storage.usage.trackToolClick(toolId, toolName, category);
        }

        // Close modal
        this.closeModal();
      });
    });
  },

  // Show search history
  showSearchHistory() {
    if (!this.searchResults) return;

    const history = Storage.searchHistory.getRecent(8);
    
    if (history.length === 0) {
      this.showEmptyState();
      return;
    }

    const historyHtml = `
      <div class="search-history">
        <div class="search-history-header">
          <h4>Recent Searches</h4>
          <button class="search-clear-history" onclick="Search.clearSearchHistory()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="search-history-items">
          ${history.map(item => `
            <button class="search-history-item" onclick="Search.searchFromHistory('${Utils.string.escapeHtml(item.query)}')">
              <i class="fas fa-clock"></i>
              <span>${Utils.string.escapeHtml(item.query)}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    this.searchResults.innerHTML = historyHtml;
  },

  // Search from history item
  searchFromHistory(query) {
    if (this.searchInput) {
      this.searchInput.value = query;
      this.handleSearch(query);
    }
  },

  // Clear search history
  clearSearchHistory() {
    Storage.searchHistory.clear();
    this.showEmptyState();
  },

  // Show empty state
  showEmptyState() {
    if (!this.searchResults) return;

    this.searchResults.innerHTML = `
      <div class="search-placeholder">
        <i class="fas fa-search"></i>
        <p>Start typing to search tools...</p>
      </div>
    `;
  },

  // Show no results
  showNoResults(query) {
    if (!this.searchResults) return;

    this.searchResults.innerHTML = `
      <div class="search-no-results">
        <i class="fas fa-search"></i>
        <h4>No results found</h4>
        <p>Try searching for something else</p>
        <small>Searched for: "${Utils.string.escapeHtml(query)}"</small>
      </div>
    `;
  },

  // Show loading state
  showLoadingState() {
    if (!this.searchResults) return;

    this.searchResults.innerHTML = `
      <div class="search-loading">
        <div class="spinner"></div>
        <p>Loading tools...</p>
      </div>
    `;
  },

  // Show error state
  showErrorState() {
    if (!this.searchResults) return;

    this.searchResults.innerHTML = `
      <div class="search-error">
        <i class="fas fa-exclamation-triangle"></i>
        <h4>Failed to load search data</h4>
        <p>Please try again later</p>
        <button class="btn btn-primary btn-sm" onclick="Search.loadSearchData()">
          Retry
        </button>
      </div>
    `;
  },

  // Clear results
  clearResults() {
    if (this.searchResults) {
      this.searchResults.innerHTML = '';
    }
  },

  // Handle keyboard navigation
  handleKeydown(e) {
    const results = this.searchResults.querySelectorAll('.search-result, .search-history-item');
    const currentFocus = document.activeElement;
    let currentIndex = -1;

    // Find current focused element index
    results.forEach((item, index) => {
      if (item === currentFocus) {
        currentIndex = index;
      }
    });

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < results.length - 1) {
          results[currentIndex + 1].focus();
        } else if (results.length > 0) {
          results[0].focus();
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          results[currentIndex - 1].focus();
        } else if (results.length > 0) {
          results[results.length - 1].focus();
        }
        break;

      case 'Enter':
        if (currentFocus && currentFocus.classList.contains('search-result')) {
          currentFocus.click();
        } else if (currentFocus && currentFocus.classList.contains('search-history-item')) {
          currentFocus.click();
        }
        break;

      case 'Escape':
        this.searchInput.focus();
        break;
    }
  },

  // Load search history
  loadSearchHistory() {
    // This method is called on init to ensure search history is available
    return Storage.searchHistory.get();
  },

  // Global search function for other components
  globalSearch(query) {
    this.openModal();
    if (this.searchInput) {
      this.searchInput.value = query;
      this.handleSearch(query);
    }
  },

  // Advanced search with filters
  advancedSearch(query, filters = {}) {
    return this.loadSearchData().then(data => {
      let filteredData = data;

      // Apply filters
      if (filters.category) {
        filteredData = filteredData.filter(tool => tool.category === filters.category);
      }

      if (filters.rating) {
        filteredData = filteredData.filter(tool => tool.rating >= filters.rating);
      }

      if (filters.pricing) {
        filteredData = filteredData.filter(tool => {
          switch (filters.pricing) {
            case 'free':
              return tool.pricing && tool.pricing.toLowerCase().includes('free');
            case 'premium':
              return tool.pricing && !tool.pricing.toLowerCase().includes('free');
            default:
              return true;
          }
        });
      }

      // Perform search on filtered data
      return this.performSearch(filteredData, query);
    });
  },

  // Get search suggestions
  getSuggestions(query, limit = 5) {
    if (!query || query.length < 2) return [];

    const suggestions = [];
    const queryLower = query.toLowerCase();

    // Get suggestions from search data
    for (const tool of this.searchData) {
      if (tool.name.toLowerCase().includes(queryLower)) {
        suggestions.push({
          type: 'tool',
          text: tool.name,
          category: tool.category
        });
      }
    }

    // Get suggestions from search history
    const history = Storage.searchHistory.getRecent();
    for (const item of history) {
      if (item.query.includes(queryLower) && 
          !suggestions.find(s => s.text === item.query)) {
        suggestions.push({
          type: 'history',
          text: item.query
        });
      }
    }

    return suggestions.slice(0, limit);
  },

  // Export search data
  exportResults(results, format = 'json') {
    const data = {
      timestamp: new Date().toISOString(),
      query: this.searchInput?.value || '',
      totalResults: results.length,
      results: results.map(tool => ({
        id: tool.id,
        name: tool.name,
        category: tool.category,
        description: tool.description,
        link: tool.link,
        rating: tool.rating
      }))
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search-results-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }
};

// Add utility for escaping regex
Utils.string.escapeRegex = function(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Initialize search when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  if (CONFIG.FEATURES.SEARCH) {
    Search.init();
  }
});

// Make Search globally available
window.Search = Search;