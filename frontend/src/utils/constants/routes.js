/**
 * Routes Constants
 * Application route constants
 */

export const ROUTE_NAMES = {
    // Public routes
    HOME: 'Home',
    BOOKS: 'Books',
    BOOK_DETAILS: 'BookDetails',
    AUTHORS: 'Authors',
    AUTHOR_DETAILS: 'AuthorDetails',
    CART: 'Cart',
    CHECKOUT: 'Checkout',
    CONTACT: 'Contact',
    ABOUT: 'About',
    PRIVACY: 'Privacy',

    // Auth routes
    LOGIN: 'Login',
    REGISTER: 'Register',
    PROFILE: 'Profile',

    // Order routes
    ORDERS: 'Orders',
    ORDER_DETAILS: 'OrderDetails',
    ORDER_STATUS: 'OrderStatus',

    // Admin routes
    ADMIN_DASHBOARD: 'AdminDashboard',
    ADMIN_BOOKS: 'AdminBooks',
    ADMIN_AUTHORS: 'AdminAuthors',
    ADMIN_ORDERS: 'AdminOrders',
    ADMIN_USERS: 'AdminUsers',

    // Error routes
    NOT_FOUND: 'NotFound',
    ERROR: 'Error',
}

export const ROUTE_PATHS = {
    // Public paths
    HOME: '/',
    BOOKS: '/books',
    BOOK_DETAILS: '/books/:id',
    AUTHORS: '/authors',
    AUTHOR_DETAILS: '/authors/:id',
    CART: '/cart',
    CHECKOUT: '/checkout',
    CONTACT: '/contact',
    ABOUT: '/about',
    PRIVACY: '/privacy',

    // Auth paths
    LOGIN: '/login',
    REGISTER: '/register',
    PROFILE: '/profile',

    // Order paths
    ORDERS: '/orders',
    ORDER_DETAILS: '/orders/:id',
    ORDER_STATUS: '/orders/:id/status',

    // Admin paths
    ADMIN_DASHBOARD: '/admin',
    ADMIN_BOOKS: '/admin/books',
    ADMIN_AUTHORS: '/admin/authors',
    ADMIN_ORDERS: '/admin/orders',
    ADMIN_USERS: '/admin/users',

    // Error paths
    NOT_FOUND: '/:pathMatch(.*)*',
    ERROR: '/error',
}
