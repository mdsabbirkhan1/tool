// Theme Manager - Handles dark/light mode switching
class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.themeToggleBtn = document.getElementById('theme-toggle');
        
        this.init();
    }

    init() {
        this.loadSavedTheme();
        this.setupThemeToggle();
        this.setupSystemThemeListener();
        this.updateThemeIcon();
    }

    loadSavedTheme() {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme) {
            this.currentTheme = savedTheme;
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.currentTheme = prefersDark ? 'dark' : 'light';
        }
        
        this.applyTheme(this.currentTheme);
    }

    setupThemeToggle() {
        if (this.themeToggleBtn) {
            this.themeToggleBtn.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    setupSystemThemeListener() {
        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        mediaQuery.addEventListener('change', (e) => {
            // Only auto-switch if user hasn't manually set a preference
            const savedTheme = localStorage.getItem('theme');
            if (!savedTheme) {
                const newTheme = e.matches ? 'dark' : 'light';
                this.setTheme(newTheme, false); // Don't save to localStorage
            }
        });
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme, true);
        
        // Track theme change
        this.trackThemeChange(newTheme);
    }

    setTheme(theme, save = true) {
        this.currentTheme = theme;
        this.applyTheme(theme);
        this.updateThemeIcon();
        
        if (save) {
            localStorage.setItem('theme', theme);
        }
    }

    applyTheme(theme) {
        // Add smooth transition class
        document.body.classList.add('theme-transitioning');
        
        // Apply theme
        document.documentElement.setAttribute('data-theme', theme);
        
        // Remove transition class after animation
        setTimeout(() => {
            document.body.classList.remove('theme-transitioning');
        }, 300);
        
        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor(theme);
    }

    updateThemeIcon() {
        if (!this.themeToggleBtn) return;
        
        const icon = this.themeToggleBtn.querySelector('i');
        if (icon) {
            icon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
        
        // Update tooltip
        this.themeToggleBtn.title = `Switch to ${this.currentTheme === 'light' ? 'dark' : 'light'} mode`;
    }

    updateMetaThemeColor(theme) {
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            const colors = {
                light: '#4F46E5',
                dark: '#6366F1'
            };
            metaThemeColor.setAttribute('content', colors[theme]);
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    isDarkMode() {
        return this.currentTheme === 'dark';
    }

    isLightMode() {
        return this.currentTheme === 'light';
    }

    // Get theme colors for JavaScript use
    getThemeColors() {
        const styles = getComputedStyle(document.documentElement);
        
        return {
            primary: styles.getPropertyValue('--primary-color').trim(),
            secondary: styles.getPropertyValue('--secondary-color').trim(),
            accent: styles.getPropertyValue('--accent-color').trim(),
            background: styles.getPropertyValue('--background-color').trim(),
            surface: styles.getPropertyValue('--surface-color').trim(),
            card: styles.getPropertyValue('--card-color').trim(),
            textPrimary: styles.getPropertyValue('--text-primary').trim(),
            textSecondary: styles.getPropertyValue('--text-secondary').trim(),
            textMuted: styles.getPropertyValue('--text-muted').trim(),
            border: styles.getPropertyValue('--border-color').trim()
        };
    }

    trackThemeChange(theme) {
        if (window.app?.analyticsManager) {
            window.app.analyticsManager.trackEvent('theme_change', { theme });
        }
    }

    // Force theme without saving (useful for previews)
    previewTheme(theme) {
        this.applyTheme(theme);
        this.updateThemeIcon();
    }

    // Reset to system preference
    resetToSystemTheme() {
        localStorage.removeItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.setTheme(prefersDark ? 'dark' : 'light', false);
    }
}

// Add CSS for smooth theme transitions
const style = document.createElement('style');
style.textContent = `
    .theme-transitioning *,
    .theme-transitioning *::before,
    .theme-transitioning *::after {
        transition: background-color 0.3s ease-in-out, 
                   color 0.3s ease-in-out, 
                   border-color 0.3s ease-in-out, 
                   box-shadow 0.3s ease-in-out !important;
    }
    
    /* Smooth icon transition */
    .theme-toggle i {
        transition: transform 0.3s ease-in-out;
    }
    
    .theme-toggle:hover i {
        transform: rotate(180deg);
    }
    
    /* Theme-specific animations */
    [data-theme="dark"] .theme-toggle i {
        filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.3));
    }
    
    [data-theme="light"] .theme-toggle i {
        filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.1));
    }
`;
document.head.appendChild(style);

// Make ThemeManager available globally
window.ThemeManager = ThemeManager;