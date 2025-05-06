import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Import Vuetify
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'

// Create Vuetify instance
const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#42b983',
          secondary: '#2c3e50',
          error: '#dc3545',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107',
        }
      }
    }
  }
})

const app = createApp(App)
const pinia = createPinia()

// Create application with Pinia, Router and Vuetify
app
    .use(pinia)
    .use(router)
    .use(vuetify)

// Import authentication store and initialize application
import { useAuthStore } from './stores/auth'

// Initialize authentication state before mounting the application
const authStore = useAuthStore()
authStore.initialize().then(() => {
    app.mount('#app')
})
