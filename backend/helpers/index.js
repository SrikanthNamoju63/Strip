/**
 * Helper Utilities
 * Common helper functions used across the application
 */

const crypto = require('crypto');

/**
 * Generate a random string
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
};

/**
 * Generate a unique ID with prefix
 */
const generateId = (prefix = 'ID') => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Format date to readable string
 */
const formatDate = (date, format = 'DD/MM/YYYY') => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', year)
    .replace('HH', hours)
    .replace('mm', minutes);
};

/**
 * Format currency
 */
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

/**
 * Sanitize string input
 */
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
};

/**
 * Deep sanitize object
 */
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

/**
 * Paginate array
 */
const paginate = (array, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    data: array.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: array.length,
      pages: Math.ceil(array.length / limit)
    }
  };
};

/**
 * Calculate age from date of birth
 */
const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Generate time slots
 */
const generateTimeSlots = (startTime = '09:00', endTime = '17:00', intervalMinutes = 30) => {
  const slots = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let currentHour = startHour;
  let currentMin = startMin;
  
  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
    slots.push(timeString);
    
    currentMin += intervalMinutes;
    if (currentMin >= 60) {
      currentHour++;
      currentMin -= 60;
    }
  }
  
  return slots;
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (basic)
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};

/**
 * Mask email for privacy
 */
const maskEmail = (email) => {
  if (!email) return '';
  const [local, domain] = email.split('@');
  const maskedLocal = local.charAt(0) + '*'.repeat(local.length - 2) + local.charAt(local.length - 1);
  return `${maskedLocal}@${domain}`;
};

/**
 * Mask phone number
 */
const maskPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return phone;
  return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
};

/**
 * Deep clone object
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Pick specific keys from object
 */
const pick = (obj, keys) => {
  return keys.reduce((acc, key) => {
    if (obj.hasOwnProperty(key)) acc[key] = obj[key];
    return acc;
  }, {});
};

/**
 * Omit specific keys from object
 */
const omit = (obj, keys) => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

/**
 * Convert object keys to camelCase
 */
const toCamelCase = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }

  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    acc[camelKey] = toCamelCase(obj[key]);
    return acc;
  }, {});
};

/**
 * Convert object keys to snake_case
 */
const toSnakeCase = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item));
  }

  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = toSnakeCase(obj[key]);
    return acc;
  }, {});
};

/**
 * Retry async function with exponential backoff
 */
const retry = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
};

/**
 * Debounce function
 */
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Throttle function
 */
const throttle = (fn, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Group array by key
 */
const groupBy = (array, key) => {
  return array.reduce((acc, item) => {
    const groupKey = item[key];
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(item);
    return acc;
  }, {});
};

/**
 * Sort array by key
 */
const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Remove duplicates from array
 */
const unique = (array, key) => {
  if (key) {
    const seen = new Set();
    return array.filter(item => {
      const val = item[key];
      if (seen.has(val)) return false;
      seen.add(val);
      return true;
    });
  }
  return [...new Set(array)];
};

/**
 * Chunk array into smaller arrays
 */
const chunk = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Get file extension
 */
const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Generate slug from string
 */
const slugify = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Truncate string
 */
const truncate = (str, length = 100, suffix = '...') => {
  if (str.length <= length) return str;
  return str.substring(0, length).trim() + suffix;
};

module.exports = {
  generateRandomString,
  generateId,
  formatDate,
  formatCurrency,
  sanitizeString,
  sanitizeObject,
  paginate,
  calculateAge,
  generateTimeSlots,
  isValidEmail,
  isValidPhone,
  maskEmail,
  maskPhone,
  deepClone,
  pick,
  omit,
  toCamelCase,
  toSnakeCase,
  retry,
  debounce,
  throttle,
  groupBy,
  sortBy,
  unique,
  chunk,
  getFileExtension,
  slugify,
  truncate
};
