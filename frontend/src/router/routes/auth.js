/**
 * Auth Routes
 * Authentication routes
 */

import { guestGuard } from '../guards/guest.js'

export const authRoutes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/auth/LoginView.vue'),
        beforeEnter: guestGuard,
        meta: {
            title: 'Вход',
            guest: true,
        },
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('@/views/auth/RegisterView.vue'),
        beforeEnter: guestGuard,
        meta: {
            title: 'Регистрация',
            guest: true,
        },
    },
    {
        path: '/profile',
        name: 'Profile',
        component: () => import('@/views/auth/ProfileView.vue'),
        meta: {
            title: 'Профиль',
            requiresAuth: true,
        },
    },
]
