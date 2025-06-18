/**
 * Оптимизированная конфигурация Vuetify
 * Импортируются только действительно используемые компоненты
 * Основано на анализе usage statistics
 */

import { createVuetify } from 'vuetify'

// Импорт только часто используемых компонентов (20+ usages)
import {
    VAlert, // 20 usages - разделители

    // Базовая структура приложения
    VApp, // 6 usages - основной контент

    // Навигация (используется в layout)
    VAppBar,
    VAutocomplete, // 4 usages
    VAvatar, // 2 usages
    VBadge,
    VBottomNavigation,
    VBreadcrumbs,
    VBreadcrumbsItem,
    // Критически важные (100+ usages)
    VBtn, // 182 usages - кнопки
    VCard, // 327 usages - карточки
    VCardActions,
    VCardItem,
    VCardSubtitle,
    VCardText,
    VCardTitle,
    VCheckbox, // 37 usages - алерты
    VChip,
    VCol,
    VCombobox, // 76 usages - строки grid

    // Очень важные (50-100 usages)
    VContainer,
    // Редко используемые, но критичные для admin панели
    VDataTable, // 20 usages - селекты
    VDialog, // 36 usages - чипы
    VDivider,
    VExpansionPanel,
    VExpansionPanels,
    VExpansionPanelText,
    VExpansionPanelTitle,
    VFileInput,
    VFooter, // 32 usages - диалоги
    VForm, // 58 usages - поля ввода
    VIcon,
    VImg, // 56 usages - иконки
    VList, // 98 usages - списки
    VListItem,
    VListItemSubtitle,
    VListItemTitle, // 11 usages - корневой компонент
    VMain,
    // Менее критичные (условно импортируем)
    VMenu,
    VNavigationDrawer,
    VOverlay, // 4 usages - только в admin
    VPagination,
    // Дополнительные часто нужные
    VProgressCircular,
    VProgressLinear,
    VRadio,
    VRadioGroup,
    VRating, // 168 usages - колонки grid
    VRow,
    // Важные (20-50 usages)
    VSelect, // 6 usages
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
    VTextarea, // 62 usages - контейнеры
    VTextField,
    VToolbar,
    VToolbarTitle,
    VTooltip,
} from 'vuetify/components'

// Импорт необходимых директив
import { Intersect, Ripple } from 'vuetify/directives'

// Создание оптимизированной конфигурации Vuetify
export const vuetify = createVuetify({
    components: {
        // Критически важные компоненты
        VApp,
        VMain,
        VBtn,
        VCard,
        VCardActions,
        VCardItem,
        VCardSubtitle,
        VCardText,
        VCardTitle,
        VCol,
        VRow,
        VContainer,
        VTextField,
        VIcon,
        VSpacer,

        // Списки и навигация
        VList,
        VListItem,
        VListItemTitle,
        VListItemSubtitle,
        VAppBar,
        VNavigationDrawer,

        // Формы и интерактивность
        VSelect,
        VDialog,
        VForm,
        VAlert,
        VChip,
        VDivider,
        VCheckbox,
        VRadio,
        VRadioGroup,
        VSwitch,
        VSnackbar,
        VTooltip,

        // Индикаторы прогресса
        VProgressCircular,
        VProgressLinear,

        // Admin компоненты (используются реже)
        VDataTable,
        VPagination,
        VImg,
        VTextarea,
        VTabs,
        VTab,
        VToolbar,
        VToolbarTitle,
        VFooter,
        VBreadcrumbs,
        VBreadcrumbsItem,
        VSkeletonLoader,

        // Дополнительные UI компоненты
        VMenu,
        VAvatar,
        VSheet,
        VBadge,
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
        VOverlay,
        VBottomNavigation,
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

export default vuetify
