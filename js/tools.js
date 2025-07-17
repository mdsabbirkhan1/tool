// Tools Page Controller for ToolsHub

window.ToolsPage = {
  // Initialize tools page
  init() {
    this.setupElements();
    this.setupEventListeners();
    this.setupFilters();
    this.loadTools();
    this.handleURLParams();
    this.setupInfiniteScroll();
  },

  // Setup DOM elements
  setupElements() {
    this.toolsGrid = Utils.dom.get('tools-grid');
    this.toolsContainer = Utils.dom.get('tools-container');
    this.resultsCount = Utils.dom.get('results-count');
    this.noResults = Utils.dom.get('no-results');
    this.loadMoreBtn = Utils.dom.get('load-more-btn');
    this.loadMoreContainer = Utils.dom.get('load-more-container');
    
    // Filters
    this.categoryFilter = Utils.dom.get('category-filter');
    this.sortFilter = Utils.dom.get('sort-filter');
    this.mobileCategoryFilter = Utils.dom.get('mobile-category-filter');
    this.mobileSortFilter = Utils.dom.get('mobile-sort-filter');
    
    // View toggles
    this.gridViewBtn = Utils.dom.get('grid-view');
    this.listViewBtn = Utils.dom.get('list-view');
    
    // Mobile filters
    this.filterToggle = Utils.dom.get('filter-toggle');
    this.mobileFilters = Utils.dom.get('mobile-filters');
    this.mobileFiltersClose = Utils.dom.get('mobile-filters-close');
    
    // State
    this.currentPage = 1;
    this.totalPages = 1;
    this.isLoading = false;
    this.allTools = [];
    this.filteredTools = [];
    this.currentFilters = {
      category: '',
      sort: CONFIG.FILTERS.DEFAULT_SORT,
      search: ''
    };
    this.currentView = Storage.preferences.get('viewMode') || 'grid';
  },

  // Setup event listeners
  setupEventListeners() {
    // Filter changes
    if (this.categoryFilter) {
      this.categoryFilter.addEventListener('change', (e) => {
        this.handleFilterChange('category', e.target.value);
      });
    }

    if (this.sortFilter) {
      this.sortFilter.addEventListener('change', (e) => {
        this.handleFilterChange('sort', e.target.value);
      });
    }

    // Mobile filter changes
    if (this.mobileCategoryFilter) {
      this.mobileCategoryFilter.addEventListener('change', (e) => {
        this.handleFilterChange('category', e.target.value);
      });
    }

    if (this.mobileSortFilter) {
      this.mobileSortFilter.addEventListener('change', (e) => {
        this.handleFilterChange('sort', e.target.value);
      });
    }

    // View toggle
    if (this.gridViewBtn) {
      this.gridViewBtn.addEventListener('click', () => this.setView('grid'));
    }

    if (this.listViewBtn) {
      this.listViewBtn.addEventListener('click', () => this.setView('list'));
    }

    // Mobile filters toggle
    if (this.filterToggle) {
      this.filterToggle.addEventListener('click', () => this.toggleMobileFilters());
    }

    if (this.mobileFiltersClose) {
      this.mobileFiltersClose.addEventListener('click', () => this.closeMobileFilters());
    }

    // Load more button
    if (this.loadMoreBtn) {
      this.loadMoreBtn.addEventListener('click', () => this.loadMoreTools());
    }

    // Filter action buttons
    Utils.dom.on('#clear-all-filters', 'click', () => this.clearAllFilters());
    Utils.dom.on('#apply-filters', 'click', () => this.applyMobileFilters());
    Utils.dom.on('#clear-filters', 'click', () => this.clearAllFilters());
    Utils.dom.on('#reset-filters', 'click', () => this.clearAllFilters());

    // Close mobile filters on backdrop click
    if (this.mobileFilters) {
      this.mobileFilters.addEventListener('click', (e) => {
        if (e.target === this.mobileFilters) {
          this.closeMobileFilters();
        }
      });
    }

    // Browser back/forward
    window.addEventListener('popstate', () => {
      this.handleURLParams();
    });
  },

  // Setup filters with available options
  setupFilters() {
    this.populateFilterOptions();
    this.setInitialView();
  },

  // Populate filter dropdown options
  populateFilterOptions() {
    // Get unique categories from tools data
    const categories = this.getUniqueCategories();
    
    // Populate category filters
    [this.categoryFilter, this.mobileCategoryFilter].forEach(select => {
      if (select) {
        const optionsHTML = categories.map(cat => 
          `<option value="${cat.slug}">${cat.name} (${cat.count})</option>`
        ).join('');
        
        select.innerHTML = '<option value="">All Categories</option>' + optionsHTML;
      }
    });

    // Populate sort filters
    [this.sortFilter, this.mobileSortFilter].forEach(select => {
      if (select) {
        const sortOptions = CONFIG.FILTERS.AVAILABLE_SORTS.map(sort =>
          `<option value="${sort.value}">${sort.label}</option>`
        ).join('');
        
        select.innerHTML = sortOptions;
        select.value = CONFIG.FILTERS.DEFAULT_SORT;
      }
    });
  },

  // Get unique categories from tools data
  getUniqueCategories() {
    const categoryCount = {};
    
    this.allTools.forEach(tool => {
      const category = tool.category;
      if (categoryCount[category]) {
        categoryCount[category].count++;
      } else {
        categoryCount[category] = {
          name: Utils.string.titleCase(category),
          slug: category.toLowerCase(),
          count: 1
        };
      }
    });

    return Object.values(categoryCount).sort((a, b) => b.count - a.count);
  },

  // Set initial view mode
  setInitialView() {
    this.setView(this.currentView);
  },

  // Load tools data
  async loadTools() {
    try {
      this.showLoading();
      
      // Load tools from data files or API
      this.allTools = await this.fetchToolsData();
      
      // Apply initial filters and display
      this.applyFilters();
      this.hideLoading();
      
    } catch (error) {
      console.error('Error loading tools:', error);
      this.showError('Failed to load tools. Please try again.');
      this.hideLoading();
    }
  },

  // Fetch tools data
  async fetchToolsData() {
    // Mock data for now - replace with actual data loading
    return this.getMockToolsData();
  },

  // Handle URL parameters
  handleURLParams() {
    const params = Utils.url.getParams();
    
    if (params.category) {
      this.currentFilters.category = params.category;
      this.updateFilterSelects();
    }
    
    if (params.sort) {
      this.currentFilters.sort = params.sort;
      this.updateFilterSelects();
    }
    
    if (params.search) {
      this.currentFilters.search = params.search;
    }

    // Apply filters if tools are loaded
    if (this.allTools.length > 0) {
      this.applyFilters();
    }
  },

  // Update filter select elements
  updateFilterSelects() {
    [this.categoryFilter, this.mobileCategoryFilter].forEach(select => {
      if (select) select.value = this.currentFilters.category;
    });

    [this.sortFilter, this.mobileSortFilter].forEach(select => {
      if (select) select.value = this.currentFilters.sort;
    });
  },

  // Handle filter change
  handleFilterChange(filterType, value) {
    this.currentFilters[filterType] = value;
    this.currentPage = 1;
    
    // Update URL
    this.updateURL();
    
    // Sync filter selects
    this.syncFilterSelects(filterType, value);
    
    // Apply filters
    this.applyFilters();
  },

  // Sync filter selects between desktop and mobile
  syncFilterSelects(filterType, value) {
    if (filterType === 'category') {
      [this.categoryFilter, this.mobileCategoryFilter].forEach(select => {
        if (select && select.value !== value) {
          select.value = value;
        }
      });
    } else if (filterType === 'sort') {
      [this.sortFilter, this.mobileSortFilter].forEach(select => {
        if (select && select.value !== value) {
          select.value = value;
        }
      });
    }
  },

  // Apply current filters
  applyFilters() {
    // Filter tools
    this.filteredTools = this.filterTools(this.allTools, this.currentFilters);
    
    // Sort tools
    this.filteredTools = this.sortTools(this.filteredTools, this.currentFilters.sort);
    
    // Calculate pagination
    this.calculatePagination();
    
    // Display tools
    this.displayTools();
    
    // Update results count
    this.updateResultsCount();
    
    // Show/hide load more button
    this.updateLoadMoreButton();
  },

  // Filter tools based on criteria
  filterTools(tools, filters) {
    let filtered = [...tools];

    // Filter by category
    if (filters.category) {
      filtered = filtered.filter(tool => 
        tool.category.toLowerCase() === filters.category.toLowerCase()
      );
    }

    // Filter by search (if search functionality is integrated)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(tool => 
        tool.name.toLowerCase().includes(searchLower) ||
        tool.description.toLowerCase().includes(searchLower) ||
        tool.category.toLowerCase().includes(searchLower) ||
        (tool.features && tool.features.some(feature => 
          feature.toLowerCase().includes(searchLower)
        ))
      );
    }

    return filtered;
  },

  // Sort tools based on criteria
  sortTools(tools, sortBy) {
    const sorted = [...tools];

    switch (sortBy) {
      case 'popular':
        return sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      
      case 'newest':
        return sorted.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));
      
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.dateAdded || 0) - new Date(b.dateAdded || 0));
      
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      
      case 'rating':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      
      default:
        return sorted;
    }
  },

  // Calculate pagination
  calculatePagination() {
    const itemsPerPage = CONFIG.TOOLS_PER_PAGE;
    this.totalPages = Math.ceil(this.filteredTools.length / itemsPerPage);
  },

  // Display tools for current page
  displayTools() {
    if (this.filteredTools.length === 0) {
      this.showNoResults();
      return;
    }

    const startIndex = (this.currentPage - 1) * CONFIG.TOOLS_PER_PAGE;
    const endIndex = startIndex + CONFIG.TOOLS_PER_PAGE;
    const toolsToShow = this.filteredTools.slice(0, endIndex); // Show all tools up to current page

    this.renderTools(toolsToShow);
    this.hideNoResults();
  },

  // Render tools in the grid
  renderTools(tools) {
    if (!this.toolsGrid) return;

    const toolsHTML = tools.map(tool => this.createToolCard(tool)).join('');
    this.toolsGrid.innerHTML = toolsHTML;

    // Setup tool interactions
    this.setupToolInteractions();
    
    // Add animations
    this.animateToolCards();
  },

  // Create tool card HTML
  createToolCard(tool) {
    const isFavorite = Storage.favorites.isFavorite(tool.id);
    const rating = tool.rating || 4.5;
    const ratingStars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
    const isPopular = Storage.usage.getPopularTools(10).some(popular => popular.id === tool.id);

    return `
      <div class="tool-card ${isPopular ? 'popular' : ''}" data-tool-id="${tool.id}">
        <div class="tool-header">
          <div class="tool-icon">
            <i class="${tool.icon}"></i>
          </div>
          <div class="tool-info">
            <h3>${tool.name}</h3>
            <span class="tool-category">${tool.category}</span>
          </div>
        </div>
        <p class="tool-description">${Utils.string.truncate(tool.description, 150)}</p>
        
        ${tool.features ? `
          <div class="tool-features">
            <div class="tool-features-title">Features:</div>
            <div class="tool-features-list">
              ${tool.features.slice(0, 3).map(feature => `<span class="tool-feature">${feature}</span>`).join('')}
            </div>
          </div>
        ` : ''}
        
        <div class="tool-footer">
          <div class="tool-rating">
            <span class="tool-rating-stars">${ratingStars}</span>
            <span class="tool-rating-value">${rating}</span>
          </div>
          <div class="tool-badges">
            ${tool.badge ? `<span class="tool-badge ${tool.badge.toLowerCase()}">${tool.badge}</span>` : ''}
            ${tool.pricing ? `<span class="tool-price ${this.getPricingClass(tool.pricing)}">${tool.pricing}</span>` : ''}
          </div>
        </div>
        
        <div class="tool-actions">
          <a href="${tool.link}" target="_blank" rel="noopener" class="btn btn-primary tool-visit-btn">
            <i class="fas fa-external-link-alt"></i>
            Visit Tool
          </a>
          <button class="btn btn-secondary tool-favorite-btn ${isFavorite ? 'active' : ''}" 
                  data-tool-id="${tool.id}" title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
            <i class="fas fa-heart"></i>
          </button>
        </div>
      </div>
    `;
  },

  // Get pricing class for styling
  getPricingClass(pricing) {
    const pricingLower = pricing.toLowerCase();
    if (pricingLower.includes('free')) return 'free';
    if (pricingLower.includes('premium') || pricingLower.includes('paid')) return 'premium';
    return 'freemium';
  },

  // Setup tool interactions
  setupToolInteractions() {
    if (!this.toolsGrid) return;

    // Tool click tracking
    this.toolsGrid.addEventListener('click', (e) => {
      if (e.target.closest('.tool-visit-btn')) {
        const toolCard = e.target.closest('.tool-card');
        const toolId = toolCard.dataset.toolId;
        const tool = this.findToolById(toolId);
        
        if (tool && CONFIG.ANALYTICS.TRACK_CLICKS) {
          Storage.usage.trackToolClick(toolId, tool.name, tool.category);
        }
      }
    });

    // Favorite button handling
    this.toolsGrid.addEventListener('click', (e) => {
      if (e.target.closest('.tool-favorite-btn')) {
        e.preventDefault();
        this.handleFavoriteToggle(e.target.closest('.tool-favorite-btn'));
      }
    });
  },

  // Find tool by ID
  findToolById(id) {
    return this.allTools.find(tool => tool.id === id);
  },

  // Handle favorite toggle
  handleFavoriteToggle(button) {
    const toolId = button.dataset.toolId;
    const tool = this.findToolById(toolId);
    
    if (!tool) return;

    const wasToggled = Storage.favorites.toggle(toolId, tool);
    
    if (wasToggled) {
      button.classList.toggle('active');
      
      if (button.classList.contains('active')) {
        button.title = 'Remove from favorites';
        this.showToast('Added to favorites', 'success');
      } else {
        button.title = 'Add to favorites';
        this.showToast('Removed from favorites', 'info');
      }
    }
  },

  // Set view mode (grid or list)
  setView(viewMode) {
    this.currentView = viewMode;
    
    // Update UI
    if (this.gridViewBtn && this.listViewBtn) {
      Utils.dom.removeClass(this.gridViewBtn, 'active');
      Utils.dom.removeClass(this.listViewBtn, 'active');
      
      if (viewMode === 'grid') {
        Utils.dom.addClass(this.gridViewBtn, 'active');
        Utils.dom.removeClass(this.toolsGrid, 'list-view');
      } else {
        Utils.dom.addClass(this.listViewBtn, 'active');
        Utils.dom.addClass(this.toolsGrid, 'list-view');
      }
    }
    
    // Save preference
    Storage.preferences.setPreference('viewMode', viewMode);
  },

  // Toggle mobile filters
  toggleMobileFilters() {
    if (this.mobileFilters) {
      Utils.dom.addClass(this.mobileFilters, 'active');
    }
  },

  // Close mobile filters
  closeMobileFilters() {
    if (this.mobileFilters) {
      Utils.dom.removeClass(this.mobileFilters, 'active');
    }
  },

  // Apply mobile filters
  applyMobileFilters() {
    this.closeMobileFilters();
    // Filters are applied automatically via event listeners
  },

  // Clear all filters
  clearAllFilters() {
    this.currentFilters = {
      category: '',
      sort: CONFIG.FILTERS.DEFAULT_SORT,
      search: ''
    };
    
    this.currentPage = 1;
    this.updateFilterSelects();
    this.updateURL();
    this.applyFilters();
    
    this.showToast('Filters cleared', 'info');
  },

  // Load more tools (pagination)
  loadMoreTools() {
    if (this.isLoading || this.currentPage >= this.totalPages) return;

    this.currentPage++;
    this.displayTools();
    this.updateLoadMoreButton();
  },

  // Setup infinite scroll
  setupInfiniteScroll() {
    if (!CONFIG.PERFORMANCE.LAZY_LOADING) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && this.currentPage < this.totalPages && !this.isLoading) {
          this.loadMoreTools();
        }
      });
    }, { threshold: 0.1 });

    if (this.loadMoreContainer) {
      observer.observe(this.loadMoreContainer);
    }
  },

  // Update results count display
  updateResultsCount() {
    if (!this.resultsCount) return;

    const count = this.filteredTools.length;
    const total = this.allTools.length;
    
    if (count === total) {
      this.resultsCount.textContent = `Showing all ${count} tools`;
    } else {
      this.resultsCount.textContent = `Showing ${count} of ${total} tools`;
    }
  },

  // Update load more button visibility
  updateLoadMoreButton() {
    if (!this.loadMoreBtn || !this.loadMoreContainer) return;

    if (this.currentPage >= this.totalPages) {
      Utils.dom.hide(this.loadMoreContainer);
    } else {
      Utils.dom.show(this.loadMoreContainer);
      
      const remaining = this.totalPages - this.currentPage;
      const itemsPerPage = CONFIG.TOOLS_PER_PAGE;
      const remainingTools = remaining * itemsPerPage;
      
      this.loadMoreBtn.innerHTML = `
        <i class="fas fa-plus"></i>
        Load ${Math.min(remainingTools, itemsPerPage)} More Tools
      `;
    }
  },

  // Update URL with current filters
  updateURL() {
    const params = {};
    
    if (this.currentFilters.category) {
      params.category = this.currentFilters.category;
    }
    
    if (this.currentFilters.sort !== CONFIG.FILTERS.DEFAULT_SORT) {
      params.sort = this.currentFilters.sort;
    }
    
    if (this.currentFilters.search) {
      params.search = this.currentFilters.search;
    }

    const url = Object.keys(params).length > 0 ? 
      Utils.url.build(window.location.pathname, params) : 
      window.location.pathname;

    window.history.replaceState({}, '', url);
  },

  // Show loading state
  showLoading() {
    this.isLoading = true;
    if (this.toolsGrid) {
      Utils.dom.addClass(this.toolsGrid, 'loading');
    }
  },

  // Hide loading state
  hideLoading() {
    this.isLoading = false;
    if (this.toolsGrid) {
      Utils.dom.removeClass(this.toolsGrid, 'loading');
    }
  },

  // Show no results
  showNoResults() {
    if (this.noResults) {
      Utils.dom.show(this.noResults);
    }
    if (this.toolsContainer) {
      Utils.dom.hide(this.toolsContainer);
    }
  },

  // Hide no results
  hideNoResults() {
    if (this.noResults) {
      Utils.dom.hide(this.noResults);
    }
    if (this.toolsContainer) {
      Utils.dom.show(this.toolsContainer);
    }
  },

  // Show error message
  showError(message) {
    this.showToast(message, 'error');
  },

  // Show toast notification
  showToast(message, type = 'info') {
    if (window.App && window.App.showToast) {
      window.App.showToast(message, type);
    }
  },

  // Animate tool cards
  animateToolCards() {
    if (!CONFIG.ANIMATIONS.ENABLED) return;

    const cards = this.toolsGrid.querySelectorAll('.tool-card');
    cards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        card.style.transition = `opacity 0.3s ease ${index * 0.05}s, transform 0.3s ease ${index * 0.05}s`;
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 50);
    });
  },

  // Get mock tools data
  getMockToolsData() {
    return [
      {
        id: 'figma',
        name: 'Figma',
        category: 'Design',
        description: 'Collaborative design tool for teams to create, prototype, and gather feedback.',
        icon: 'fab fa-figma',
        link: 'https://figma.com',
        rating: 4.8,
        badge: 'Popular',
        pricing: 'Free',
        features: ['Real-time collaboration', 'Prototyping', 'Design systems'],
        dateAdded: '2023-01-15',
        popularity: 95
      },
      {
        id: 'vscode',
        name: 'VS Code',
        category: 'Development',
        description: 'Powerful and lightweight code editor with extensive extension support.',
        icon: 'fas fa-code',
        link: 'https://code.visualstudio.com',
        rating: 4.9,
        badge: 'Free',
        pricing: 'Free',
        features: ['IntelliSense', 'Extensions', 'Git integration'],
        dateAdded: '2023-01-10',
        popularity: 98
      },
      {
        id: 'notion',
        name: 'Notion',
        category: 'Productivity',
        description: 'All-in-one workspace for notes, tasks, wikis, and databases.',
        icon: 'fas fa-sticky-note',
        link: 'https://notion.so',
        rating: 4.6,
        badge: 'Popular',
        pricing: 'Freemium',
        features: ['Note-taking', 'Databases', 'Task management'],
        dateAdded: '2023-01-20',
        popularity: 87
      },
      {
        id: 'chatgpt',
        name: 'ChatGPT',
        category: 'AI',
        description: 'AI-powered conversational assistant for various tasks and questions.',
        icon: 'fas fa-robot',
        link: 'https://chat.openai.com',
        rating: 4.7,
        badge: 'New',
        pricing: 'Freemium',
        features: ['Natural language processing', 'Code generation', 'Creative writing'],
        dateAdded: '2023-12-01',
        popularity: 92
      }
    ];
  }
};

// Initialize tools page when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Only initialize on tools page
  if (window.location.pathname.includes('tools.html') || 
      window.location.pathname.endsWith('/tools')) {
    ToolsPage.init();
  }
});

// Make ToolsPage globally available
window.ToolsPage = ToolsPage;