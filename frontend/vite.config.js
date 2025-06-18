import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    build: {
        outDir: path.resolve(__dirname, '../dist'),
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug'],
                // Remove unused code more aggressively
                dead_code: true,
                unused: true,
                // Remove comments in production
                keep_classnames: false,
                keep_fnames: false,
            },
            mangle: {
                // Mangle variable names for smaller size
                safari10: true,
            },
        },
        // CSS optimization
        cssCodeSplit: true,
        cssMinify: 'esbuild',
        // Reduce chunk size warnings threshold
        chunkSizeWarningLimit: 1000,
        // More aggressive target for smaller bundles
        target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // Node modules chunking
                    if (id.includes('node_modules')) {
                        // Vue ecosystem
                        if (id.includes('vue') && !id.includes('vuetify')) {
                            return 'vue-core'
                        }
                        if (id.includes('vue-router')) {
                            return 'vue-router'
                        }
                        if (id.includes('pinia')) {
                            return 'pinia'
                        }

                        // Vuetify components (separate chunk for better caching)
                        if (id.includes('vuetify')) {
                            return 'vuetify'
                        }

                        // Utility libraries
                        if (id.includes('lodash') || id.includes('axios')) {
                            return 'vendor-utils'
                        }

                        // Other node modules
                        return 'vendor'
                    }

                    // Application code chunking
                    if (id.includes('src/')) {
                        // Admin features
                        if (
                            id.includes('src/views/admin') ||
                            id.includes('src/components/layout/admin') ||
                            id.includes('AdminHeader') ||
                            id.includes('AdminSidebar')
                        ) {
                            return 'admin'
                        }

                        // Store modules
                        if (id.includes('src/store')) {
                            return 'store'
                        }

                        // Features by domain
                        if (id.includes('src/views/books') || id.includes('src/components/features/books')) {
                            return 'books-feature'
                        }
                        if (id.includes('src/views/authors') || id.includes('src/components/features/authors')) {
                            return 'authors-feature'
                        }
                        if (id.includes('src/views/cart') || id.includes('src/components/features/cart')) {
                            return 'cart-feature'
                        }
                        if (id.includes('src/views/orders') || id.includes('src/components/features/orders')) {
                            return 'orders-feature'
                        }

                        // Auth and common components
                        if (id.includes('src/views/auth') || id.includes('src/components/features/auth')) {
                            return 'auth-feature'
                        }
                    }
                },
                // Optimize chunk size and names
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]',
            },
        },
    },
    // CSS preprocessing optimizations
    css: {
        preprocessorOptions: {
            scss: {
                // Reduce Sass compilation overhead
                charset: false,
            },
        },
        // CSS modules optimization
        modules: {
            localsConvention: 'camelCase',
        },
    },
    // Build optimizations
    optimizeDeps: {
        include: ['vue', 'vue-router', 'pinia', 'axios', 'lodash-es/debounce'],
        exclude: [
            // Let Vite handle these with tree-shaking
            'vuetify',
            'element-plus',
        ],
    },
    // Feature flags for smaller bundles
    define: {
        __VUE_OPTIONS_API__: false, // Disable Options API support
        __VUE_PROD_DEVTOOLS__: false,
    },
    server: {
        port: 8080,
        open: true,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
})
