/**
 * Application Constants
 * Shared application constants
 */

export const APP_NAME = 'Bookstore App'
export const APP_VERSION = '2.0.0'

export const USER_ROLES = {
    ADMIN: 'admin',
    USER: 'user',
    GUEST: 'guest',
}

export const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
}

export const PAYMENT_METHODS = {
    CARD: 'card',
    CASH: 'cash',
    ONLINE: 'online',
}

export const BOOK_CATEGORIES = [
    'Fiction',
    'Non-Fiction',
    'Science Fiction',
    'Fantasy',
    'Mystery',
    'Romance',
    'Thriller',
    'Horror',
    'Biography',
    'History',
    'Philosophy',
    'Science',
    'Technology',
    'Art',
    'Children',
]

export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 12,
    MAX_PAGE_SIZE: 100,
}

export const FILE_UPLOAD = {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
}
