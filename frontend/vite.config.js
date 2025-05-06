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
            },
        },
        rollupOptions: {
            output: {
                manualChunks: {
                    vue: ['vue', 'vue-router'],
                    elementPlus: ['element-plus'],
                    vendor: ['axios', 'lodash', 'jwt-decode'],
                },
            },
        },
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
