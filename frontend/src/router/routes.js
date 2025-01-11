const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/HomeView.vue')
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/LoginView.vue'),
        meta: { guest: true }
    },
    {
        path: '/books',
        name: 'Books',
        component: () => import('@/views/BooksView.vue')
    },
    {
        path: '/books/:id',
        name: 'BookDetails',
        component: () => import('@/views/BookDetailsView.vue')
    },
    {
        path: '/authors',
        name: 'Authors',
        component: () => import('@/views/AuthorsView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/authors/:id',
        name: 'AuthorDetails',
        component: () => import('@/views/AuthorDetailsView.vue')
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('@/views/RegisterView.vue'),
        meta: { guest: true }
    },
    {
        path: '/books/new',
        name: 'CreateBook',
        component: () => import('@/components/books/BookForm.vue'),
        meta: { 
            requiresAuth: true,
            requiredPermission: 'create:book'
        }
    },
    {
        path: '/books/:id/edit',
        name: 'EditBook',
        component: () => import('@/components/books/BookForm.vue'),
        meta: { 
            requiresAuth: true,
            requiredPermission: 'update:book'
        }
    },
    {
        path: '/authors/new',
        name: 'CreateAuthor',
        component: () => import('@/components/authors/AuthorForm.vue'),
        meta: { 
            requiresAuth: true,
            requiredPermission: 'create:author'
        }
    },
    {
        path: '/authors/:id/edit',
        name: 'EditAuthor',
        component: () => import('@/components/authors/AuthorForm.vue'),
        meta: { 
            requiresAuth: true,
            requiredPermission: 'update:author'
        }
    },
    {
        path: '/about',
        name: 'About',
        component: () => import('@/views/AboutView.vue')
    },
    {
        path: '/cart',
        name: 'Cart',
        component: () => import('@/views/CartView.vue'),
        meta: {
            requiresAuth: false // Allow both authenticated and unauthenticated users
        }
    },
    {
        path: '/checkout',
        name: 'Checkout',
        component: () => import('@/views/CheckoutView.vue'),
        meta: { 
            requiresAuth: true,
            requiredPermission: 'create:order'
        }
    },
    {
        path: '/orders',
        name: 'Orders',
        component: () => import('@/views/OrdersView.vue'),
        meta: { 
            requiresAuth: true,
            requiredPermission: 'read:order'
        }
    },
    {
        path: '/orders/:id',
        name: 'OrderDetails',
        component: () => import('@/views/OrderDetailsView.vue'),
        meta: { 
            requiresAuth: true,
            requiredPermission: 'read:order'
        }
    },
    {
        path: '/orders/:id/status',
        name: 'OrderStatus',
        component: () => import('@/views/OrderStatusView.vue'),
        meta: { 
            requiresAuth: true,
            requiredPermission: 'update:order'
        }
    },
    {
        path: '/contact',
        name: 'Contact',
        component: () => import('@/views/ContactView.vue')
    },
    {
        path: '/privacy',
        name: 'Privacy',
        component: () => import('@/views/PrivacyView.vue')
    }
]

export default routes