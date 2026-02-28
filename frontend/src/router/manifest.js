/**
 * Route Manifest — single source of truth for the entire routing system.
 *
 * Each entry drives three things at once:
 *   1. Vue Router route object   (via buildRoutes)
 *   2. Admin sidebar navigation  (via buildAdminNav)
 *   3. Access-policy enforcement (via unified guard)
 *
 * Access policy shape:
 *   auth        {boolean} — route requires an authenticated user
 *   guestOnly   {boolean} — redirect to Home when user is already logged in
 *   permission  {string}  — user must pass authStore.hasPermission(permission)
 *
 * Nav shape (admin children only):
 *   section  {string} — sidebar section key, e.g. 'main' | 'system'
 *   order    {number} — sort order within the section
 *   icon     {string} — Material Design Icon name
 *   subtitle {string} — optional second line shown in the sidebar item
 */

export const routeManifest = [
    // ── Public ──────────────────────────────────────────────────────────
    {
        id: 'Home',
        path: '/',
        view: () => import('@/views/public/HomeView.vue'),
        title: 'Home',
        access: {},
    },
    {
        id: 'Books',
        path: '/books',
        view: () => import('@/views/public/BooksView.vue'),
        title: 'Books',
        access: {},
    },
    {
        id: 'BookDetails',
        path: '/books/:id',
        view: () => import('@/views/public/BookDetailsView.vue'),
        title: 'Book Details',
        access: {},
    },
    {
        id: 'Authors',
        path: '/authors',
        view: () => import('@/views/public/AuthorsView.vue'),
        title: 'Authors',
        access: {},
    },
    {
        id: 'AuthorDetails',
        path: '/authors/:id',
        view: () => import('@/views/public/AuthorDetailsView.vue'),
        title: 'Author Details',
        access: {},
    },
    {
        id: 'Cart',
        path: '/cart',
        view: () => import('@/views/public/CartView.vue'),
        title: 'Cart',
        access: {},
    },
    {
        id: 'Checkout',
        path: '/checkout',
        view: () => import('@/views/public/CheckoutView.vue'),
        title: 'Checkout',
        access: { auth: true },
    },

    // ── Auth ────────────────────────────────────────────────────────────
    {
        id: 'Login',
        path: '/login',
        view: () => import('@/views/auth/LoginView.vue'),
        title: 'Login',
        access: { guestOnly: true },
    },
    {
        id: 'Register',
        path: '/register',
        view: () => import('@/views/auth/RegisterView.vue'),
        title: 'Register',
        access: { guestOnly: true },
    },
    {
        id: 'Profile',
        path: '/profile',
        view: () => import('@/views/auth/ProfileView.vue'),
        title: 'Profile',
        access: { auth: true },
    },

    // ── Orders ──────────────────────────────────────────────────────────
    {
        id: 'Orders',
        path: '/orders',
        view: () => import('@/views/orders/OrdersView.vue'),
        title: 'My Orders',
        access: { auth: true },
    },
    {
        id: 'OrderDetails',
        path: '/orders/:id',
        view: () => import('@/views/orders/OrderDetailsView.vue'),
        title: 'Order Details',
        access: { auth: true },
    },
    {
        id: 'OrderStatus',
        path: '/orders/:id/status',
        view: () => import('@/views/orders/OrderStatusView.vue'),
        title: 'Order Status',
        access: { auth: true },
    },

    // ── Admin (layout group) ────────────────────────────────────────────
    // The `layout` component wraps all children; its `access` is merged
    // into every child record by buildRoutes() so the unified guard sees it.
    {
        id: 'Admin',
        path: '/admin',
        layout: () => import('@/views/admin/AdminWrapper.vue'),
        access: { auth: true, permission: 'admin:access' },
        children: [
            {
                id: 'AdminDashboard',
                path: '',
                view: () => import('@/views/admin/AdminDashboardView.vue'),
                title: 'Dashboard',
                nav: { section: 'main', order: 10, icon: 'mdi-view-dashboard', subtitle: 'Overview & stats' },
            },
            {
                id: 'AdminBooks',
                path: 'books',
                view: () => import('@/views/admin/AdminBooksView.vue'),
                title: 'Books',
                nav: { section: 'main', order: 20, icon: 'mdi-book-multiple', subtitle: 'Manage inventory' },
            },
            {
                id: 'AdminAuthors',
                path: 'authors',
                view: () => import('@/views/admin/AdminAuthorsView.vue'),
                title: 'Authors',
                nav: { section: 'main', order: 30, icon: 'mdi-account-edit', subtitle: 'Author profiles' },
            },
            {
                id: 'AdminOrders',
                path: 'orders',
                view: () => import('@/views/admin/AdminOrdersView.vue'),
                title: 'Orders',
                nav: { section: 'main', order: 40, icon: 'mdi-cart', subtitle: 'Customer orders' },
            },
            {
                id: 'AdminUsers',
                path: 'users',
                view: () => import('@/views/admin/AdminUsersView.vue'),
                title: 'Users',
                nav: { section: 'main', order: 50, icon: 'mdi-account-group', subtitle: 'User accounts' },
            },
            {
                id: 'AdminSettings',
                path: 'settings',
                view: () => import('@/views/admin/AdminSettingsView.vue'),
                title: 'Settings',
                nav: { section: 'system', order: 10, icon: 'mdi-cog' },
            },
        ],
    },

    // ── Errors ──────────────────────────────────────────────────────────
    {
        id: 'Error',
        path: '/error',
        view: () => import('@/views/errors/ErrorView.vue'),
        title: 'Error',
        access: {},
    },
    {
        id: 'Unauthorized',
        path: '/unauthorized',
        view: () => import('@/views/errors/UnauthorizedView.vue'),
        title: 'Access Denied',
        access: {},
    },
    {
        id: 'NotFound',
        path: '/:pathMatch(.*)*',
        view: () => import('@/views/errors/NotFoundView.vue'),
        title: 'Page Not Found',
        access: {},
    },
]
