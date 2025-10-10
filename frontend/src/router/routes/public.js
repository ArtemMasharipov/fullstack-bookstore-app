/**
 * Public Routes
 * Публичные маршруты приложения
 */

export const publicRoutes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/public/HomeView.vue'),
        meta: {
            title: 'Главная',
        },
    },
    {
        path: '/books',
        name: 'Books',
        component: () => import('@/views/public/BooksView.vue'),
        meta: {
            title: 'Книги',
        },
    },
    {
        path: '/books/:id',
        name: 'BookDetails',
        component: () => import('@/views/public/BookDetailsView.vue'),
        meta: {
            title: 'Детали книги',
        },
    },
    {
        path: '/authors',
        name: 'Authors',
        component: () => import('@/views/public/AuthorsView.vue'),
        meta: {
            title: 'Авторы',
        },
    },
    {
        path: '/authors/:id',
        name: 'AuthorDetails',
        component: () => import('@/views/public/AuthorDetailsView.vue'),
        meta: {
            title: 'Об авторе',
        },
    },
    {
        path: '/cart',
        name: 'Cart',
        component: () => import('@/views/public/CartView.vue'),
        meta: {
            title: 'Корзина',
        },
    },
    {
        path: '/checkout',
        name: 'Checkout',
        component: () => import('@/views/public/CheckoutView.vue'),
        meta: {
            title: 'Оформление заказа',
        },
    },
]
