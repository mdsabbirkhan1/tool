// Theme Management System for ToolsHub

window.Theme = {
  // Initialize theme system
  init() {
    this.setupElements();
    this.setupEventListeners();
    this.loadSavedTheme();
    this.setupSystemThemeDetection();
    this.setupKeyboardShortcuts();
  },

  // Setup DOM elements
  setupElements() {
    this.themeToggle = Utils.dom.get('theme-toggle');
    this.themeIcon = this.themeToggle?.querySelector('i');
    this.currentTheme = Storage.theme.get();
  },

  // Setup event listeners
  setupEventListeners() {
    // Theme toggle button
    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', () => this.toggle());
    }

    // Listen for theme changes from other tabs/windows
    window.addEventListener('storage', (e) => {
      if (e.key === CONFIG.STORAGE_KEYS.THEME) {
        this.applyTheme(e.newValue || CONFIG.DEFAULT_THEME);
      }
    });

    // Listen for custom theme change events
    window.addEventListener('themeChanged', (e) => {
      this.onThemeChanged(e.detail.theme);
    });

    // System theme preference changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addListener((e) => this.onSystemThemeChange(e));
    }
  },

  // Setup keyboard shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Shift + L to toggle theme
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        this.toggle();
      }
    });
  },

  // Load saved theme
  loadSavedTheme() {
    const savedTheme = Storage.theme.get();
    this.applyTheme(savedTheme);
  },

  // Setup system theme detection
  setupSystemThemeDetection() {
    // Only apply system theme if no theme is saved
    const savedTheme = Storage.theme.get();
    if (!savedTheme) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemTheme = prefersDark ? CONFIG.THEMES.DARK : CONFIG.THEMES.LIGHT;
      this.applyTheme(systemTheme, false); // Don't save to storage
    }
  },

  // Apply theme
  applyTheme(theme, save = true) {
    // Validate theme
    if (!Object.values(CONFIG.THEMES).includes(theme)) {
      theme = CONFIG.DEFAULT_THEME;
    }

    // Set CSS custom property for smooth transitions
    if (CONFIG.ANIMATIONS.ENABLED) {
      document.documentElement.style.setProperty('--theme-transition', '0.3s ease');
    }

    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    this.currentTheme = theme;

    // Update icon
    this.updateThemeIcon(theme);

    // Save to storage if requested
    if (save) {
      Storage.theme.set(theme);
    }

    // Update meta theme-color for mobile browsers
    this.updateMetaThemeColor(theme);

    // Dispatch theme applied event
    window.dispatchEvent(new CustomEvent('themeApplied', {
      detail: { theme, saved: save }
    }));

    // Remove transition after animation completes
    if (CONFIG.ANIMATIONS.ENABLED) {
      setTimeout(() => {
        document.documentElement.style.removeProperty('--theme-transition');
      }, 300);
    }
  },

  // Toggle theme
  toggle() {
    const newTheme = this.currentTheme === CONFIG.THEMES.LIGHT ? 
      CONFIG.THEMES.DARK : CONFIG.THEMES.LIGHT;
    
    this.applyTheme(newTheme);
    
    // Add visual feedback
    this.addToggleFeedback();
    
    return newTheme;
  },

  // Get current theme
  get() {
    return this.currentTheme;
  },

  // Set specific theme
  set(theme) {
    if (Object.values(CONFIG.THEMES).includes(theme)) {
      this.applyTheme(theme);
    }
  },

  // Check if dark theme is active
  isDark() {
    return this.currentTheme === CONFIG.THEMES.DARK;
  },

  // Check if light theme is active
  isLight() {
    return this.currentTheme === CONFIG.THEMES.LIGHT;
  },

  // Update theme icon
  updateThemeIcon(theme) {
    if (!this.themeIcon) return;

    // Remove existing theme classes
    this.themeIcon.className = this.themeIcon.className
      .replace(/fa-moon|fa-sun/g, '').trim();

    // Add appropriate icon class
    if (theme === CONFIG.THEMES.DARK) {
      this.themeIcon.classList.add('fa-sun');
      this.themeToggle.setAttribute('title', 'Switch to light mode');
    } else {
      this.themeIcon.classList.add('fa-moon');
      this.themeToggle.setAttribute('title', 'Switch to dark mode');
    }
  },

  // Update meta theme color for mobile browsers
  updateMetaThemeColor(theme) {
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      document.head.appendChild(themeColorMeta);
    }

    // Set appropriate color based on theme
    const colors = {
      [CONFIG.THEMES.LIGHT]: '#ffffff',
      [CONFIG.THEMES.DARK]: '#0f172a'
    };

    themeColorMeta.content = colors[theme] || colors[CONFIG.THEMES.LIGHT];
  },

  // Add visual feedback when toggling theme
  addToggleFeedback() {
    if (!this.themeToggle || !CONFIG.ANIMATIONS.ENABLED) return;

    // Add animation class
    this.themeToggle.classList.add('theme-toggle-animation');

    // Remove animation class after animation completes
    setTimeout(() => {
      this.themeToggle.classList.remove('theme-toggle-animation');
    }, 200);
  },

  // Handle system theme change
  onSystemThemeChange(mediaQuery) {
    // Only apply system theme if user hasn't manually set a theme
    const hasManualTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
    
    if (!hasManualTheme) {
      const systemTheme = mediaQuery.matches ? CONFIG.THEMES.DARK : CONFIG.THEMES.LIGHT;
      this.applyTheme(systemTheme, false);
    }
  },

  // Handle theme change events
  onThemeChanged(theme) {
    this.currentTheme = theme;
    this.updateThemeIcon(theme);
    this.updateMetaThemeColor(theme);
    
    // Notify other components about theme change
    this.notifyThemeChange(theme);
  },

  // Notify other components about theme changes
  notifyThemeChange(theme) {
    // Update any charts, graphs, or other components that need theme updates
    const themeEvent = new CustomEvent('themeChanged', {
      detail: { 
        theme: theme,
        isDark: theme === CONFIG.THEMES.DARK,
        isLight: theme === CONFIG.THEMES.LIGHT,
        timestamp: Date.now()
      }
    });

    // Dispatch to specific elements that might need theme updates
    document.querySelectorAll('[data-theme-aware]').forEach(element => {
      element.dispatchEvent(themeEvent);
    });
  },

  // Get theme-aware colors
  getColors() {
    const isDark = this.isDark();
    
    return {
      primary: isDark ? '#3b82f6' : '#3b82f6',
      secondary: isDark ? '#6b7280' : '#6b7280',
      background: isDark ? '#0f172a' : '#ffffff',
      backgroundSecondary: isDark ? '#1e293b' : '#f8fafc',
      text: isDark ? '#f8fafc' : '#1f2937',
      textSecondary: isDark ? '#cbd5e1' : '#6b7280',
      border: isDark ? '#334155' : '#e5e7eb',
      accent: '#f59e0b',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    };
  },

  // Apply theme to specific element
  applyToElement(element, theme = this.currentTheme) {
    if (element) {
      element.setAttribute('data-theme', theme);
    }
  },

  // Remove theme from specific element
  removeFromElement(element) {
    if (element) {
      element.removeAttribute('data-theme');
    }
  },

  // Get CSS custom properties for current theme
  getCSSProperties() {
    const style = getComputedStyle(document.documentElement);
    const properties = {};
    
    // Get all CSS custom properties that start with --
    Array.from(document.styleSheets).forEach(styleSheet => {
      try {
        Array.from(styleSheet.cssRules).forEach(rule => {
          if (rule.style) {
            Array.from(rule.style).forEach(property => {
              if (property.startsWith('--')) {
                properties[property] = style.getPropertyValue(property).trim();
              }
            });
          }
        });
      } catch (e) {
        // Ignore cross-origin stylesheets
      }
    });

    return properties;
  },

  // Set CSS custom property value
  setCSSProperty(property, value) {
    document.documentElement.style.setProperty(property, value);
  },

  // Get CSS custom property value
  getCSSProperty(property) {
    return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
  },

  // Preload theme assets
  preloadThemeAssets() {
    // Preload any theme-specific images or assets
    const themes = Object.values(CONFIG.THEMES);
    
    themes.forEach(theme => {
      // Create link element for preloading
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = `css/themes/${theme}.css`;
      
      // Only add if file exists (you can check this or handle errors)
      document.head.appendChild(link);
    });
  },

  // Export theme settings
  exportSettings() {
    return {
      currentTheme: this.currentTheme,
      systemPreference: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      hasManualOverride: !!localStorage.getItem(CONFIG.STORAGE_KEYS.THEME),
      timestamp: new Date().toISOString()
    };
  },

  // Import theme settings
  importSettings(settings) {
    if (settings && settings.currentTheme) {
      this.applyTheme(settings.currentTheme);
    }
  },

  // Reset to system theme
  resetToSystem() {
    // Remove manual theme preference
    Storage.theme.remove();
    
    // Apply system theme
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const systemTheme = prefersDark ? CONFIG.THEMES.DARK : CONFIG.THEMES.LIGHT;
    
    this.applyTheme(systemTheme, false);
  },

  // Check if theme transition is supported
  supportsTransition() {
    return CSS.supports('transition', 'color 0.3s ease');
  },

  // Add theme transition styles
  addTransitionStyles() {
    if (!this.supportsTransition()) return;

    const style = document.createElement('style');
    style.textContent = `
      * {
        transition: 
          background-color var(--theme-transition, 0.3s ease),
          color var(--theme-transition, 0.3s ease),
          border-color var(--theme-transition, 0.3s ease),
          box-shadow var(--theme-transition, 0.3s ease);
      }
      
      .theme-toggle-animation {
        transform: rotate(180deg);
        transition: transform 0.2s ease;
      }
    `;
    
    document.head.appendChild(style);
  },

  // Remove theme transition styles
  removeTransitionStyles() {
    const style = document.querySelector('style[data-theme-transitions]');
    if (style) {
      style.remove();
    }
  },

  // Debug theme information
  debug() {
    if (!CONFIG.DEBUG.ENABLED) return;

    console.group('Theme Debug Information');
    console.log('Current Theme:', this.currentTheme);
    console.log('System Preference:', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    console.log('Saved Theme:', Storage.theme.get());
    console.log('Theme Colors:', this.getColors());
    console.log('CSS Properties:', this.getCSSProperties());
    console.groupEnd();
  }
};

// Add CSS for theme transitions
const addThemeCSS = () => {
  const style = document.createElement('style');
  style.setAttribute('data-theme-transitions', '');
  style.textContent = `
    .theme-toggle-animation {
      animation: themeToggleRotate 0.2s ease;
    }
    
    @keyframes themeToggleRotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(180deg); }
    }
    
    /* Smooth theme transitions */
    :root {
      transition: color-scheme 0.3s ease;
    }
    
    [data-theme] {
      color-scheme: light;
    }
    
    [data-theme="dark"] {
      color-scheme: dark;
    }
  `;
  
  document.head.appendChild(style);
};

// Initialize theme system when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  if (CONFIG.FEATURES.DARK_MODE) {
    addThemeCSS();
    Theme.init();
  }
});

// Make Theme globally available
window.Theme = Theme;