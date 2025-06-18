import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Import Vuetify styles and optimized config
import { vuetify } from '@/config/vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Import performance monitoring
import './utils/performanceMonitor.js'

const app = createApp(App)
const pinia = createPinia()

// Setup application plugins
app.use(pinia)
app.use(router)
app.use(vuetify)

// Store app instance globally for debugging in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    window.__VUE_APP__ = app
}

// Initialize authentication and mount application
import { useAuthStore } from './store'

const authStore = useAuthStore()
authStore.initialize().then(() => {
    app.mount('#app')
    console.log('✅ Application initialized successfully')
})
