/**
 * Currency formatting utilities for consistent display across the application
 */

// Currency symbol to use throughout the application (UAH - Ukrainian Hryvnia)
export const CURRENCY_SYMBOL = '₴'

/**
 * Format a price with the standard currency symbol
 * @param {number|string} price - The price to format
 * @param {boolean} showSymbol - Whether to include the currency symbol
 * @returns {string} Formatted price
 */
export function formatPrice(price) {
    // Convert to number and handle invalid values
    const numericPrice = parseFloat(price) || 0

    // Format with 2 decimal places
    return `${CURRENCY_SYMBOL}${numericPrice.toFixed(2)}`
}
