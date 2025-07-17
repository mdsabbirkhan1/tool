// Utility Functions for ToolsHub

window.Utils = {
  // DOM Utilities
  dom: {
    /**
     * Get element by ID
     * @param {string} id - Element ID
     * @returns {Element|null}
     */
    get(id) {
      return document.getElementById(id);
    },

    /**
     * Get elements by selector
     * @param {string} selector - CSS selector
     * @param {Element} parent - Parent element (optional)
     * @returns {NodeList}
     */
    getAll(selector, parent = document) {
      return parent.querySelectorAll(selector);
    },

    /**
     * Get single element by selector
     * @param {string} selector - CSS selector
     * @param {Element} parent - Parent element (optional)
     * @returns {Element|null}
     */
    getOne(selector, parent = document) {
      return parent.querySelector(selector);
    },

    /**
     * Create element with attributes and content
     * @param {string} tag - HTML tag
     * @param {Object} attributes - Element attributes
     * @param {string|Element} content - Element content
     * @returns {Element}
     */
    create(tag, attributes = {}, content = '') {
      const element = document.createElement(tag);
      
      Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
          element.className = value;
        } else if (key === 'dataset') {
          Object.entries(value).forEach(([dataKey, dataValue]) => {
            element.dataset[dataKey] = dataValue;
          });
        } else {
          element.setAttribute(key, value);
        }
      });

      if (typeof content === 'string') {
        element.innerHTML = content;
      } else if (content instanceof Element) {
        element.appendChild(content);
      }

      return element;
    },

    /**
     * Add event listener with optional delegation
     * @param {Element|string} target - Target element or selector
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     */
    on(target, event, handler, options = {}) {
      const element = typeof target === 'string' ? this.getOne(target) : target;
      if (element) {
        element.addEventListener(event, handler, options);
      }
    },

    /**
     * Remove event listener
     * @param {Element|string} target - Target element or selector
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     */
    off(target, event, handler) {
      const element = typeof target === 'string' ? this.getOne(target) : target;
      if (element) {
        element.removeEventListener(event, handler);
      }
    },

    /**
     * Show element
     * @param {Element|string} target - Target element or selector
     */
    show(target) {
      const element = typeof target === 'string' ? this.getOne(target) : target;
      if (element) {
        element.classList.remove('hidden');
      }
    },

    /**
     * Hide element
     * @param {Element|string} target - Target element or selector
     */
    hide(target) {
      const element = typeof target === 'string' ? this.getOne(target) : target;
      if (element) {
        element.classList.add('hidden');
      }
    },

    /**
     * Toggle element visibility
     * @param {Element|string} target - Target element or selector
     */
    toggle(target) {
      const element = typeof target === 'string' ? this.getOne(target) : target;
      if (element) {
        element.classList.toggle('hidden');
      }
    },

    /**
     * Check if element has class
     * @param {Element|string} target - Target element or selector
     * @param {string} className - Class name
     * @returns {boolean}
     */
    hasClass(target, className) {
      const element = typeof target === 'string' ? this.getOne(target) : target;
      return element ? element.classList.contains(className) : false;
    },

    /**
     * Add class to element
     * @param {Element|string} target - Target element or selector
     * @param {string} className - Class name
     */
    addClass(target, className) {
      const element = typeof target === 'string' ? this.getOne(target) : target;
      if (element) {
        element.classList.add(className);
      }
    },

    /**
     * Remove class from element
     * @param {Element|string} target - Target element or selector
     * @param {string} className - Class name
     */
    removeClass(target, className) {
      const element = typeof target === 'string' ? this.getOne(target) : target;
      if (element) {
        element.classList.remove(className);
      }
    },

    /**
     * Get element position relative to viewport
     * @param {Element} element - Target element
     * @returns {Object}
     */
    getPosition(element) {
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
      };
    },

    /**
     * Check if element is in viewport
     * @param {Element} element - Target element
     * @param {number} threshold - Threshold in pixels
     * @returns {boolean}
     */
    isInViewport(element, threshold = 0) {
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= -threshold &&
        rect.left >= -threshold &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + threshold &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) + threshold
      );
    }
  },

  // String Utilities
  string: {
    /**
     * Capitalize first letter
     * @param {string} str - Input string
     * @returns {string}
     */
    capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    },

    /**
     * Convert to title case
     * @param {string} str - Input string
     * @returns {string}
     */
    titleCase(str) {
      return str.replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );
    },

    /**
     * Convert to kebab case
     * @param {string} str - Input string
     * @returns {string}
     */
    kebabCase(str) {
      return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
    },

    /**
     * Convert to camel case
     * @param {string} str - Input string
     * @returns {string}
     */
    camelCase(str) {
      return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
          index === 0 ? word.toLowerCase() : word.toUpperCase()
        )
        .replace(/\s+/g, '');
    },

    /**
     * Truncate string with ellipsis
     * @param {string} str - Input string
     * @param {number} length - Max length
     * @returns {string}
     */
    truncate(str, length) {
      return str.length > length ? str.substring(0, length) + '...' : str;
    },

    /**
     * Strip HTML tags
     * @param {string} html - HTML string
     * @returns {string}
     */
    stripHtml(html) {
      const temp = document.createElement('div');
      temp.innerHTML = html;
      return temp.textContent || temp.innerText || '';
    },

    /**
     * Escape HTML characters
     * @param {string} text - Input text
     * @returns {string}
     */
    escapeHtml(text) {
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return text.replace(/[&<>"']/g, (m) => map[m]);
    },

    /**
     * Generate slug from string
     * @param {string} str - Input string
     * @returns {string}
     */
    slug(str) {
      return str
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
    },

    /**
     * Highlight text matches
     * @param {string} text - Input text
     * @param {string} query - Search query
     * @returns {string}
     */
    highlight(text, query) {
      if (!query) return text;
      const regex = new RegExp(`(${query})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    }
  },

  // Array Utilities
  array: {
    /**
     * Remove duplicates from array
     * @param {Array} arr - Input array
     * @returns {Array}
     */
    unique(arr) {
      return [...new Set(arr)];
    },

    /**
     * Chunk array into smaller arrays
     * @param {Array} arr - Input array
     * @param {number} size - Chunk size
     * @returns {Array}
     */
    chunk(arr, size) {
      const chunks = [];
      for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
      }
      return chunks;
    },

    /**
     * Shuffle array
     * @param {Array} arr - Input array
     * @returns {Array}
     */
    shuffle(arr) {
      const newArr = [...arr];
      for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
      }
      return newArr;
    },

    /**
     * Sort array by property
     * @param {Array} arr - Input array
     * @param {string} prop - Property to sort by
     * @param {boolean} desc - Sort descending
     * @returns {Array}
     */
    sortBy(arr, prop, desc = false) {
      return arr.sort((a, b) => {
        const aVal = a[prop];
        const bVal = b[prop];
        if (desc) {
          return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      });
    },

    /**
     * Group array by property
     * @param {Array} arr - Input array
     * @param {string} prop - Property to group by
     * @returns {Object}
     */
    groupBy(arr, prop) {
      return arr.reduce((groups, item) => {
        const key = item[prop];
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(item);
        return groups;
      }, {});
    }
  },

  // Date Utilities
  date: {
    /**
     * Format date
     * @param {Date|string} date - Input date
     * @param {string} format - Date format
     * @returns {string}
     */
    format(date, format = 'YYYY-MM-DD') {
      const d = new Date(date);
      const formats = {
        'YYYY': d.getFullYear(),
        'MM': String(d.getMonth() + 1).padStart(2, '0'),
        'DD': String(d.getDate()).padStart(2, '0'),
        'HH': String(d.getHours()).padStart(2, '0'),
        'mm': String(d.getMinutes()).padStart(2, '0'),
        'ss': String(d.getSeconds()).padStart(2, '0')
      };

      return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => formats[match]);
    },

    /**
     * Get relative time
     * @param {Date|string} date - Input date
     * @returns {string}
     */
    relative(date) {
      const now = new Date();
      const past = new Date(date);
      const diffMs = now - past;
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 7) {
        return this.format(past, 'YYYY-MM-DD');
      } else if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      } else {
        return 'Just now';
      }
    },

    /**
     * Check if date is today
     * @param {Date|string} date - Input date
     * @returns {boolean}
     */
    isToday(date) {
      const today = new Date();
      const compareDate = new Date(date);
      return today.toDateString() === compareDate.toDateString();
    }
  },

  // URL Utilities
  url: {
    /**
     * Get URL parameters
     * @returns {Object}
     */
    getParams() {
      const params = {};
      const searchParams = new URLSearchParams(window.location.search);
      for (const [key, value] of searchParams.entries()) {
        params[key] = value;
      }
      return params;
    },

    /**
     * Set URL parameter
     * @param {string} key - Parameter key
     * @param {string} value - Parameter value
     * @param {boolean} replace - Replace current state
     */
    setParam(key, value, replace = false) {
      const url = new URL(window.location);
      url.searchParams.set(key, value);
      const method = replace ? 'replaceState' : 'pushState';
      window.history[method]({}, '', url);
    },

    /**
     * Remove URL parameter
     * @param {string} key - Parameter key
     * @param {boolean} replace - Replace current state
     */
    removeParam(key, replace = false) {
      const url = new URL(window.location);
      url.searchParams.delete(key);
      const method = replace ? 'replaceState' : 'pushState';
      window.history[method]({}, '', url);
    },

    /**
     * Build URL with parameters
     * @param {string} base - Base URL
     * @param {Object} params - Parameters object
     * @returns {string}
     */
    build(base, params = {}) {
      const url = new URL(base);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
      return url.toString();
    }
  },

  // Performance Utilities
  performance: {
    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function}
     */
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    /**
     * Throttle function
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in ms
     * @returns {Function}
     */
    throttle(func, limit) {
      let inThrottle;
      return function executedFunction(...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },

    /**
     * Measure function execution time
     * @param {Function} func - Function to measure
     * @param {string} label - Label for measurement
     * @returns {any}
     */
    measure(func, label = 'Function') {
      const start = performance.now();
      const result = func();
      const end = performance.now();
      console.log(`${label} took ${end - start} milliseconds`);
      return result;
    }
  },

  // Validation Utilities
  validation: {
    /**
     * Check if email is valid
     * @param {string} email - Email address
     * @returns {boolean}
     */
    isEmail(email) {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    },

    /**
     * Check if URL is valid
     * @param {string} url - URL to validate
     * @returns {boolean}
     */
    isUrl(url) {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    },

    /**
     * Check if string is empty or whitespace
     * @param {string} str - String to check
     * @returns {boolean}
     */
    isEmpty(str) {
      return !str || str.trim().length === 0;
    },

    /**
     * Validate string length
     * @param {string} str - String to validate
     * @param {number} min - Minimum length
     * @param {number} max - Maximum length
     * @returns {boolean}
     */
    lengthBetween(str, min, max) {
      const length = str.length;
      return length >= min && length <= max;
    }
  },

  // Storage Utilities
  storage: {
    /**
     * Set item in localStorage with expiration
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     * @param {number} days - Expiration in days
     */
    set(key, value, days = null) {
      const item = {
        value: value,
        timestamp: Date.now(),
        expires: days ? Date.now() + (days * 24 * 60 * 60 * 1000) : null
      };
      localStorage.setItem(key, JSON.stringify(item));
    },

    /**
     * Get item from localStorage
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default value if not found
     * @returns {any}
     */
    get(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(key);
        if (!item) return defaultValue;

        const parsed = JSON.parse(item);
        
        // Check expiration
        if (parsed.expires && Date.now() > parsed.expires) {
          localStorage.removeItem(key);
          return defaultValue;
        }

        return parsed.value;
      } catch {
        return defaultValue;
      }
    },

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     */
    remove(key) {
      localStorage.removeItem(key);
    },

    /**
     * Clear all localStorage
     */
    clear() {
      localStorage.clear();
    }
  },

  // Math Utilities
  math: {
    /**
     * Generate random number between min and max
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number}
     */
    random(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Clamp number between min and max
     * @param {number} num - Number to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number}
     */
    clamp(num, min, max) {
      return Math.min(Math.max(num, min), max);
    },

    /**
     * Round number to decimal places
     * @param {number} num - Number to round
     * @param {number} decimals - Number of decimal places
     * @returns {number}
     */
    round(num, decimals = 0) {
      return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }
  },

  // Animation Utilities
  animation: {
    /**
     * Simple fade in animation
     * @param {Element} element - Target element
     * @param {number} duration - Animation duration
     */
    fadeIn(element, duration = 300) {
      element.style.opacity = '0';
      element.style.display = 'block';
      
      const start = performance.now();
      
      const animate = (currentTime) => {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        
        element.style.opacity = progress;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    },

    /**
     * Simple fade out animation
     * @param {Element} element - Target element
     * @param {number} duration - Animation duration
     */
    fadeOut(element, duration = 300) {
      const start = performance.now();
      const startOpacity = parseFloat(getComputedStyle(element).opacity);
      
      const animate = (currentTime) => {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        
        element.style.opacity = startOpacity * (1 - progress);
        
        if (progress >= 1) {
          element.style.display = 'none';
        } else {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }
};

// Make Utils globally available
window.Utils = Utils;