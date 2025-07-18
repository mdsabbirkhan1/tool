// PWA Manager - Handles Progressive Web App functionality
class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        
        this.init();
    }

    init() {
        this.checkInstallation();
        this.setupInstallPrompt();
        this.setupServiceWorker();
        this.setupAppUpdates();
    }

    checkInstallation() {
        // Check if app is running in standalone mode (installed as PWA)
        if (window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone === true) {
            this.isInstalled = true;
            console.log('App is running as PWA');
        }

        // Check for BeforeInstallPrompt support
        if ('serviceWorker' in navigator) {
            console.log('PWA features supported');
        }
    }

    setupInstallPrompt() {
        const installPopup = document.getElementById('pwa-install-popup');
        const installBtn = document.getElementById('pwa-install-btn');
        const dismissBtn = document.getElementById('pwa-dismiss-btn');

        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('BeforeInstallPrompt event fired');
            
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            
            // Store the event so it can be triggered later
            this.deferredPrompt = e;
            
            // Show custom install popup if not dismissed before
            const dismissed = localStorage.getItem('pwa-install-dismissed');
            const dismissedTime = localStorage.getItem('pwa-install-dismissed-time');
            
            // Show popup if never dismissed or dismissed more than 7 days ago
            if (!dismissed || (dismissedTime && Date.now() - parseInt(dismissedTime) > 7 * 24 * 60 * 60 * 1000)) {
                setTimeout(() => {
                    if (installPopup && !this.isInstalled) {
                        installPopup.classList.remove('hidden');
                    }
                }, 3000); // Show after 3 seconds
            }
        });

        // Handle install button click
        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                if (this.deferredPrompt) {
                    // Show the install prompt
                    this.deferredPrompt.prompt();
                    
                    // Wait for the user to respond to the prompt
                    const { outcome } = await this.deferredPrompt.userChoice;
                    
                    if (outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                        this.trackEvent('pwa_install_accepted');
                    } else {
                        console.log('User dismissed the install prompt');
                        this.trackEvent('pwa_install_dismissed');
                    }
                    
                    // Clear the deferredPrompt
                    this.deferredPrompt = null;
                }
                
                // Hide the popup
                if (installPopup) {
                    installPopup.classList.add('hidden');
                }
            });
        }

        // Handle dismiss button click
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                localStorage.setItem('pwa-install-dismissed', 'true');
                localStorage.setItem('pwa-install-dismissed-time', Date.now().toString());
                
                if (installPopup) {
                    installPopup.classList.add('hidden');
                }
                
                this.trackEvent('pwa_install_later');
            });
        }

        // Handle app installed event
        window.addEventListener('appinstalled', (evt) => {
            console.log('App was installed');
            this.isInstalled = true;
            
            if (installPopup) {
                installPopup.classList.add('hidden');
            }
            
            this.trackEvent('pwa_installed');
        });
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', async () => {
                try {
                    const registration = await navigator.serviceWorker.register('/sw.js');
                    console.log('Service Worker registered successfully:', registration.scope);
                    
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed') {
                                    if (navigator.serviceWorker.controller) {
                                        // New update available
                                        this.showUpdateNotification();
                                    }
                                }
                            });
                        }
                    });
                    
                } catch (error) {
                    console.error('Service Worker registration failed:', error);
                }
            });
        }
    }

    setupAppUpdates() {
        // Listen for service worker messages
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'CACHE_UPDATED') {
                    this.showUpdateNotification();
                }
            });
        }
    }

    showUpdateNotification() {
        // Create update notification
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="update-content">
                <i class="fas fa-download"></i>
                <div class="update-text">
                    <h4>Update Available</h4>
                    <p>A new version of Tools Hub is available. Refresh to update.</p>
                </div>
                <button id="update-btn" class="btn btn-primary">Update</button>
                <button id="dismiss-update" class="btn btn-secondary">Later</button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--card-color);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-large);
            z-index: 10000;
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Handle update button
        const updateBtn = notification.querySelector('#update-btn');
        const dismissBtn = notification.querySelector('#dismiss-update');
        
        updateBtn?.addEventListener('click', () => {
            window.location.reload();
        });
        
        dismissBtn?.addEventListener('click', () => {
            notification.remove();
        });
        
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }

    // Check if app can be installed
    canInstall() {
        return this.deferredPrompt !== null && !this.isInstalled;
    }

    // Manually trigger install prompt
    async install() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            this.deferredPrompt = null;
            return outcome === 'accepted';
        }
        return false;
    }

    // Get installation status
    getInstallationStatus() {
        return {
            isInstalled: this.isInstalled,
            canInstall: this.canInstall(),
            hasServiceWorker: 'serviceWorker' in navigator
        };
    }

    // Track PWA events
    trackEvent(eventName, data = {}) {
        if (window.app?.analyticsManager) {
            window.app.analyticsManager.trackEvent(eventName, data);
        }
    }
}

// Add CSS for update notification
const style = document.createElement('style');
style.textContent = `
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
    
    .update-notification .update-content {
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 16px;
    }
    
    .update-notification .update-content i {
        font-size: 24px;
        color: var(--primary-color);
        flex-shrink: 0;
    }
    
    .update-notification .update-text {
        flex: 1;
    }
    
    .update-notification .update-text h4 {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
    }
    
    .update-notification .update-text p {
        margin: 0;
        font-size: 14px;
        color: var(--text-secondary);
    }
    
    .update-notification .btn {
        padding: 8px 16px;
        font-size: 13px;
        margin-left: 8px;
    }
`;
document.head.appendChild(style);

// Make PWAManager available globally
window.PWAManager = PWAManager;