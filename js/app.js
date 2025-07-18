// Main App Controller
class ToolsApp {
    constructor() {
        this.tools = [];
        this.categories = [];
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        try {
            this.showLoading();
            await this.loadTools();
            this.setupEventListeners();
            this.renderCategories();
            this.renderTools();
            this.hideLoading();
            
            // Initialize other modules
            if (window.ThemeManager) {
                this.themeManager = new ThemeManager();
            }
            
            if (window.PWAManager) {
                this.pwaManager = new PWAManager();
            }
            
            if (window.SearchManager) {
                this.searchManager = new SearchManager(this);
            }
            
            if (window.StorageManager) {
                this.storageManager = new StorageManager();
                this.showMostUsedTools();
            }
            
            if (window.AnalyticsManager) {
                this.analyticsManager = new AnalyticsManager();
            }
            
            // Show cookies popup if not already accepted
            this.showCookiesPopup();
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to load tools. Please refresh the page.');
        }
    }

    async loadTools() {
        try {
            // Load tools from different category files
            const categoryFiles = [
                'development-tools',
                'text-tools',
                'image-tools',
                'productivity-tools',
                'utility-tools'
            ];
            
            const toolPromises = categoryFiles.map(async (category) => {
                try {
                    const response = await fetch(`js/tools/${category}.js`);
                    if (response.ok) {
                        const text = await response.text();
                        // Extract tools from the JavaScript file
                        const match = text.match(/const\s+\w+\s*=\s*(\[[\s\S]*?\]);/);
                        if (match) {
                            const tools = eval(match[1]);
                            return tools.map(tool => ({
                                ...tool,
                                category: category.replace('-tools', '').replace('-', ' ')
                            }));
                        }
                    }
                } catch (error) {
                    console.warn(`Failed to load ${category}:`, error);
                }
                return [];
            });
            
            const toolArrays = await Promise.all(toolPromises);
            this.tools = toolArrays.flat();
            
            // Extract unique categories
            this.categories = [...new Set(this.tools.map(tool => tool.category))];
            
        } catch (error) {
            console.error('Error loading tools:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Category navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('.category-btn')) {
                e.preventDefault();
                const category = e.target.dataset.category;
                this.setCategory(category);
            }
        });

        // Tool card clicks
        document.addEventListener('click', (e) => {
            const toolCard = e.target.closest('.tool-card');
            if (toolCard) {
                const toolId = toolCard.dataset.toolId;
                this.openTool(toolId);
            }
        });

