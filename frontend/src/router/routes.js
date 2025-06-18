const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/public/HomeView.vue'),
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: { guest: true },
    },
    {
        path: '/books',
        name: 'Books',
        component: () => import('@/views/public/BooksView.vue'),
    },
    {
        path: '/books/:id',
        name: 'BookDetails',
        component: () => import('@/views/public/BookDetailsView.vue'),
    },
    {
        path: '/authors',
        name: 'Authors',
        component: () => import('@/views/public/AuthorsView.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/authors/:id',
        name: 'AuthorDetails',
        component: () => import('@/views/public/AuthorDetailsView.vue'),
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('@/views/auth/RegisterView.vue'),
        meta: { guest: true },
    },
    // Admin routes
    {
        path: '/admin',
        component: () => import('@/views/admin/AdminWrapper.vue'),
        meta: {
            requiresAuth: true,
            requiredPermission: 'admin:access',
        },
        children: [
            {
                path: '',
                name: 'AdminDashboard',
                component: () => import('@/views/admin/AdminDashboardView.vue'),
            },
            {
                path: 'books',
                name: 'AdminBooks',
                component: () => import('@/views/admin/AdminBooksView.vue'),
            },
            {
                path: 'authors',
                name: 'AdminAuthors',
                component: () => import('@/views/admin/AdminAuthorsView.vue'),
            },
            {
                path: 'orders',
                name: 'AdminOrders',
                component: () => import('@/views/admin/AdminOrdersView.vue'),
            },
            {
                path: 'users',
                name: 'AdminUsers',
                component: () => import('@/views/admin/AdminUsersView.vue'),
            },
            {
                path: 'settings',
                name: 'AdminSettings',
                component: () => import('@/views/admin/AdminSettingsView.vue'),
            },
        ],
    },

    // Temporary placeholders for book and author management
    {
        path: '/books/new',
        name: 'CreateBook',
        component: () => import('@/views/errors/PlaceholderView.vue'),
        meta: {
            requiresAuth: true,
            requiredPermission: 'create:book',
        },
    },
    {
        path: '/books/:id/edit',
        name: 'EditBook',
        component: () => import('@/views/errors/PlaceholderView.vue'),
        meta: {
            requiresAuth: true,
            requiredPermission: 'update:book',
        },
    },
    {
        path: '/authors/new',
        name: 'CreateAuthor',
        component: () => import('@/views/errors/PlaceholderView.vue'),
        meta: {
            requiresAuth: true,
            requiredPermission: 'create:author',
        },
    },
    {
        path: '/authors/:id/edit',
        name: 'EditAuthor',
        component: () => import('@/views/errors/PlaceholderView.vue'),
        meta: {
            requiresAuth: true,
            requiredPermission: 'update:author',
        },
    },
    {
        path: '/about',
        name: 'About',
        component: () => import('@/views/public/AboutView.vue'),
    },
    {
        path: '/cart',
        name: 'Cart',
        component: () => import('@/views/public/CartView.vue'),
        meta: {
            requiresAuth: false, // Allow both authenticated and unauthenticated users
        },
    },
    {
        path: '/checkout',
        name: 'Checkout',
        component: () => import('@/views/public/CheckoutView.vue'),
        meta: {
            requiresAuth: true,
            requiredPermission: 'create:order',
        },
    },
    {
        path: '/orders',
        name: 'Orders',
        component: () => import('@/views/orders/OrdersView.vue'),
        meta: {
            requiresAuth: true,
            requiredPermission: 'read:order',
        },
    },
    {
        path: '/orders/:id',
        name: 'OrderDetails',
        component: () => import('@/views/orders/OrderDetailsView.vue'),
        meta: {
            requiresAuth: true,
            requiredPermission: 'read:order',
        },
    },
    {
        path: '/orders/:id/status',
        name: 'OrderStatus',
        component: () => import('@/views/orders/OrderStatusView.vue'),
        meta: {
            requiresAuth: true,
            requiredPermission: 'update:order',
        },
    },
    {
        path: '/contact',
        name: 'Contact',
        component: () => import('@/views/public/ContactView.vue'),
    },
    {
        path: '/privacy',
        name: 'Privacy',
        component: () => import('@/views/public/PrivacyView.vue'),
    },
]

export default routes
