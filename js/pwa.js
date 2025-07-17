// PWA (Progressive Web App) Management for ToolsHub

window.PWA = {
  // Initialize PWA functionality
  init() {
    this.setupElements();
    this.registerServiceWorker();
    this.setupInstallPrompt();
    this.setupEventListeners();
    this.checkStandaloneMode();
  },

  // Setup DOM elements
  setupElements() {
    this.installBanner = Utils.dom.get('pwa-install-banner');
    this.installBtn = Utils.dom.get('pwa-install-btn');
    this.dismissBtn = Utils.dom.get('pwa-dismiss-btn');
    
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isStandalone = false;
  },

  // Setup event listeners
  setupEventListeners() {
    // Install button click
    if (this.installBtn) {
      this.installBtn.addEventListener('click', () => this.installApp());
    }

    // Dismiss button click
    if (this.dismissBtn) {
      this.dismissBtn.addEventListener('click', () => this.dismissInstallPrompt());
    }

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      this.handleBeforeInstallPrompt(e);
    });

    // Listen for appinstalled event
    window.addEventListener('appinstalled', () => {
      this.handleAppInstalled();
    });

    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnlineStatus(true));
    window.addEventListener('offline', () => this.handleOnlineStatus(false));

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        this.handleServiceWorkerUpdate();
      });
    }
  },

  // Register service worker
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        this.handleServiceWorkerUpdateFound(registration);
      });

      // Check for existing service worker
      if (registration.active) {
        this.handleServiceWorkerActivated();
      }

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  },

  // Handle beforeinstallprompt event
  handleBeforeInstallPrompt(e) {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    
    // Save the event for later use
    this.deferredPrompt = e;
    
    // Show install banner if not dismissed
    if (!Storage.pwa.isDismissed() && CONFIG.PWA.SHOW_INSTALL_PROMPT) {
      this.showInstallBanner();
    }
  },

  // Handle app installed event
  handleAppInstalled() {
    console.log('PWA was installed');
    this.isInstalled = true;
    this.hideInstallBanner();
    
    // Clear the deferred prompt
    this.deferredPrompt = null;
    
    // Track installation
    if (CONFIG.ANALYTICS.ENABLED) {
      this.trackInstallation();
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('pwaInstalled'));
  },

  // Show install banner
  showInstallBanner() {
    if (this.installBanner) {
      Utils.dom.removeClass(this.installBanner, 'hidden');
      
      // Auto-hide after 10 seconds
      setTimeout(() => {
        if (!Utils.dom.hasClass(this.installBanner, 'hidden')) {
          this.hideInstallBanner();
        }
      }, 10000);
    }
  },

  // Hide install banner
  hideInstallBanner() {
    if (this.installBanner) {
      Utils.dom.addClass(this.installBanner, 'hidden');
    }
  },

  // Install app
  async installApp() {
    if (!this.deferredPrompt) {
      console.log('Install prompt not available');
      return;
    }

    // Show install prompt
    this.deferredPrompt.prompt();
    
    // Wait for user response
    const { outcome } = await this.deferredPrompt.userChoice;
    
    console.log('Install prompt outcome:', outcome);
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
      this.dismissInstallPrompt();
    }
    
    // Clear the deferred prompt
    this.deferredPrompt = null;
  },

  // Dismiss install prompt
  dismissInstallPrompt() {
    Storage.pwa.dismiss();
    this.hideInstallBanner();
  },

  // Check if app is in standalone mode
  checkStandaloneMode() {
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone ||
                       document.referrer.includes('android-app://');
    
    if (this.isStandalone) {
      document.body.classList.add('pwa-standalone');
      this.hideInstallBanner();
    }

    return this.isStandalone;
  },

  // Handle online/offline status
  handleOnlineStatus(isOnline) {
    document.body.classList.toggle('offline', !isOnline);
    
    if (isOnline) {
      this.showNetworkStatus('Back online', 'success');
      this.syncWhenOnline();
    } else {
      this.showNetworkStatus('You are offline', 'warning');
    }
  },

  // Show network status message
  showNetworkStatus(message, type = 'info') {
    // Create or update status message
    let statusEl = Utils.dom.get('network-status');
    
    if (!statusEl) {
      statusEl = Utils.dom.create('div', {
        id: 'network-status',
        className: `network-status network-status-${type}`
      });
      document.body.appendChild(statusEl);
    }

    statusEl.textContent = message;
    statusEl.className = `network-status network-status-${type}`;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (statusEl) {
        statusEl.remove();
      }
    }, 3000);
  },

  // Sync data when coming back online
  syncWhenOnline() {
    // Implement any sync logic here
    console.log('Syncing data after coming back online');
    
    // Example: sync user data, refresh content, etc.
    if (window.ToolsData && window.ToolsData.refresh) {
      window.ToolsData.refresh();
    }
  },

  // Handle service worker update found
  handleServiceWorkerUpdateFound(registration) {
    const newWorker = registration.installing;
    
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New version available
        this.showUpdateAvailable();
      }
    });
  },

  // Handle service worker activated
  handleServiceWorkerActivated() {
    console.log('Service Worker is active and controlling the page');
  },

  // Handle service worker controller change
  handleServiceWorkerUpdate() {
    console.log('Service Worker updated, reloading page');
    window.location.reload();
  },

  // Show update available notification
  showUpdateAvailable() {
    const updateNotification = Utils.dom.create('div', {
      className: 'update-notification',
      innerHTML: `
        <div class="update-notification-content">
          <i class="fas fa-sync-alt"></i>
          <span>A new version is available!</span>
          <button id="update-btn" class="btn btn-primary btn-sm">Update</button>
          <button id="update-dismiss" class="btn btn-secondary btn-sm">Later</button>
        </div>
      `
    });

    document.body.appendChild(updateNotification);

    // Handle update button click
    Utils.dom.on('#update-btn', 'click', () => {
      this.applyUpdate();
    });

    // Handle dismiss button click
    Utils.dom.on('#update-dismiss', 'click', () => {
      updateNotification.remove();
    });
  },

  // Apply service worker update
  async applyUpdate() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      
      if (registration.waiting) {
        // Tell the waiting service worker to skip waiting and become active
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    }
  },

  // Track PWA installation
  trackInstallation() {
    // Track with analytics if available
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install', {
        event_category: 'engagement',
        event_label: 'PWA Installation'
      });
    }

    // Track with local storage
    const stats = Storage.usage.get();
    stats.pwaInstalled = true;
    stats.pwaInstallDate = new Date().toISOString();
    Storage.usage.set(stats);
  },

  // Get PWA status
  getStatus() {
    return {
      isInstalled: this.isInstalled,
      isStandalone: this.isStandalone,
      hasServiceWorker: 'serviceWorker' in navigator,
      isOnline: navigator.onLine,
      canInstall: !!this.deferredPrompt,
      isDismissed: Storage.pwa.isDismissed()
    };
  },

  // Check if PWA features are supported
  isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },

  // Request notification permission
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  // Show notification
  showNotification(title, options = {}) {
    if (Notification.permission !== 'granted') {
      return;
    }

    const defaultOptions = {
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/icon-72x72.png',
      tag: 'toolshub-notification',
      renotify: true
    };

    const notification = new Notification(title, { ...defaultOptions, ...options });
    
    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  },

  // Add to home screen prompt for iOS
  showIOSInstallInstructions() {
    if (!this.isIOS()) return;

    const instructions = Utils.dom.create('div', {
      className: 'ios-install-instructions',
      innerHTML: `
        <div class="ios-install-content">
          <h3>Install ToolsHub</h3>
          <p>Install this app on your iPhone:</p>
          <ol>
            <li>Tap the Share button <i class="fas fa-share"></i></li>
            <li>Tap "Add to Home Screen" <i class="fas fa-plus-square"></i></li>
            <li>Tap "Add" to confirm</li>
          </ol>
          <button class="ios-install-close">Got it!</button>
        </div>
      `
    });

    document.body.appendChild(instructions);

    // Handle close button
    const closeBtn = instructions.querySelector('.ios-install-close');
    closeBtn.addEventListener('click', () => {
      instructions.remove();
      Storage.pwa.dismiss();
    });
  },

  // Check if device is iOS
  isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  },

  // Check if device is Android
  isAndroid() {
    return /Android/.test(navigator.userAgent);
  },

  // Get install instructions based on platform
  getInstallInstructions() {
    if (this.isIOS()) {
      return {
        platform: 'iOS',
        steps: [
          'Tap the Share button',
          'Tap "Add to Home Screen"',
          'Tap "Add" to confirm'
        ]
      };
    } else if (this.isAndroid()) {
      return {
        platform: 'Android',
        steps: [
          'Tap the menu button',
          'Tap "Add to Home screen"',
          'Tap "Add" to confirm'
        ]
      };
    } else {
      return {
        platform: 'Desktop',
        steps: [
          'Click the install button in the address bar',
          'Click "Install" to confirm'
        ]
      };
    }
  },

  // Cache important resources
  async cacheResources() {
    if (!('caches' in window)) return;

    try {
      const cache = await caches.open(CONFIG.PWA.CACHE_NAME);
      
      const resourcesToCache = [
        '/',
        '/tools.html',
        '/css/style.css',
        '/css/components.css',
        '/js/app.js',
        '/js/config.js',
        '/js/utils.js'
      ];

      await cache.addAll(resourcesToCache);
      console.log('Resources cached successfully');
    } catch (error) {
      console.error('Failed to cache resources:', error);
    }
  },

  // Clear old caches
  async clearOldCaches() {
    if (!('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => name !== CONFIG.PWA.CACHE_NAME);
      
      await Promise.all(
        oldCaches.map(cacheName => caches.delete(cacheName))
      );
      
      console.log('Old caches cleared');
    } catch (error) {
      console.error('Failed to clear old caches:', error);
    }
  },

  // Debug PWA information
  debug() {
    if (!CONFIG.DEBUG.ENABLED) return;

    console.group('PWA Debug Information');
    console.log('PWA Status:', this.getStatus());
    console.log('Install Instructions:', this.getInstallInstructions());
    console.log('Service Worker Registration:', navigator.serviceWorker.controller);
    console.log('Cache API Support:', 'caches' in window);
    console.log('Notification Support:', 'Notification' in window);
    console.groupEnd();
  }
};

