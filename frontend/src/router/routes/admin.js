/**
 * Admin Routes
 * Admin routes
 */

import { adminGuard } from '../guards/admin.js'

export const adminRoutes = [
    {
        path: '/admin',
        component: () => import('@/views/admin/AdminWrapper.vue'),
        beforeEnter: adminGuard,
        meta: {
            title: 'Админ панель',
            requiresAuth: true,
            requiredPermission: 'admin:access',
        },
        children: [
            {
                path: '',
                name: 'AdminDashboard',
                component: () => import('@/views/admin/AdminDashboardView.vue'),
                meta: {
                    title: 'Панель управления',
                },
            },
            {
                path: 'books',
                name: 'AdminBooks',
                component: () => import('@/views/admin/AdminBooksView.vue'),
                meta: {
                    title: 'Управление книгами',
                },
            },
            {
                path: 'authors',
                name: 'AdminAuthors',
                component: () => import('@/views/admin/AdminAuthorsView.vue'),
                meta: {
                    title: 'Управление авторами',
                },
            },
            {
                path: 'orders',
                name: 'AdminOrders',
                component: () => import('@/views/admin/AdminOrdersView.vue'),
                meta: {
                    title: 'Управление заказами',
                },
            },
            {
                path: 'users',
                name: 'AdminUsers',
                component: () => import('@/views/admin/AdminUsersView.vue'),
                meta: {
                    title: 'Управление пользователями',
                },
            },
            {
                path: 'settings',
                name: 'AdminSettings',
                component: () => import('@/views/admin/AdminSettingsView.vue'),
                meta: {
                    title: 'Настройки',
                },
            },
        ],
    },
]
