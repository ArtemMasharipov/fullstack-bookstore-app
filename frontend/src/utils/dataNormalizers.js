/**
 * Data Normalizers
 * Centralized data normalization to remove duplication
 *
 * Principles:
 * - DRY: single normalization logic
 * - Type Safety: guaranteed data types
 * - Consistency: consistent behavior across the app
 * - Performance: optimized functions
 */

/**
 * Price normalization
 * @param {*} price - price in any format
 * @returns {number} - normalized price
 */
export const normalizePrice = (price) => {
    if (typeof price === 'number') {
        return price
    }

    if (typeof price === 'string') {
        // Remove all characters except digits and dot
        const cleanPrice = price.replace(/[^0-9.]/g, '')
        const parsed = parseFloat(cleanPrice)
        return isNaN(parsed) ? 0 : parsed
    }

    return 0
}

/**
 * Boolean normalization
 * @param {*} value - value in any format
 * @returns {boolean} - normalized boolean value
 */
export const normalizeBoolean = (value) => {
    if (typeof value === 'boolean') {
        return value
    }

    if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes'
    }

    if (typeof value === 'number') {
        return value === 1
    }

    return Boolean(value)
}

/**
 * Quantity normalization
 * @param {*} quantity - quantity in any format
 * @returns {number} - normalized quantity
 */
export const normalizeQuantity = (quantity) => {
    const num = normalizePrice(quantity)
    return Math.max(0, Math.floor(num))
}

/**
 * ID normalization
 * @param {*} id - ID in any format
 * @returns {string|null} - normalized ID
 */
export const normalizeId = (id) => {
    if (!id) return null

    if (typeof id === 'string') {
        return id.trim()
    }

    if (typeof id === 'object' && id.toString) {
        return id.toString()
    }

    return String(id)
}

/**
 * String normalization
 * @param {*} str - string in any format
 * @param {string} defaultValue - default value
 * @returns {string} - normalized string
 */
export const normalizeString = (str, defaultValue = '') => {
    if (typeof str === 'string') {
        return str.trim()
    }

    if (str === null || str === undefined) {
        return defaultValue
    }

    return String(str).trim()
}

/**
 * Date normalization
 * @param {*} date - date in any format
 * @returns {Date|null} - normalized date
 */
