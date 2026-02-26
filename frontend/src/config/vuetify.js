/**
 * Optimized Vuetify configuration with tree-shaking
 * Only critical components are imported
 * Other components are loaded dynamically
 */

import { createVuetify } from 'vuetify'

// Critical components (used on every page)
import {
    // Alerts
    VAlert,
    // Base application layout
    VApp,
    // Navigation
    VAppBar,
    // Autocomplete
    VAutocomplete,
    // Avatar
    VAvatar,

    // Badge
    VBadge,
    // Bottom navigation
    VBottomNavigation,
    // Breadcrumbs
    VBreadcrumbs,
    VBreadcrumbsItem,
    // Core components
    VBtn,
    VCard,
    VCardActions,
    VCardItem,
    VCardSubtitle,
    VCardText,
    VCardTitle,
    VCheckbox,
    // Chips
    VChip,
    VCol,
    // Combobox
    VCombobox,
    VContainer,
    // Data tables (admin only)
    VDataTable,
    // Dialogs and modals
    VDialog,
    // Dividers
    VDivider,
    VExpansionPanel,
    VExpansionPanelText,
    VExpansionPanelTitle,
    // Expansion panels
    VExpansionPanels,
    // File input
    VFileInput,
    // Footer
    VFooter,
    // Forms
    VForm,
    // Icons and images
    VIcon,
    VImg,
    // Lists
    VList,
    VListItem,
    VListItemSubtitle,
    VListItemTitle,
    VMain,
    // Menus
    VMenu,
    VNavigationDrawer,
    // Overlay
    VOverlay,
    // Pagination
    VPagination,
    // Progress
    VProgressCircular,
    VProgressLinear,
    // Radio
    VRadio,
    VRadioGroup,
    // Rating
    VRating,
    // Grid
    VRow,
    VSelect,
    // Sheet
    VSheet,
    // Skeleton loader
    VSkeletonLoader,
    // Slide group
    VSlideGroup,
    VSlideGroupItem,
    // Slider
    VSlider,

    // Snackbar
    VSnackbar,

    // Spacer
    VSpacer,
    VSwitch,
    VTab,
    // Tabs
    VTabs,
    VTextField,
    VTextarea,
    // Toolbar
    VToolbar,
    VToolbarTitle,

    // Tooltip
    VTooltip,
} from 'vuetify/components'

// Import required directives
import { Intersect, Ripple } from 'vuetify/directives'

// Create optimized Vuetify configuration
export const vuetify = createVuetify({
    components: {
        // Base application layout
        VApp,
        VMain,
        VContainer,

        // Navigation
        VAppBar,
        VNavigationDrawer,

        // Core components
        VBtn,
        VCard,
        VCardActions,
        VCardItem,
        VCardSubtitle,
        VCardText,
        VCardTitle,

        // Forms
        VForm,
        VTextField,
        VTextarea,
        VSelect,
        VCheckbox,
        VSwitch,

        // Grid
        VRow,
        VCol,

        // Icons and images
        VIcon,
        VImg,

        // Dialogs and modals
        VDialog,

        // Lists
        VList,
        VListItem,
        VListItemTitle,
        VListItemSubtitle,

        // Dividers
        VDivider,

        // Progress
        VProgressCircular,
        VProgressLinear,

        // Chips
        VChip,

        // Pagination
        VPagination,

        // Alerts
        VAlert,

        // Menus
        VMenu,

        // File input
        VFileInput,

        // Autocomplete
        VAutocomplete,

        // Data tables (admin only)
        VDataTable,

        // Avatar
        VAvatar,

        // Badge
        VBadge,

        // Footer
        VFooter,

        // Breadcrumbs
        VBreadcrumbs,
        VBreadcrumbsItem,

        // Expansion panels
        VExpansionPanels,
        VExpansionPanel,
        VExpansionPanelTitle,
        VExpansionPanelText,

        // Combobox
        VCombobox,

        // Overlay
        VOverlay,

        // Bottom navigation
        VBottomNavigation,

        // Skeleton loader
        VSkeletonLoader,

        // Slider
        VSlider,

        // Snackbar
        VSnackbar,

        // Spacer
        VSpacer,

        // Tabs
        VTabs,
        VTab,

        // Toolbar
        VToolbar,
        VToolbarTitle,

        // Tooltip
        VTooltip,

        // Sheet
        VSheet,

        // Slide group
        VSlideGroup,
        VSlideGroupItem,

        // Rating
        VRating,

        // Radio
        VRadio,
        VRadioGroup,
    },

    directives: {
        Intersect,
        Ripple,
    },

    theme: {
        defaultTheme: 'light',
        themes: {
            light: {
                colors: {
                    primary: '#42b983',
                    secondary: '#424242',
                    accent: '#8dedc9',
                    error: '#dc3545',
                    info: '#2196F3',
                    success: '#4CAF50',
                    warning: '#FFC107',
                    surface: '#ffffff',
                    'on-primary': '#ffffff',
                    'on-surface': '#2c3e50',
                },
            },
            dark: {
                colors: {
                    primary: '#3a9e77',
                    secondary: '#424242',
                    accent: '#8dedc9',
                    error: '#dc3545',
                    info: '#2196F3',
                    success: '#4CAF50',
                    warning: '#FFC107',
                    surface: '#121212',
                    'on-primary': '#ffffff',
                    'on-surface': '#ffffff',
                },
            },
        },
    },

    defaults: {
        VBtn: {
            variant: 'elevated',
            color: 'primary',
        },
        VCard: {
            variant: 'elevated',
        },
        VTextField: {
            variant: 'outlined',
            density: 'comfortable',
        },
        VSelect: {
            variant: 'outlined',
            density: 'comfortable',
        },
        VTextarea: {
            variant: 'outlined',
            density: 'comfortable',
        },
        VAppBar: {
            color: 'primary',
        },
    },
})
