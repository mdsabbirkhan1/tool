// Main Application Controller for ToolsHub

window.App = {
  // Initialize application
  init() {
    this.setupGlobalErrorHandling();
    this.initializeComponents();
    this.setupEventListeners();
    this.loadInitialData();
    this.setupLazyLoading();
    this.handleCookieConsent();
    this.setupKeyboardShortcuts();
    this.checkPerformance();
  },

  // Setup global error handling
  setupGlobalErrorHandling() {
    if (CONFIG.ERROR_HANDLING.LOG_ERRORS) {
      window.addEventListener('error', (event) => {
        this.handleError('JavaScript Error', event.error, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.handleError('Unhandled Promise Rejection', event.reason);
      });
    }
  },

  // Initialize all components
  initializeComponents() {
    // Initialize theme first (affects other components)
    if (CONFIG.FEATURES.DARK_MODE && window.Theme) {
      Theme.init();
    }

    // Initialize storage
    if (window.Storage) {
      Storage.init();
    }

    // Initialize search
    if (CONFIG.FEATURES.SEARCH && window.Search) {
      Search.init();
    }

    // Initialize PWA
    if (CONFIG.FEATURES.PWA_INSTALL && window.PWA) {
      PWA.init();
    }

    // Initialize mobile menu
    this.initMobileMenu();
    
    // Initialize cookie consent
    this.initCookieConsent();
  },

  // Setup global event listeners
  setupEventListeners() {
    // Mobile menu toggle
    const menuToggle = Utils.dom.get('menu-toggle');
    const mobileMenu = Utils.dom.get('mobile-menu');
    
    if (menuToggle && mobileMenu) {
      menuToggle.addEventListener('click', () => {
        Utils.dom.toggle(mobileMenu, 'active');
      });
    }

    // Smooth scrolling for anchor links
    document.addEventListener('click', (e) => {
      if (e.target.matches('a[href^="#"]')) {
        this.handleSmoothScroll(e);
      }
    });

    // Handle window resize
    window.addEventListener('resize', Utils.performance.throttle(() => {
      this.handleResize();
    }, 250));

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });

    // Listen for storage events from other tabs
    window.addEventListener('storage', (e) => {
      this.handleStorageChange(e);
    });
  },

  // Load initial data for homepage
  async loadInitialData() {
    try {
      Utils.dom.addClass('#loading-spinner', 'hidden');
      
      if (this.isHomePage()) {
        await Promise.all([
          this.loadPopularCategories(),
          this.loadPopularTools(),
          this.loadRecentTools()
        ]);
      }
    } catch (error) {
      this.handleError('Data Loading Error', error);
    }
  },

  // Check if current page is homepage
  isHomePage() {
    return window.location.pathname === '/' || 
           window.location.pathname === '/index.html' ||
           window.location.pathname.endsWith('/');
  },

  // Load popular categories for homepage
  async loadPopularCategories() {
    const categoriesGrid = Utils.dom.get('categories-grid');
    if (!categoriesGrid) return;

    try {
      // Mock data - replace with actual data loading
      const categories = this.getMockCategories();
      
      const categoriesHTML = categories.map(category => `
        <a href="tools.html?category=${category.slug}" class="category-card">
          <i class="category-icon ${category.icon}"></i>
          <h3 class="category-name">${category.name}</h3>
          <p class="category-count">${category.count} tools</p>
        </a>
      `).join('');

      categoriesGrid.innerHTML = categoriesHTML;
      
      // Add animation
      this.animateElements('.category-card');
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  },

  // Load popular tools for homepage
  async loadPopularTools() {
    const toolsGrid = Utils.dom.get('popular-tools-grid');
    if (!toolsGrid) return;

    try {
      // Get popular tools from usage statistics
      const popularTools = Storage.usage.getPopularTools(6);
      
      if (popularTools.length === 0) {
        // Show mock data if no usage statistics
        const mockTools = this.getMockPopularTools();
        this.renderToolsGrid(toolsGrid, mockTools);
      } else {
        // TODO: Fetch full tool data based on popular tool IDs
        this.renderToolsGrid(toolsGrid, popularTools);
      }
      
      // Add animation
      this.animateElements('.tool-card');
    } catch (error) {
      console.error('Error loading popular tools:', error);
    }
  },

  // Load recent tools for homepage
  async loadRecentTools() {
    const toolsGrid = Utils.dom.get('recent-tools-grid');
    if (!toolsGrid) return;

    try {
      // Mock recent tools - replace with actual data
      const recentTools = this.getMockRecentTools();
      this.renderToolsGrid(toolsGrid, recentTools);
      
      // Add animation
      this.animateElements('.tool-card');
    } catch (error) {
      console.error('Error loading recent tools:', error);
    }
  },

  // Render tools grid
  renderToolsGrid(container, tools) {
    const toolsHTML = tools.map(tool => this.createToolCard(tool)).join('');
    container.innerHTML = toolsHTML;
    
    // Add click tracking
    this.setupToolTracking(container);
  },

  // Create tool card HTML
  createToolCard(tool) {
    const isFavorite = Storage.favorites.isFavorite(tool.id);
    const rating = tool.rating || 4.5;
    const ratingStars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));

    return `
      <div class="tool-card" data-tool-id="${tool.id}">
        <div class="tool-header">
          <div class="tool-icon">
            <i class="${tool.icon}"></i>
          </div>
          <div class="tool-info">
            <h3>${tool.name}</h3>
            <span class="tool-category">${tool.category}</span>
          </div>
        </div>
        <p class="tool-description">${Utils.string.truncate(tool.description, 120)}</p>
        <div class="tool-footer">
          <div class="tool-rating">
            <span class="tool-rating-stars">${ratingStars}</span>
            <span class="tool-rating-value">${rating}</span>
          </div>
          <div class="tool-badges">
            ${tool.badge ? `<span class="tool-badge ${tool.badge.toLowerCase()}">${tool.badge}</span>` : ''}
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

  // Setup tool click tracking
  setupToolTracking(container) {
    // Track tool visits
    container.addEventListener('click', (e) => {
      if (e.target.closest('.tool-visit-btn')) {
        const toolCard = e.target.closest('.tool-card');
        const toolId = toolCard.dataset.toolId;
        const toolName = toolCard.querySelector('h3').textContent;
        const category = toolCard.querySelector('.tool-category').textContent;
        
        if (CONFIG.ANALYTICS.TRACK_CLICKS) {
          Storage.usage.trackToolClick(toolId, toolName, category);
        }
      }
    });

    // Handle favorite buttons
    container.addEventListener('click', (e) => {
      if (e.target.closest('.tool-favorite-btn')) {
        e.preventDefault();
        this.handleFavoriteToggle(e.target.closest('.tool-favorite-btn'));
      }
    });
  },

  // Handle favorite toggle
  handleFavoriteToggle(button) {
    const toolId = button.dataset.toolId;
    const toolCard = button.closest('.tool-card');
    const toolData = {
      id: toolId,
      name: toolCard.querySelector('h3').textContent,
      category: toolCard.querySelector('.tool-category').textContent,
      icon: toolCard.querySelector('.tool-icon i').className,
      link: toolCard.querySelector('.tool-visit-btn').href,
      description: toolCard.querySelector('.tool-description').textContent
    };

    const wasToggled = Storage.favorites.toggle(toolId, toolData);
    
    if (wasToggled) {
      button.classList.toggle('active');
      const icon = button.querySelector('i');
      
      if (button.classList.contains('active')) {
        button.title = 'Remove from favorites';
        icon.style.color = '#ef4444';
        this.showToast('Added to favorites', 'success');
      } else {
        button.title = 'Add to favorites';
        icon.style.color = '';
        this.showToast('Removed from favorites', 'info');
      }
    }
  },

  // Initialize mobile menu
  initMobileMenu() {
    const menuToggle = Utils.dom.get('menu-toggle');
    const mobileMenu = Utils.dom.get('mobile-menu');
    
    if (!menuToggle || !mobileMenu) return;

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!menuToggle.contains(e.target) && !mobileMenu.contains(e.target)) {
        Utils.dom.removeClass(mobileMenu, 'active');
      }
    });

    // Close menu when clicking on menu links
    mobileMenu.addEventListener('click', (e) => {
      if (e.target.classList.contains('mobile-link')) {
        Utils.dom.removeClass(mobileMenu, 'active');
      }
    });
  },

  // Initialize cookie consent
  initCookieConsent() {
    if (!CONFIG.COOKIES.SHOW_CONSENT) return;

    const hasConsented = Storage.cookieConsent.hasConsented();
    
    if (!hasConsented) {
      setTimeout(() => {
        this.showCookieConsent();
      }, 2000); // Show after 2 seconds
    }
  },

  // Show cookie consent banner
  showCookieConsent() {
    const cookieConsent = Utils.dom.get('cookie-consent');
    if (!cookieConsent) return;

    Utils.dom.removeClass(cookieConsent, 'hidden');
    Utils.dom.addClass(cookieConsent, 'active');

    // Handle accept button
    const acceptBtn = Utils.dom.get('cookie-accept');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', () => {
        Storage.cookieConsent.accept();
        this.hideCookieConsent();
        this.showToast('Cookie preferences saved', 'success');
      });
    }

    // Handle decline button
    const declineBtn = Utils.dom.get('cookie-decline');
    if (declineBtn) {
      declineBtn.addEventListener('click', () => {
        Storage.cookieConsent.decline();
        this.hideCookieConsent();
        this.showToast('Only essential cookies will be used', 'info');
      });
    }
  },

  // Hide cookie consent banner
  hideCookieConsent() {
    const cookieConsent = Utils.dom.get('cookie-consent');
    if (cookieConsent) {
      Utils.dom.removeClass(cookieConsent, 'active');
      Utils.dom.addClass(cookieConsent, 'hidden');
    }
  },

  // Handle cookie consent
  handleCookieConsent() {
    // Listen for cookie consent events
    window.addEventListener('cookieConsent', (e) => {
      if (e.detail.accepted) {
        // Enable analytics and tracking
        this.enableAnalytics();
      } else {
        // Disable non-essential features
        this.disableNonEssentialFeatures();
      }
    });
  },

  // Setup lazy loading
  setupLazyLoading() {
    if (!CONFIG.PERFORMANCE.LAZY_LOADING) return;

    // Intersection Observer for lazy loading
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });

    // Observe all lazy images
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  },

  // Setup keyboard shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Only handle shortcuts when no input is focused
      if (this.isInputFocused()) return;

      switch (e.code) {
        case 'KeyH':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            window.location.href = '/';
          }
          break;
        
        case 'KeyT':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            window.location.href = '/tools.html';
          }
          break;
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

  // Handle smooth scrolling
  handleSmoothScroll(e) {
    e.preventDefault();
    const targetId = e.target.getAttribute('href').substring(1);
    const targetElement = Utils.dom.get(targetId);
    
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  },

  // Handle window resize
  handleResize() {
    // Update mobile menu visibility
    const mobileMenu = Utils.dom.get('mobile-menu');
    if (mobileMenu && window.innerWidth > 768) {
      Utils.dom.removeClass(mobileMenu, 'active');
    }

    // Update layout calculations
    this.updateLayoutCalculations();
  },

  // Handle visibility change
  handleVisibilityChange() {
    if (document.hidden) {
      // Page is hidden
      this.pauseAnimations();
    } else {
      // Page is visible
      this.resumeAnimations();
    }
  },

  // Handle storage changes from other tabs
  handleStorageChange(e) {
    switch (e.key) {
      case CONFIG.STORAGE_KEYS.THEME:
        if (window.Theme) {
          Theme.applyTheme(e.newValue, false);
        }
        break;
      
      case CONFIG.STORAGE_KEYS.FAVORITES:
        this.updateFavoriteButtons();
        break;
    }
  },

  // Update favorite buttons state
  updateFavoriteButtons() {
    document.querySelectorAll('.tool-favorite-btn').forEach(button => {
      const toolId = button.dataset.toolId;
      const isFavorite = Storage.favorites.isFavorite(toolId);
      
      button.classList.toggle('active', isFavorite);
      button.title = isFavorite ? 'Remove from favorites' : 'Add to favorites';
    });
  },

  // Animate elements
  animateElements(selector) {
    if (!CONFIG.ANIMATIONS.ENABLED) return;

    const elements = document.querySelectorAll(selector);
    elements.forEach((element, index) => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        element.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, 50);
    });
  },

  // Show toast notification
  showToast(message, type = 'info', duration = 3000) {
    const toast = Utils.dom.create('div', {
      className: `toast toast-${type}`,
      innerHTML: `
        <div class="toast-content">
          <i class="toast-icon fas ${this.getToastIcon(type)}"></i>
          <span class="toast-message">${message}</span>
        </div>
      `
    });

    // Add toast styles if not already added
    this.addToastStyles();

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.classList.add('toast-show');
    }, 10);

    // Remove after duration
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
  },

  // Get toast icon based on type
  getToastIcon(type) {
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
  },

  // Add toast styles
  addToastStyles() {
    if (document.querySelector('#toast-styles')) return;

    const style = Utils.dom.create('style', {
      id: 'toast-styles',
      innerHTML: `
        .toast {
          position: fixed;
          top: 20px;
          right: 20px;
          background: var(--bg-color);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 12px 16px;
          box-shadow: var(--shadow-lg);
          z-index: 10000;
          transform: translateX(100%);
          transition: transform 0.3s ease;
          max-width: 350px;
        }
        
        .toast.toast-show {
          transform: translateX(0);
        }
        
        .toast-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .toast-icon {
          flex-shrink: 0;
        }
        
        .toast-success .toast-icon { color: var(--success-color); }
        .toast-error .toast-icon { color: var(--error-color); }
        .toast-warning .toast-icon { color: var(--warning-color); }
        .toast-info .toast-icon { color: var(--primary-color); }
        
        .toast-message {
          font-size: 14px;
          font-weight: 500;
        }
      `
    });

    document.head.appendChild(style);
  },

  // Enable analytics
  enableAnalytics() {
    if (!CONFIG.ANALYTICS.ENABLED) return;
    
    // Initialize analytics here
    console.log('Analytics enabled');
  },

  // Disable non-essential features
  disableNonEssentialFeatures() {
    // Disable tracking, analytics, etc.
    console.log('Non-essential features disabled');
  },

  // Update layout calculations
  updateLayoutCalculations() {
    // Recalculate any layout-dependent features
  },

  // Pause animations when page is hidden
  pauseAnimations() {
    if (CONFIG.ANIMATIONS.ENABLED) {
      document.body.style.animationPlayState = 'paused';
    }
  },

  // Resume animations when page is visible
  resumeAnimations() {
    if (CONFIG.ANIMATIONS.ENABLED) {
      document.body.style.animationPlayState = 'running';
    }
  },

  // Check performance and optimize
  checkPerformance() {
    if (CONFIG.DEBUG.SHOW_PERFORMANCE) {
      console.log('Page Load Performance:', performance.now() + 'ms');
    }
  },

  // Handle errors
  handleError(type, error, details = {}) {
    console.error(`${type}:`, error, details);
    
    if (CONFIG.ERROR_HANDLING.SHOW_ERRORS) {
      this.showToast(`${type}: ${error.message}`, 'error');
    }
  },

  // Get mock data (replace with real data loading)
  getMockCategories() {
    return [
      { name: 'Development', slug: 'development', icon: 'fas fa-code', count: 45 },
      { name: 'Design', slug: 'design', icon: 'fas fa-palette', count: 32 },
      { name: 'Productivity', slug: 'productivity', icon: 'fas fa-rocket', count: 28 },
      { name: 'Marketing', slug: 'marketing', icon: 'fas fa-bullhorn', count: 21 },
      { name: 'Analytics', slug: 'analytics', icon: 'fas fa-chart-bar', count: 18 },
      { name: 'AI Tools', slug: 'ai', icon: 'fas fa-brain', count: 15 }
    ];
  },

  getMockPopularTools() {
    return [
      {
        id: 'figma',
        name: 'Figma',
        category: 'Design',
        description: 'Collaborative design tool for teams',
        icon: 'fab fa-figma',
        link: 'https://figma.com',
        rating: 4.8,
        badge: 'Popular'
      },
      {
        id: 'vscode',
        name: 'VS Code',
        category: 'Development',
        description: 'Powerful code editor with extensions',
        icon: 'fas fa-code',
        link: 'https://code.visualstudio.com',
        rating: 4.9,
        badge: 'Free'
      }
    ];
  },

  getMockRecentTools() {
    return [
      {
        id: 'chatgpt',
        name: 'ChatGPT',
        category: 'AI',
        description: 'AI-powered conversational assistant',
        icon: 'fas fa-robot',
        link: 'https://chat.openai.com',
        rating: 4.7,
        badge: 'New'
      }
    ];
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  App.init();
});

// Make App globally available
window.App = App;