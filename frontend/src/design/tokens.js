/**
 * Design tokens: the single source of the colour values the theme takes from the design system.
 * So far only the roles that text contrast and the focus ring depend on; the full palette replaces the rest of the
 * theme later. Every pair is checked against WCAG 2.x thresholds in tokens.spec.js.
 */

// Light theme roles
export const light = {
    // Amber is a fill only (the call to action); text on it is dark
    secondary: '#D4A574',
    'on-secondary': '#2B2118',
    // Prices in terracotta
    price: '#A4492B',
    success: '#2E6B3F',
    error: '#9E2B25',
    warning: '#7A5200',
    info: '#1F4F8C',
}

// Dark theme roles: only what keeps the dark theme from getting worse until it is redesigned
export const dark = {
    'on-secondary': '#2B2118',
    // The dark theme's text colour, which its prices already use
    price: '#E8E8E8',
}

// Two-tone focus ring: inner outline and outer halo. On navy and in the dark theme the colours swap
export const focus = {
    light: { inner: '#1F4F8C', outer: '#FFD27A' },
    onDark: { inner: '#FFD27A', outer: '#1B1714' },
}