        // Intersection Observer for lazy loading
        this.setupLazyLoading();
    }

    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const toolCard = entry.target;
                        toolCard.classList.add('loaded');
                        this.observer.unobserve(toolCard);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '50px'
            });
        }
    }

    renderCategories() {
        const categoriesContainer = document.querySelector('.categories-container');
        const footerCategories = document.getElementById('footer-categories');
        
        if (!categoriesContainer) return;

        // Clear existing categories except "All Tools"
        const allButton = categoriesContainer.querySelector('[data-category="all"]');
        categoriesContainer.innerHTML = '';
        categoriesContainer.appendChild(allButton);

        // Add category buttons
        this.categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'category-btn';
            button.dataset.category = category;
            
            // Get category icon
            const icon = this.getCategoryIcon(category);
            
            button.innerHTML = `
                <i class="${icon}"></i>
                <span>${this.formatCategoryName(category)}</span>
            `;
            
            categoriesContainer.appendChild(button);
        });

        // Update footer categories
        if (footerCategories) {
            footerCategories.innerHTML = this.categories.map(category => 
                `<li><a href="#" data-category="${category}">${this.formatCategoryName(category)}</a></li>`
            ).join('');
        }
    }

    getCategoryIcon(category) {
        const icons = {
            'development': 'fas fa-code',
            'text': 'fas fa-font',
            'image': 'fas fa-image',
            'productivity': 'fas fa-tasks',
            'utility': 'fas fa-wrench',
            'default': 'fas fa-cube'
        };
        
        return icons[category] || icons.default;
    }

    formatCategoryName(category) {
        return category.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    renderTools(tools = null) {
        const toolsGrid = document.getElementById('tools-grid');
        if (!toolsGrid) return;

        const toolsToRender = tools || this.getFilteredTools();
        
        if (toolsToRender.length === 0) {
            this.showNoResults();
            return;
        }

        this.hideNoResults();
        
        toolsGrid.innerHTML = toolsToRender.map(tool => this.createToolCard(tool)).join('');
        
        // Setup lazy loading for new cards
        if (this.observer) {
            toolsGrid.querySelectorAll('.tool-card').forEach(card => {
                this.observer.observe(card);
            });
        }
    }

    createToolCard(tool) {
        const usageCount = this.storageManager ? this.storageManager.getToolUsage(tool.id) : 0;
        
        return `
            <div class="tool-card" data-tool-id="${tool.id}" tabindex="0" role="button" aria-label="Open ${tool.name}">
                <div class="tool-header">
                    <div class="tool-icon">
                        <i class="${tool.icon}"></i>
                    </div>
                    <div class="tool-info">
                        <h3>${tool.name}</h3>
                        <p>${tool.description}</p>
                    </div>
                </div>
                <div class="tool-meta">
                    <span class="tool-category">${this.formatCategoryName(tool.category)}</span>
                    <span class="tool-usage">
                        <i class="fas fa-chart-line"></i>
                        ${usageCount} uses
                    </span>
                </div>
            </div>
        `;
    }

    getFilteredTools() {
        let filtered = this.tools;
        
        // Filter by category
        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(tool => tool.category === this.currentCategory);
        }
        
        // Filter by search query
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(tool => 
                tool.name.toLowerCase().includes(query) ||
                tool.description.toLowerCase().includes(query) ||
                tool.keywords?.some(keyword => keyword.toLowerCase().includes(query))
            );
        }
        
        return filtered;
    }

    setCategory(category) {
        this.currentCategory = category;
        
        // Update active category button
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-category="${category}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Update section title
        const titleElement = document.getElementById('current-category-title');
        if (titleElement) {
            const icon = category === 'all' ? 'fas fa-th-large' : this.getCategoryIcon(category);
            const title = category === 'all' ? 'All Tools' : this.formatCategoryName(category);
            titleElement.innerHTML = `<i class="${icon}"></i> ${title}`;
        }
        
        // Hide search results and most used sections
        this.hideSearchResults();
        this.hideMostUsed();
        
        this.renderTools();
        
        // Track category change
        if (this.analyticsManager) {
            this.analyticsManager.trackEvent('category_change', { category });
        }
    }

    openTool(toolId) {
        const tool = this.tools.find(t => t.id === toolId);
        if (!tool) return;
        
        // Track tool usage
        if (this.storageManager) {
            this.storageManager.incrementToolUsage(toolId);
        }
        
        if (this.analyticsManager) {
            this.analyticsManager.trackEvent('tool_open', { toolId, toolName: tool.name });
        }
        
        // Open tool in new window/tab or execute function
        if (tool.url) {
            window.open(tool.url, '_blank');
        } else if (tool.execute && typeof window[tool.execute] === 'function') {
            window[tool.execute]();
        } else {
            console.warn('Tool has no URL or execute function:', tool);
        }
        
        // Update most used tools display
        this.updateMostUsedTools();
    }

    showMostUsedTools() {
        if (!this.storageManager) return;
        
        const mostUsed = this.storageManager.getMostUsedTools(6);
        const mostUsedTools = mostUsed.map(usage => 
            this.tools.find(tool => tool.id === usage.toolId)
        ).filter(Boolean);
        
        if (mostUsedTools.length > 0) {
            const section = document.getElementById('most-used-section');
            const grid = document.getElementById('most-used-tools');
            
            if (section && grid) {
                grid.innerHTML = mostUsedTools.map(tool => this.createToolCard(tool)).join('');
                section.classList.remove('hidden');
            }
        }
    }

    updateMostUsedTools() {
        // Debounce the update
        clearTimeout(this.mostUsedUpdateTimeout);
        this.mostUsedUpdateTimeout = setTimeout(() => {
            this.showMostUsedTools();
        }, 1000);
    }

    hideMostUsed() {
        const section = document.getElementById('most-used-section');
        if (section) {
            section.classList.add('hidden');
        }
    }

    showSearchResults(results) {
        const section = document.getElementById('search-results-section');
        const grid = document.getElementById('search-results');
        
        if (section && grid) {
            if (results.length > 0) {
                grid.innerHTML = results.map(tool => this.createToolCard(tool)).join('');
                section.classList.remove('hidden');
                this.hideNoResults();
            } else {
                section.classList.add('hidden');
                this.showNoResults();
            }
        }
    }

    hideSearchResults() {
        const section = document.getElementById('search-results-section');
        if (section) {
            section.classList.add('hidden');
        }
    }

    showLoading() {
        this.isLoading = true;
        const loader = document.getElementById('loading-indicator');
        if (loader) {
            loader.classList.remove('hidden');
        }
    }

    hideLoading() {
        this.isLoading = false;
        const loader = document.getElementById('loading-indicator');
        if (loader) {
            loader.classList.add('hidden');
        }
    }

    showNoResults() {
        const noResults = document.getElementById('no-results');
        if (noResults) {
            noResults.classList.remove('hidden');
        }
    }

    hideNoResults() {
        const noResults = document.getElementById('no-results');
        if (noResults) {
            noResults.classList.add('hidden');
        }
    }

    showError(message) {
        // Create a simple error display
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 16px;
            border-radius: 8px;
            z-index: 10001;
            animation: slideIn 0.3s ease-out;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    showCookiesPopup() {
        const accepted = localStorage.getItem('cookies-accepted');
        if (!accepted) {
            const popup = document.getElementById('cookies-popup');
            if (popup) {
                popup.classList.remove('hidden');
                
                // Handle cookie acceptance
                document.getElementById('accept-cookies')?.addEventListener('click', () => {
                    localStorage.setItem('cookies-accepted', 'true');
                    popup.classList.add('hidden');
                });
                
                document.getElementById('decline-cookies')?.addEventListener('click', () => {
                    localStorage.setItem('cookies-accepted', 'false');
                    popup.classList.add('hidden');
                });
            }
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ToolsApp();
});

// Add CSS for error messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);