import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { i18n, loadLocale } from '@/i18n'
import { startWithLocaleRetry } from '@/i18n/bootstrap'
import { routeLocale } from '@/router/locale'
import { installSession } from '@/services/session'

// Import Vuetify styles and optimized config
import { vuetify } from '@/config/vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import '@/design/focus.css'

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
app.use(vuetify)
// Sign-out and every 401 end the session the same way, on the app's router
installSession(router)

// Store app instance globally for debugging in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    window.__VUE_APP__ = app
}

// Mount application
// Auth initialization happens in App.vue onMounted hook to avoid race conditions
startWithLocaleRetry({
    locale: routeLocale(router.resolve(window.location.pathname)),
    load: loadLocale,
    target: document.getElementById('app'),
    start: async () => {
        app.use(i18n)
        app.use(router)
        await router.isReady()
        app.mount('#app')
        logger.info('Application mounted successfully', { version: '2.0' }, 'app-init')
    },
})
