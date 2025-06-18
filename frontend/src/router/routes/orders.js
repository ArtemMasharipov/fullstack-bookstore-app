/**
 * Orders Routes
 * Маршруты заказов (требуют аутентификации)
 */

export const ordersRoutes = [
    {
        path: '/orders',
        name: 'Orders',
        component: () => import('@/views/orders/OrdersView.vue'),
        meta: {
            title: 'Мои заказы',
            requiresAuth: true,
        },
    },
    {
        path: '/orders/:id',
        name: 'OrderDetails',
        component: () => import('@/views/orders/OrderDetailsView.vue'),
        meta: {
            title: 'Детали заказа',
            requiresAuth: true,
        },
    },
    {
        path: '/orders/:id/status',
        name: 'OrderStatus',
        component: () => import('@/views/orders/OrderStatusView.vue'),
        meta: {
            title: 'Статус заказа',
            requiresAuth: true,
        },
    },
]
