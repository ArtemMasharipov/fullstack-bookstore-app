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
                    primary: '#1B2A4A',
                    secondary: '#D4A574',
                    accent: '#E8C547',
                    error: '#C0392B',
                    info: '#2196F3',
                    success: '#42b983',
                    warning: '#F39C12',
                    surface: '#FAFAF7',
                    background: '#FAFAF7',
                    'on-primary': '#FFFFFF',
                    'on-secondary': '#FFFFFF',
                    'on-surface': '#2D3436',
                    'on-background': '#2D3436',
                    'surface-variant': '#F0EDE8',
                    'on-surface-variant': '#5A5A5A',
                },
            },
            dark: {
                colors: {
                    primary: '#3A5A8C',
                    secondary: '#D4A574',
                    accent: '#E8C547',
                    error: '#E74C3C',
                    info: '#2196F3',
                    success: '#42b983',
                    warning: '#F39C12',
                    surface: '#1A1A1A',
                    background: '#121212',
                    'on-primary': '#FFFFFF',
                    'on-secondary': '#FFFFFF',
                    'on-surface': '#E8E8E8',
                    'on-background': '#E8E8E8',
                    'surface-variant': '#2A2A2A',
                    'on-surface-variant': '#B0B0B0',
                },
            },
        },
    },

    defaults: {
        VBtn: {
            variant: 'elevated',
            color: 'primary',
            rounded: 'lg',
        },
        VCard: {
            variant: 'elevated',
            rounded: 'lg',
        },
        VTextField: {
            variant: 'outlined',
            density: 'comfortable',
            rounded: 'lg',
        },
        VSelect: {
            variant: 'outlined',
            density: 'comfortable',
            rounded: 'lg',
        },
        VTextarea: {
            variant: 'outlined',
            density: 'comfortable',
            rounded: 'lg',
        },
        VChip: {
            rounded: 'lg',
            variant: 'tonal',
        },
        VAlert: {
            rounded: 'lg',
            variant: 'tonal',
        },
        VAppBar: {
            color: 'primary',
        },
    },
})
