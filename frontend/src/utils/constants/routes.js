/**
 * Route constants — derived from the route manifest.
 *
 * ROUTE_NAMES  Use with { name: ROUTE_NAMES.X } in router.push / <router-link>.
 * ROUTE_PATHS  Use for string comparisons (e.g. in axios interceptors).
 *
 * Rules:
 *  - Every name/path here must match an `id`/`path` in router/manifest.js.
 *  - Never add entries for routes that do not exist in the manifest.
 *  - Never use raw string literals for navigation — always use these constants.
 */

export const ROUTE_NAMES = {
    // Public
    HOME: 'Home',
    BOOKS: 'Books',
    BOOK_DETAILS: 'BookDetails',
    AUTHORS: 'Authors',
    AUTHOR_DETAILS: 'AuthorDetails',
    CART: 'Cart',
    CHECKOUT: 'Checkout',

    // Auth
    LOGIN: 'Login',
    REGISTER: 'Register',
    PROFILE: 'Profile',

    // Orders
    ORDERS: 'Orders',
    ORDER_DETAILS: 'OrderDetails',
    ORDER_STATUS: 'OrderStatus',

    // Admin
    ADMIN_DASHBOARD: 'AdminDashboard',
    ADMIN_BOOKS: 'AdminBooks',
    ADMIN_AUTHORS: 'AdminAuthors',
    ADMIN_ORDERS: 'AdminOrders',
    ADMIN_USERS: 'AdminUsers',
    ADMIN_SETTINGS: 'AdminSettings',

    // Errors
    ERROR: 'Error',
    UNAUTHORIZED: 'Unauthorized',
    NOT_FOUND: 'NotFound',
}

export const ROUTE_PATHS = {
    // Public
    HOME: '/',
    BOOKS: '/books',
    BOOK_DETAILS: '/books/:id',
    AUTHORS: '/authors',
    AUTHOR_DETAILS: '/authors/:id',
    CART: '/cart',
    CHECKOUT: '/checkout',

    // Auth
    LOGIN: '/login',
    REGISTER: '/register',
    PROFILE: '/profile',

    // Orders
    ORDERS: '/orders',
    ORDER_DETAILS: '/orders/:id',
    ORDER_STATUS: '/orders/:id/status',

    // Admin
    ADMIN_DASHBOARD: '/admin',
    ADMIN_BOOKS: '/admin/books',
    ADMIN_AUTHORS: '/admin/authors',
    ADMIN_ORDERS: '/admin/orders',
    ADMIN_USERS: '/admin/users',
    ADMIN_SETTINGS: '/admin/settings',

    // Errors
    ERROR: '/error',
    UNAUTHORIZED: '/unauthorized',
}
