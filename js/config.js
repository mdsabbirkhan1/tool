// Website Configuration
window.CONFIG = {
  // Site Information
  SITE_NAME: 'ToolsHub',
  SITE_DESCRIPTION: 'Your Ultimate Digital Toolkit',
  SITE_URL: window.location.origin,
  
  // API and Data Configuration
  DATA_PATH: 'data/',
  TOOLS_PER_PAGE: 12,
  SEARCH_DEBOUNCE: 300,
  LAZY_LOAD_THRESHOLD: '100px',
  
  // Theme Configuration
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark'
  },
  DEFAULT_THEME: 'light',
  
  // Local Storage Keys
  STORAGE_KEYS: {
    THEME: 'toolshub_theme',
    USAGE_STATS: 'toolshub_usage_stats',
    FAVORITES: 'toolshub_favorites',
    SEARCH_HISTORY: 'toolshub_search_history',
    COOKIE_CONSENT: 'toolshub_cookie_consent',
    PWA_DISMISSED: 'toolshub_pwa_dismissed',
    USER_PREFERENCES: 'toolshub_user_preferences'
  },
  
  // PWA Configuration
  PWA: {
    SHOW_INSTALL_PROMPT: true,
    AUTO_UPDATE: true,
    CACHE_NAME: 'toolshub-v1',
    OFFLINE_PAGE: '/offline.html'
  },
  
  // Analytics Configuration
  ANALYTICS: {
    ENABLED: true,
    TRACK_CLICKS: true,
    TRACK_SEARCH: true,
    TRACK_USAGE: true
  },
  
  // Search Configuration
  SEARCH: {
    MIN_CHARACTERS: 2,
    MAX_RESULTS: 20,
    HIGHLIGHT_MATCHES: true,
    SEARCH_FIELDS: ['name', 'description', 'category', 'features']
  },
  
  // Filter Configuration
  FILTERS: {
    DEFAULT_SORT: 'popular',
    AVAILABLE_SORTS: [
      { value: 'popular', label: 'Most Popular' },
      { value: 'newest', label: 'Newest First' },
      { value: 'oldest', label: 'Oldest First' },
      { value: 'name', label: 'Name A-Z' },
      { value: 'rating', label: 'Highest Rated' }
    ]
  },
  
  // Animation Configuration
  ANIMATIONS: {
    ENABLED: true,
    DURATION: {
      FAST: 150,
      NORMAL: 200,
      SLOW: 300
    },
    EASING: 'ease-in-out'
  },
  
  // Cookie Configuration
  COOKIES: {
    SHOW_CONSENT: true,
    CONSENT_DURATION: 365, // days
    ESSENTIAL_ONLY: false
  },
  
  // Advertisement Configuration
  ADS: {
    ENABLED: true,
    ADSTERRA_BANNER: true,
    BANNER_ID: '', // Will be filled when AdsTerra code is added
    REFRESH_INTERVAL: 30000 // 30 seconds
  },
  
  // Performance Configuration
  PERFORMANCE: {
    LAZY_LOADING: true,
    IMAGE_OPTIMIZATION: true,
    PRELOAD_CRITICAL: true,
    CACHE_TOOLS: true,
    VIRTUAL_SCROLLING: false // For large lists
  },
  
  // Social Sharing
  SOCIAL: {
    ENABLED: true,
    PLATFORMS: ['twitter', 'facebook', 'linkedin', 'whatsapp'],
    DEFAULT_TEXT: 'Check out this amazing tool from ToolsHub!'
  },
  
  // Feature Flags
  FEATURES: {
    DARK_MODE: true,
    PWA_INSTALL: true,
    SEARCH: true,
    FAVORITES: true,
    USAGE_TRACKING: true,
    OFFLINE_MODE: true,
    EXPORT_TOOLS: false,
    USER_ACCOUNTS: false,
    TOOL_SUBMISSIONS: false
  },
  
  // Error Handling
  ERROR_HANDLING: {
    SHOW_ERRORS: false, // Set to true for development
    LOG_ERRORS: true,
    FALLBACK_MESSAGE: 'Something went wrong. Please try again.',
    RETRY_ATTEMPTS: 3
  },
  
  // URL Configuration
  URLS: {
    PRIVACY_POLICY: '#privacy',
    TERMS_OF_SERVICE: '#terms',
    CONTACT: '#contact',
    ABOUT: '#about',
    GITHUB: 'https://github.com/toolshub',
    TWITTER: 'https://twitter.com/toolshub',
    FACEBOOK: 'https://facebook.com/toolshub',
    LINKEDIN: 'https://linkedin.com/company/toolshub'
  },
  
  // Tool Categories Configuration
  CATEGORIES: {
    // This will be populated from data files
    DEFAULT_ICON: 'fas fa-tools',
    COLORS: {
      development: '#3b82f6',
      design: '#f59e0b',
      productivity: '#10b981',
      marketing: '#ef4444',
      analytics: '#8b5cf6',
      ai: '#06b6d4',
      writing: '#f97316',
      finance: '#84cc16',
      education: '#ec4899',
      health: '#14b8a6',
      entertainment: '#6366f1',
      business: '#64748b',
      communication: '#22c55e',
      security: '#dc2626',
      lifestyle: '#a855f7'
    }
  },
  
  // Validation Rules
  VALIDATION: {
    TOOL_NAME: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 100
    },
    TOOL_DESCRIPTION: {
      MIN_LENGTH: 10,
      MAX_LENGTH: 500
    },
    SEARCH_QUERY: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 100
    }
  },
  
  // Rate Limiting
  RATE_LIMIT: {
    SEARCH_REQUESTS: 10, // per minute
    CLICK_TRACKING: 100, // per minute
    API_CALLS: 60 // per minute
  },
  
  // Keyboard Shortcuts
  KEYBOARD_SHORTCUTS: {
    SEARCH: 'KeyS',
    THEME_TOGGLE: 'KeyT',
    HOME: 'KeyH',
    TOOLS: 'KeyT'
  },
  
  // Responsive Breakpoints
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    XXL: 1536
  },
  
  // Development Settings
  DEBUG: {
    ENABLED: false,
    LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
    SHOW_PERFORMANCE: false,
    MOCK_DATA: false
  }
};

// Initialize configuration
document.addEventListener('DOMContentLoaded', function() {
  // Set theme based on user preference
  const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (prefersDark ? CONFIG.THEMES.DARK : CONFIG.THEMES.LIGHT);
  
  document.documentElement.setAttribute('data-theme', theme);
  
  // Initialize debug mode
  if (CONFIG.DEBUG.ENABLED) {
    console.log('ToolsHub Debug Mode Enabled');
    console.log('Configuration:', CONFIG);
    window.CONFIG = CONFIG; // Make config globally accessible in debug mode
  }
  
  // Check for reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    CONFIG.ANIMATIONS.ENABLED = false;
    document.body.classList.add('reduced-motion');
  }
  
  // Set up error handling
  if (CONFIG.ERROR_HANDLING.LOG_ERRORS) {
    window.addEventListener('error', function(event) {
      console.error('Global Error:', event.error);
      // Here you could send error to analytics service
    });
    
    window.addEventListener('unhandledrejection', function(event) {
      console.error('Unhandled Promise Rejection:', event.reason);
      // Here you could send error to analytics service
    });
  }
});

// Export configuration for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}