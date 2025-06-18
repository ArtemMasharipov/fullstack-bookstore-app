import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// Advanced Vite configuration for optimal bundle size
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    build: {
        target: 'es2015',
        outDir: '../dist',
        sourcemap: false,
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
            },
        },
        rollupOptions: {
            output: {
                manualChunks: {
                    // Vue ecosystem
                    vue: ['vue'],
                    'vue-router': ['vue-router'],
                    pinia: ['pinia'],

                    // UI framework (optimized)
                    'vuetify-core': ['vuetify/components', 'vuetify/directives'],

                    // Utilities
                    lodash: ['lodash-es/debounce'],
                    axios: ['axios'],

                    // Third party UI
                    'element-plus': ['element-plus'],

                    // App modules
                    admin: [/src\/views\/admin/, /src\/components\/.*admin/],
                    store: [/src\/store/],
                    utils: [/src\/utils/, /src\/services/, /src\/composables/],
                },
            },
        },
        // CSS optimization
        cssCodeSplit: true,
        cssMinify: true,
    },
    // Development optimizations
    server: {
        port: 8080,
        host: true,
    },
    // Advanced optimizations
    optimizeDeps: {
        include: ['vue', 'vue-router', 'pinia', 'axios', 'lodash-es/debounce'],
        exclude: [
            'vuetify', // Let Vite handle Vuetify optimization
        ],
    },
    // Experimental features for better tree-shaking
    define: {
        __VUE_OPTIONS_API__: false, // Disable Options API if not used
        __VUE_PROD_DEVTOOLS__: false,
    },
})
