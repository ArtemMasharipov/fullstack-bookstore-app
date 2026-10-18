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
 *   capability  {string}  — the user's role must have it: can(role, capability) in src/auth/capabilities.js
 *
 * redirectTo {string} — instead of a view: the id of the route this path now
 *   opens, with the same params, query and language
 *
 * layout {string} — a group's layout, which App.vue renders around its pages: 'admin' for the admin
 *   area; any other page is shown in the storefront layout
 *
 * Nav shape (admin children only):
 *   section  {string} — sidebar section key, e.g. 'main' | 'system'
 *   order    {number} — sort order within the section
 *   icon     {string} — Material Design Icon name
 *   subtitleKey {string} - optional translation key for the sidebar second line
 */

export const routeManifest = [
    // ── Public ──────────────────────────────────────────────────────────
    {
        id: 'Home',
        path: '/',
        view: () => import('@/views/public/HomeView.vue'),
        titleKey: 'routes.Home',
        access: {},
    },
    {
        id: 'Books',
        path: '/books',
        view: () => import('@/views/public/BooksView.vue'),
        titleKey: 'routes.Books',
        access: {},
    },
    {
        id: 'BookDetails',
        path: '/books/:id',
        view: () => import('@/views/public/BookDetailsView.vue'),
        titleKey: 'routes.BookDetails',
        access: {},
    },
    {
        id: 'Authors',
        path: '/authors',
        view: () => import('@/views/public/AuthorsView.vue'),
        titleKey: 'routes.Authors',
        access: {},
    },
    {
        id: 'AuthorDetails',
        path: '/authors/:id',
        view: () => import('@/views/public/AuthorDetailsView.vue'),
        titleKey: 'routes.AuthorDetails',
        access: {},
    },
    {
        id: 'Cart',
        path: '/cart',
        view: () => import('@/views/public/CartView.vue'),
        titleKey: 'routes.Cart',
        access: {},
    },
    {
        id: 'Checkout',
        path: '/checkout',
        view: () => import('@/views/public/CheckoutView.vue'),
        titleKey: 'routes.Checkout',
        access: { auth: true },
    },

    // ── Auth ────────────────────────────────────────────────────────────
    {
        id: 'Login',
        path: '/login',
        view: () => import('@/views/auth/LoginView.vue'),
        titleKey: 'routes.Login',
        access: { guestOnly: true },
    },
    {
        id: 'Register',
        path: '/register',
        view: () => import('@/views/auth/RegisterView.vue'),
        titleKey: 'routes.Register',
        access: { guestOnly: true },
    },
    {
        id: 'Profile',
        path: '/profile',
        view: () => import('@/views/auth/ProfileView.vue'),
        titleKey: 'routes.Profile',
        access: { auth: true },
    },

    // ── Orders ──────────────────────────────────────────────────────────
    {
        id: 'Orders',
        path: '/orders',
        view: () => import('@/views/orders/OrdersView.vue'),
        titleKey: 'routes.Orders',
        access: { auth: true },
    },
    {
        id: 'OrderDetails',
        path: '/orders/:id',
        view: () => import('@/views/orders/OrderDetailsView.vue'),
        titleKey: 'routes.OrderDetails',
        access: { auth: true },
    },
    {
        // Changing a status is an admin task; old links open the order
        id: 'OrderStatus',
        path: '/orders/:id/status',
        redirectTo: 'OrderDetails',
    },

    // ── Admin (layout group) ────────────────────────────────────────────
    // The group has no view: App.vue shows its pages in the admin layout. Its
    // `access` is merged into every child record by buildRoutes() so the
    // unified guard sees it.
    {
        id: 'Admin',
        path: '/admin',
        layout: 'admin',
        access: { auth: true, capability: 'admin' },
        children: [
            {
                id: 'AdminDashboard',
                path: '',
                view: () => import('@/views/admin/AdminDashboardView.vue'),
                titleKey: 'routes.AdminDashboard',
                nav: { section: 'main', order: 10, icon: 'mdi-view-dashboard', subtitleKey: 'admin.nav.dashboard' },
            },
            {
                id: 'AdminBooks',
                path: 'books',
                view: () => import('@/views/admin/AdminBooksView.vue'),
                titleKey: 'routes.AdminBooks',
                nav: { section: 'main', order: 20, icon: 'mdi-book-multiple', subtitleKey: 'admin.nav.books' },
            },
            {
                id: 'AdminAuthors',
                path: 'authors',
                view: () => import('@/views/admin/AdminAuthorsView.vue'),
                titleKey: 'routes.AdminAuthors',
                nav: { section: 'main', order: 30, icon: 'mdi-account-edit', subtitleKey: 'admin.nav.authors' },
            },
            {
                id: 'AdminOrders',
                path: 'orders',
                view: () => import('@/views/admin/AdminOrdersView.vue'),
                titleKey: 'routes.AdminOrders',
                nav: { section: 'main', order: 40, icon: 'mdi-cart', subtitleKey: 'admin.nav.orders' },
            },
            {
                id: 'AdminUsers',
                path: 'users',
                view: () => import('@/views/admin/AdminUsersView.vue'),
                titleKey: 'routes.AdminUsers',
                nav: { section: 'main', order: 50, icon: 'mdi-account-group', subtitleKey: 'admin.nav.users' },
            },
        ],
    },

    // ── Errors ──────────────────────────────────────────────────────────
    {
        id: 'Error',
        path: '/error',
        view: () => import('@/views/errors/ErrorView.vue'),
        titleKey: 'routes.Error',
        access: {},
    },
    {
        id: 'Unauthorized',
        path: '/unauthorized',
        view: () => import('@/views/errors/UnauthorizedView.vue'),
        titleKey: 'routes.Unauthorized',
        access: {},
    },
    {
        id: 'NotFound',
        path: '/:pathMatch(.*)*',
        view: () => import('@/views/errors/NotFoundView.vue'),
        titleKey: 'routes.NotFound',
        access: {},
    },
]
