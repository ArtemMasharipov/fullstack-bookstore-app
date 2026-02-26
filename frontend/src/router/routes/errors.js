/**
 * Error Routes
 * Error routes
 */

export const errorRoutes = [
    {
        path: '/error',
        name: 'Error',
        component: () => import('@/views/errors/ErrorView.vue'),
        meta: {
            title: 'Ошибка',
        },
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/errors/NotFoundView.vue'),
        meta: {
            title: 'Страница не найдена',
        },
    },
]