export const normalizeDate = (date) => {
    if (!date) return null

    if (date instanceof Date) {
        return date
    }

    const parsed = new Date(date)
    return isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Book object normalization
 * @param {Object} book - book object
 * @returns {Object} - normalized book
 */
export const normalizeBook = (book) => {
    if (!book || typeof book !== 'object') {
        return null
    }

    // Normalize author: build name from firstName + lastName when needed
    let author = book.author
    if (author && typeof author === 'object') {
        author = {
            id: normalizeId(author._id || author.id),
            name: normalizeString(author.name) || [author.firstName, author.lastName].filter(Boolean).join(' ') || '',
            bio: author.bio !== undefined ? normalizeString(author.bio) : undefined,
        }
    }

    return {
        id: normalizeId(book._id || book.id), // Normalize to a unified 'id'
        title: normalizeString(book.title),
        author,
        publicationYear: normalizeQuantity(book.publicationYear),
        category: normalizeString(book.category),
        description: normalizeString(book.description),
        price: normalizePrice(book.price),
        image: normalizeString(book.image),
        inStock: normalizeBoolean(book.inStock),
        createdAt: normalizeDate(book.createdAt),
        updatedAt: normalizeDate(book.updatedAt),
    }
}

/**
 * Books array normalization
 * @param {Array} books - array of books
 * @returns {Array} - array of normalized books
 */
export const normalizeBooks = (books) => {
    if (!Array.isArray(books)) {
        return []
    }

    return books.map(normalizeBook).filter((book) => book !== null)
}

/**
 * Author object normalization
 * @param {Object} author - author object
 * @returns {Object} - normalized author
 */
export const normalizeAuthor = (author) => {
    if (!author || typeof author !== 'object') {
        return null
    }

    return {
        id: normalizeId(author._id || author.id), // Normalize to a unified 'id'
        name: normalizeString(author.name),
        biography: normalizeString(author.biography),
        birthYear: normalizeQuantity(author.birthYear),
        deathYear: author.deathYear ? normalizeQuantity(author.deathYear) : null,
        nationality: normalizeString(author.nationality),
        createdAt: normalizeDate(author.createdAt),
        updatedAt: normalizeDate(author.updatedAt),
    }
}

/**
 * User object normalization
 * @param {Object} user - user object
 * @returns {Object} - normalized user
 */
export const normalizeUser = (user) => {
    if (!user || typeof user !== 'object') {
        return null
    }

    return {
        id: normalizeId(user._id || user.id), // Normalize to a unified 'id'
        username: normalizeString(user.username),
        email: normalizeString(user.email),
        role: user.role, // Can be an object or a string
        createdAt: normalizeDate(user.createdAt),
        updatedAt: normalizeDate(user.updatedAt),
    }
}

/**
 * Cart item object normalization
 * @param {Object} item - cart item object
 * @returns {Object} - normalized cart item
 */
export const normalizeCartItem = (item) => {
    if (!item || typeof item !== 'object') {
        return null
    }

    return {
        id: normalizeId(item._id || item.id), // Normalize to a unified 'id'
        book: item.book ? normalizeBook(item.book) : null,
        bookId: normalizeId(item.bookId),
        quantity: normalizeQuantity(item.quantity),
        price: normalizePrice(item.price),
        total: normalizePrice(item.total),
    }
}

/**
 * Cart object normalization
 * @param {Object} cart - cart object
 * @returns {Object} - normalized cart
 */
export const normalizeCart = (cart) => {
    if (!cart || typeof cart !== 'object') {
        return {
            items: [],
            total: 0,
            itemCount: 0,
        }
    }

    const items = Array.isArray(cart.items) ? cart.items.map(normalizeCartItem).filter((item) => item !== null) : []

    return {
        id: normalizeId(cart._id || cart.id), // Normalize to a unified 'id'
        userId: normalizeId(cart.userId),
        items,
        total: normalizePrice(cart.total),
        itemCount: items.length,
        createdAt: normalizeDate(cart.createdAt),
        updatedAt: normalizeDate(cart.updatedAt),
    }
}

/**
 * Order object normalization
 * @param {Object} order - order object
 * @returns {Object} - normalized order
 */
export const normalizeOrder = (order) => {
    if (!order || typeof order !== 'object') {
        return null
    }

    return {
        id: normalizeId(order._id || order.id), // Normalize to a unified 'id'
        userId: normalizeId(order.userId),
        items: Array.isArray(order.items) ? order.items.map(normalizeCartItem).filter((item) => item !== null) : [],
        total: normalizePrice(order.total),
        status: normalizeString(order.status, 'pending'),
        shippingAddress: order.shippingAddress || {},
        createdAt: normalizeDate(order.createdAt),
        updatedAt: normalizeDate(order.updatedAt),
    }
}

/**
 * Pagination normalization
 * @param {Object} pagination - pagination object
 * @returns {Object} - normalized pagination
 */
export const normalizePagination = (pagination) => {
    if (!pagination || typeof pagination !== 'object') {
        return {
            page: 1,
            limit: 10,
            total: 0,
            pages: 0,
        }
    }

    return {
        page: Math.max(1, normalizeQuantity(pagination.page)),
        limit: Math.max(1, normalizeQuantity(pagination.limit)),
        total: Math.max(0, normalizeQuantity(pagination.total)),
        pages: Math.max(0, normalizeQuantity(pagination.pages)),
    }
}

/**
 * API response normalization
 * @param {*} response - response from API
 * @returns {Object} - normalized response
 */
export const normalizeApiResponse = (response) => {
    if (!response) {
        return {
            success: false,
            data: null,
            error: 'No response received',
        }
    }

    if (typeof response === 'object') {
        return {
            success: normalizeBoolean(response.success),
            data: response.data || null,
            error: normalizeString(response.error),
            status: normalizeQuantity(response.status),
            pagination: response.pagination ? normalizePagination(response.pagination) : null,
        }
    }

    return {
        success: true,
        data: response,
        error: null,
    }
}

/**
 * Utilities for working with normalized data
 */
export const dataUtils = {
    /**
     * Book validity check
     */
    isValidBook: (book) => {
        return book && book.id && book.title && book.price >= 0 && typeof book.inStock === 'boolean'
    },

    /**
     * Cart validity check
     */
    isValidCart: (cart) => {
        return cart && Array.isArray(cart.items) && cart.total >= 0
    },

    /**
     * Get total cart cost
     */
    calculateCartTotal: (items) => {
        if (!Array.isArray(items)) return 0

        return items.reduce((total, item) => {
            return total + normalizePrice(item.price) * normalizeQuantity(item.quantity)
        }, 0)
    },

    /**
     * Get item count in cart
     */
    getCartItemCount: (items) => {
        if (!Array.isArray(items)) return 0

        return items.reduce((count, item) => {
            return count + normalizeQuantity(item.quantity)
        }, 0)
    },
}