// Add PWA styles
const addPWAStyles = () => {
  const style = Utils.dom.create('style', {
    innerHTML: `
      .network-status {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
      }
      
      .network-status-success {
        background: #10b981;
      }
      
      .network-status-warning {
        background: #f59e0b;
      }
      
      .network-status-info {
        background: #3b82f6;
      }
      
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      .update-notification {
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 16px;
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        animation: slideInUp 0.3s ease;
      }
      
      .update-notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .update-notification i {
        color: var(--primary-color);
        font-size: 18px;
      }
      
      .update-notification span {
        flex: 1;
        font-weight: 500;
      }
      
      @keyframes slideInUp {
        from {
          transform: translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      .ios-install-instructions {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
      }
      
      .ios-install-content {
        background: var(--bg-color);
        border-radius: 16px;
        padding: 24px;
        max-width: 350px;
        text-align: center;
      }
      
      .ios-install-content h3 {
        margin-bottom: 16px;
        color: var(--text-primary);
      }
      
      .ios-install-content ol {
        text-align: left;
        margin: 16px 0;
        padding-left: 20px;
      }
      
      .ios-install-content li {
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .ios-install-close {
        background: var(--primary-color);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        margin-top: 16px;
      }
      
      .pwa-standalone {
        padding-top: env(safe-area-inset-top);
        padding-bottom: env(safe-area-inset-bottom);
      }
      
      body.offline {
        filter: grayscale(0.3);
      }
      
      body.offline::before {
        content: 'Offline Mode';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #f59e0b;
        color: white;
        text-align: center;
        padding: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 9999;
      }
    `
  });
  
  document.head.appendChild(style);
};

// Initialize PWA when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  if (CONFIG.FEATURES.PWA_INSTALL) {
    addPWAStyles();
    PWA.init();
  }
});

// Make PWA globally available
window.PWA = PWA;