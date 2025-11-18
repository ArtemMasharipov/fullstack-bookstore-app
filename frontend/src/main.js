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

// Mount application
// Auth initialization happens in App.vue onMounted hook to avoid race conditions
app.mount('#app')
logger.info('Application mounted successfully', { version: '2.0' }, 'app-init')
