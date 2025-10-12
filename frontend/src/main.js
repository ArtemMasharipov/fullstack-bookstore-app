import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Import Vuetify styles and optimized config
import { vuetify } from '@/config/vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Import logging
import { setupGlobalErrorHandling } from '@/utils/errorHandler'
import { logger, setupGlobalErrorLogging } from '@/utils/logger'

const app = createApp(App)
const pinia = createPinia()

// Setup global error logging and handling
setupGlobalErrorLogging(app)
setupGlobalErrorHandling()

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
authStore
    .initialize()
    .then(() => {
        app.mount('#app')
        logger.info('Application initialized successfully', { version: '2.0' }, 'app-init')
    })
    .catch((error) => {
        console.error('Failed to initialize application:', error)
        // Mount app anyway to show error page
        app.mount('#app')
    })
