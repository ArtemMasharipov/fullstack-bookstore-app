// Performance monitoring utility using Web Vitals
// Tracks Core Web Vitals and sends data to console/analytics

import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'

class PerformanceMonitor {
    constructor(options = {}) {
        this.options = {
            enableLogging: process.env.NODE_ENV === 'development',
            enableAnalytics: process.env.NODE_ENV === 'production',
            thresholds: {
                CLS: 0.1, // Cumulative Layout Shift
                INP: 200, // Interaction to Next Paint (ms)
                FCP: 1800, // First Contentful Paint (ms)
                LCP: 2500, // Largest Contentful Paint (ms)
                TTFB: 800, // Time to First Byte (ms)
            },
            ...options,
        }

        this.metrics = {}
        this.initialize()
    }

    initialize() {
        // Monitor Core Web Vitals
        onCLS(this.handleMetric.bind(this, 'CLS'))
        onINP(this.handleMetric.bind(this, 'INP'))
        onFCP(this.handleMetric.bind(this, 'FCP'))
        onLCP(this.handleMetric.bind(this, 'LCP'))
        onTTFB(this.handleMetric.bind(this, 'TTFB'))

        // Monitor bundle loading performance
        this.monitorBundlePerformance()

        // Monitor route changes (SPA navigation)
        this.monitorRoutePerformance()
    }

    handleMetric(name, metric) {
        this.metrics[name] = {
            ...metric,
            timestamp: Date.now(),
            url: window.location.href,
            rating: this.getRating(name, metric.value),
        }

        if (this.options.enableLogging) {
            this.logMetric(name, metric)
        }

        if (this.options.enableAnalytics) {
            this.sendToAnalytics(name, metric)
        }
    }

    getRating(name, value) {
        const threshold = this.options.thresholds[name]
        if (!threshold) return 'unknown'

        // Rating based on Core Web Vitals thresholds
        switch (name) {
            case 'CLS':
                return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor'
            case 'INP':
                return value <= 200 ? 'good' : value <= 500 ? 'needs-improvement' : 'poor'
            case 'FCP':
                return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor'
            case 'LCP':
                return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor'
            case 'TTFB':
                return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor'
            default:
                return 'unknown'
        }
    }

    logMetric(name, metric) {
        const rating = this.getRating(name, metric.value)
        const color = rating === 'good' ? 'green' : rating === 'needs-improvement' ? 'orange' : 'red'

        console.group(`%c📊 ${name} Performance`, `color: ${color}; font-weight: bold`)
        console.log(`Value: ${metric.value.toFixed(2)}${name === 'CLS' ? '' : 'ms'}`)
        console.log(`Rating: ${rating.toUpperCase()}`)
        console.log(`Delta: ${metric.delta}`)
        console.log(`URL: ${window.location.pathname}`)
        console.groupEnd()
    }

    sendToAnalytics(name, metric) {
        // In a real app, you'd send this to your analytics service
        // Example: Google Analytics 4, Mixpanel, or custom analytics

        if (window.gtag) {
            window.gtag('event', name, {
                event_category: 'Web Vitals',
                value: Math.round(metric.value),
                custom_parameter_1: metric.rating,
                custom_parameter_2: window.location.pathname,
            })
        }

        // Example: Custom analytics endpoint
        if (window.fetch && this.options.analyticsEndpoint) {
            fetch(this.options.analyticsEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    metric: name,
                    value: metric.value,
                    rating: this.getRating(name, metric.value),
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                    timestamp: Date.now(),
                }),
            }).catch((err) => console.warn('Analytics error:', err))
        }
    }

    monitorBundlePerformance() {
        // Monitor resource loading times
        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0]
            const resources = performance.getEntriesByType('resource')

            // Log bundle loading times
            const jsResources = resources.filter((r) => r.name.includes('.js'))
            const cssResources = resources.filter((r) => r.name.includes('.css'))

            if (this.options.enableLogging) {
                console.group('📦 Bundle Performance')
                console.log(`Total JS Size: ${jsResources.length} files`)
                console.log(`Total CSS Size: ${cssResources.length} files`)
                console.log(
                    `DOM Content Loaded: ${
                        navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
                    }ms`
                )
                console.log(`Page Load Complete: ${navigation.loadEventEnd - navigation.loadEventStart}ms`)
                console.groupEnd()
            }

            // Track largest JS bundles
            const largeJsFiles = jsResources
                .filter((r) => r.transferSize > 100000) // > 100KB
                .sort((a, b) => b.transferSize - a.transferSize)
                .slice(0, 5)

            if (largeJsFiles.length > 0 && this.options.enableLogging) {
                console.group('⚠️ Large JS Bundles (>100KB)')
                largeJsFiles.forEach((file) => {
                    console.log(`${file.name.split('/').pop()}: ${(file.transferSize / 1024).toFixed(1)}KB`)
                })
                console.groupEnd()
            }
        })
    }

    monitorRoutePerformance() {
        // Monitor SPA route navigation performance
        let navigationStart = performance.now()

        // Listen for route changes (works with Vue Router)
        const originalPushState = history.pushState
        const originalReplaceState = history.replaceState

        const wrapHistoryMethod = (method) => {
            return function (...args) {
                const startTime = performance.now()
                const result = method.apply(this, args)

                // Measure route change time
                requestAnimationFrame(() => {
                    const routeChangeTime = performance.now() - startTime

                    if (routeChangeTime > 100) {
                        // Only log slow routes
                        console.log(`🚀 Route Change: ${routeChangeTime.toFixed(2)}ms to ${args[2] || 'unknown'}`)
                    }
                })

                return result
            }
        }

        history.pushState = wrapHistoryMethod(originalPushState)
        history.replaceState = wrapHistoryMethod(originalReplaceState)
    }

    // Get current performance summary
    getSummary() {
        return {
            metrics: this.metrics,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
        }
    }

    // Check if performance meets thresholds
    isPerformanceGood() {
        const criticalMetrics = ['LCP', 'FCP', 'CLS']
        return criticalMetrics.every((metric) => {
            const data = this.metrics[metric]
            return data && this.getRating(metric, data.value) !== 'poor'
        })
    }
}

// Create and export global performance monitor instance
const performanceMonitor = new PerformanceMonitor({
    enableLogging: true, // Enable in development
    enableAnalytics: false, // Disable until analytics setup

    // Custom thresholds for bookstore app
    thresholds: {
        CLS: 0.1,
        INP: 200,
        FCP: 1500, // Slightly stricter for better UX
        LCP: 2000, // Stricter target for e-commerce
        TTFB: 600, // Fast server response target
    },
})

export default performanceMonitor
