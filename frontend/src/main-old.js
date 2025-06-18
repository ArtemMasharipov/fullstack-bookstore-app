import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Import Vuetify with tree-shaking
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import 'vuetify/styles'



// Import only the most commonly used components (based on usage analysis)
import {
    // Feedback components (40+ usage)
    VAlert,
    // Essential App structure
    VApp,
    // Navigation components (50+ usage)
    VAppBar,
    VAutocomplete,
    VAvatar,
    VBadge,
    VBottomNavigation,
    VBreadcrumbs,
    VBreadcrumbsItem,
    VBtn,
    // Card components (150+ usage)
    VCard,
    VCardActions,
    VCardItem,
    VCardSubtitle,
    VCardText,
    VCardTitle,
    VCheckbox,
    // Data display components (30+ usage)
    VChip,
    // Layout components (highest usage - 200+)
    VCol,
    VCombobox,
    VContainer,
    // Admin/Data table components
    VDataTable,
    VDialog,
    VDivider,
    VExpansionPanel,
    VExpansionPanels,
    VExpansionPanelText,
    VExpansionPanelTitle,
    VFileInput,
    VFooter,
    VForm,
    VIcon,
    // Other frequently used components
    VImg,
    // List components (60+ usage)
    VList,
    VListItem,
    VListItemSubtitle,
    VListItemTitle,
    VMain,
    // Utility components (20+ usage)
    VMenu,
    VNavigationDrawer,
    VOverlay,
    VPagination,
    VProgressCircular,
    VProgressLinear,
    VRadio,
    VRadioGroup,
    VRating,
    VRow,
    VSelect,
    VSheet,
    VSkeletonLoader,
    VSlideGroup,
    VSlideGroupItem,
    VSlider,
    VSnackbar,
    VSpacer,
    VSwitch,
    VTab,
    VTabs,
    VTextarea,
    // Form components (70+ usage)
    VTextField,
    VToolbar,
    VToolbarTitle,
    VTooltip,
} from 'vuetify/components'

// Import necessary directives
import { Intersect, Ripple } from 'vuetify/directives'

// Create Vuetify instance with selective imports
const vuetify = createVuetify({
    components: {
        VApp,
        VMain,
        VCol,
        VBtn,
        VRow,
        VContainer,
        VIcon,
        VSpacer,
        VCard,
        VCardActions,
        VCardItem,
        VCardSubtitle,
        VCardText,
        VCardTitle,
        VTextField,
        VSelect,
        VCheckbox,
        VRadio,
        VRadioGroup,
        VSwitch,
        VForm,
        VList,
        VListItem,
        VListItemTitle,
        VListItemSubtitle,
        VAppBar,
        VNavigationDrawer,
        VTab,
        VTabs,
        VBottomNavigation,
        VAlert,
        VDialog,
        VSnackbar,
        VProgressCircular,
        VProgressLinear,
        VChip,
        VDivider,
        VAvatar,
        VBadge,
        VTooltip,
        VMenu,
        VSheet,
        VOverlay,
        VDataTable,
        VPagination,
        VImg,
        VTextarea,
        VToolbar,
        VToolbarTitle,
        VFooter,
        VBreadcrumbs,
        VBreadcrumbsItem,
        VSkeletonLoader,
        VSlider,
        VSlideGroup,
        VSlideGroupItem,
        VRating,
        VAutocomplete,
        VCombobox,
        VFileInput,
        VExpansionPanels,
        VExpansionPanel,
        VExpansionPanelTitle,
        VExpansionPanelText,
    },
    directives: {
        Ripple,
        Intersect,
    },
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
                },
            },
        },
    },
})

const app = createApp(App)
const pinia = createPinia()

// Create application with Pinia, Router and Vuetify
app.use(pinia).use(router).use(vuetify)

// Store app instance globally (optional, for debugging)
if (typeof window !== 'undefined') {
    window.__VUE_APP__ = app
}

// Import authentication store and initialize application
import { useAuthStore } from './store'

// Import performance monitoring (Web Vitals)
import './utils/performanceMonitor.js'

// Initialize authentication state before mounting the application
const authStore = useAuthStore()
authStore.initialize().then(() => {
    // Mount the app
    app.mount('#app')
    console.log('✅ Application initialized successfully')
})
