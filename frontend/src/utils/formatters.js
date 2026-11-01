/**
 * Utility functions for Indian currency, numbering, and date formatting.
 */

/**
 * Formats a monetary value into Indian Rupee format (e.g., ₹1,50,000 or ₹1,50,000.50).
 *
 * @param {number|string|null|undefined} value - The numerical or string amount.
 * @param {Object} [options] - Formatting options.
 * @param {boolean} [options.showDecimals=false] - Force 2 decimal places even if whole number.
 * @param {boolean} [options.compact=false] - Short format for large numbers (e.g., ₹1.50 L, ₹2.30 Cr).
 * @returns {string} Formatted Indian Rupee string.
 */
export function formatCurrency(value, { showDecimals = false, compact = false } = {}) {
  if (value === null || value === undefined || value === '') {
    return '₹0';
  }

  const num = typeof value === 'number' ? value : parseFloat(value);
  if (Number.isNaN(num)) {
    return '₹0';
  }

  if (compact && Math.abs(num) >= 100000) {
    if (Math.abs(num) >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(num / 100000).toFixed(2)} L`;
  }

  const hasFractions = num % 1 !== 0;
  const fractionDigits = showDecimals ? 2 : (hasFractions ? 2 : 0);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(num);
}

/**
 * Formats a number using the Indian numbering system (e.g., 1,50,000).
 *
 * @param {number|string|null|undefined} value - The numerical amount.
 * @param {Object} [options] - Formatting options.
 * @param {number} [options.decimals=0] - Number of fraction digits.
 * @returns {string} Formatted number string.
 */
export function formatNumber(value, { decimals = 0 } = {}) {
  if (value === null || value === undefined || value === '') {
    return '0';
  }

  const num = typeof value === 'number' ? value : parseFloat(value);
  if (Number.isNaN(num)) {
    return '0';
  }

  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Formats a value as a percentage (e.g., 25.5%).
 *
 * @param {number|string|null|undefined} value - Percentage value (0 - 100).
 * @param {number} [decimals=1] - Decimal precision.
 * @returns {string} Formatted percentage string.
 */
export function formatPercentage(value, decimals = 1) {
  if (value === null || value === undefined || value === '') {
    return '0%';
  }

  const num = typeof value === 'number' ? value : parseFloat(value);
  if (Number.isNaN(num)) {
    return '0%';
  }

  return `${num.toFixed(decimals)}%`;
}

/**
 * Formats an ISO date string or Date object into localized Indian date format.
 *
 * @param {string|Date|null|undefined} dateInput - ISO date string or Date instance.
 * @param {string} [locale='en-IN'] - Locale identifier.
 * @returns {string} Formatted date string (e.g. "02 Nov 2026").
 */
export function formatDate(dateInput, locale = 'en-IN') {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
