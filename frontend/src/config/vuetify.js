/**
 * Оптимизированная конфигурация Vuetify с tree-shaking
 * Импортируются только критически важные компоненты
 * Остальные компоненты загружаются динамически
 */

import { createVuetify } from 'vuetify'

// Критически важные компоненты (используются на каждой странице)
import {
    // Алерты
    VAlert,
    // Базовая структура приложения
    VApp,
    // Навигация
    VAppBar,
    // Автокомплит
    VAutocomplete,
    // Аватар
    VAvatar,

    // Бейдж
    VBadge,
    // Нижняя навигация
    VBottomNavigation,
    // Хлебные крошки
    VBreadcrumbs,
    VBreadcrumbsItem,
    // Основные компоненты
    VBtn,
    VCard,
    VCardActions,
    VCardItem,
    VCardSubtitle,
    VCardText,
    VCardTitle,
    VCheckbox,
    // Чипы
    VChip,
    VCol,
    // Комбобокс
    VCombobox,
    VContainer,
    // Таблицы (только для админки)
    VDataTable,
    // Диалоги и модальные окна
    VDialog,
    // Разделители
    VDivider,
    VExpansionPanel,
    VExpansionPanelText,
    VExpansionPanelTitle,
    // Расширяемые панели
    VExpansionPanels,
    // Файловый ввод
    VFileInput,
    // Футер
    VFooter,
    // Формы
    VForm,
    // Иконки и изображения
    VIcon,
    VImg,
    // Списки
    VList,
    VListItem,
    VListItemSubtitle,
    VListItemTitle,
    VMain,
    // Меню
    VMenu,
    VNavigationDrawer,
    // Оверлей
    VOverlay,
    // Пагинация
    VPagination,
    // Прогресс
    VProgressCircular,
    VProgressLinear,
    // Радио
    VRadio,
    VRadioGroup,
    // Рейтинг
    VRating,
    // Сетка
    VRow,
    VSelect,
    // Лист
    VSheet,
    // Скелетон лоадер
    VSkeletonLoader,
    // Слайд группа
    VSlideGroup,
    VSlideGroupItem,
    // Слайдер
    VSlider,

    // Снакбар
    VSnackbar,

    // Спасер
    VSpacer,
    VSwitch,
    VTab,
    // Табы
    VTabs,
    VTextField,
    VTextarea,
    // Тулбар
    VToolbar,
    VToolbarTitle,

    // Тултип
    VTooltip
} from 'vuetify/components'

// Импорт необходимых директив
import { Intersect, Ripple } from 'vuetify/directives'

// Создание оптимизированной конфигурации Vuetify
export const vuetify = createVuetify({
    components: {
        // Базовая структура приложения
        VApp,
        VMain,
        VContainer,
        
        // Навигация
        VAppBar,
        VNavigationDrawer,
        
        // Основные компоненты
        VBtn,
        VCard,
        VCardActions,
        VCardItem,
        VCardSubtitle,
        VCardText,
        VCardTitle,
        
        // Формы
        VForm,
        VTextField,
        VTextarea,
        VSelect,
        VCheckbox,
        VSwitch,
        
        // Сетка
        VRow,
        VCol,
        
        // Иконки и изображения
        VIcon,
        VImg,
        
        // Диалоги и модальные окна
        VDialog,
        
        // Списки
        VList,
        VListItem,
        VListItemTitle,
        VListItemSubtitle,
        
        // Разделители
        VDivider,
        
        // Прогресс
        VProgressCircular,
        VProgressLinear,
        
        // Чипы
        VChip,
        
        // Пагинация
        VPagination,
        
        // Алерты
        VAlert,
        
        // Меню
        VMenu,
        
        // Файловый ввод
        VFileInput,
        
        // Автокомплит
        VAutocomplete,
        
        // Таблицы (только для админки)
        VDataTable,
        
        // Аватар
        VAvatar,
        
        // Бейдж
        VBadge,
        
        // Футер
        VFooter,
        
        // Хлебные крошки
        VBreadcrumbs,
        VBreadcrumbsItem,
        
        // Расширяемые панели
        VExpansionPanels,
        VExpansionPanel,
        VExpansionPanelTitle,
        VExpansionPanelText,
        
        // Комбобокс
        VCombobox,
        
        // Оверлей
        VOverlay,
        
        // Нижняя навигация
        VBottomNavigation,
        
        // Скелетон лоадер
        VSkeletonLoader,
        
        // Слайдер
        VSlider,
        
        // Снакбар
        VSnackbar,
        
        // Спасер
        VSpacer,
        
        // Табы
        VTabs,
        VTab,
        
        // Тулбар
        VToolbar,
        VToolbarTitle,
        
        // Тултип
        VTooltip,
        
        // Лист
        VSheet,
        
        // Слайд группа
        VSlideGroup,
        VSlideGroupItem,
        
        // Рейтинг
        VRating,
        
        // Радио
        VRadio,
        VRadioGroup
    },
    
    directives: {
        Intersect,
        Ripple
    },
    
    theme: {
        defaultTheme: 'light',
        themes: {
            light: {
                colors: {
                    primary: '#1976D2',
                    secondary: '#424242',
                    accent: '#82B1FF',
                    error: '#FF5252',
                    info: '#2196F3',
                    success: '#4CAF50',
                    warning: '#FFC107'
                }
            },
            dark: {
                colors: {
                    primary: '#2196F3',
                    secondary: '#424242',
                    accent: '#FF4081',
                    error: '#FF5252',
                    info: '#2196F3',
                    success: '#4CAF50',
                    warning: '#FFC107'
                }
            }
        }
    },
    
    defaults: {
        VBtn: {
            variant: 'elevated',
            color: 'primary'
        },
        VCard: {
            variant: 'elevated'
        },
        VTextField: {
            variant: 'outlined',
            density: 'comfortable'
        },
        VSelect: {
            variant: 'outlined',
            density: 'comfortable'
        },
        VTextarea: {
            variant: 'outlined',
            density: 'comfortable'
        }
    }
})