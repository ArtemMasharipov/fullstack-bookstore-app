/**
 * Data Normalizers
 * Централизованная нормализация данных для устранения дублирования
 *
 * Принципы:
 * - DRY: единая логика нормализации
 * - Type Safety: гарантированные типы данных
 * - Consistency: одинаковое поведение во всем приложении
 * - Performance: оптимизированные функции
 */

/**
 * Нормализация цены
 * @param {*} price - цена в любом формате
 * @returns {number} - нормализованная цена
 */
export const normalizePrice = (price) => {
    if (typeof price === 'number') {
        return price
    }

    if (typeof price === 'string') {
        // Удаляем все символы кроме цифр и точки
        const cleanPrice = price.replace(/[^0-9.]/g, '')
        const parsed = parseFloat(cleanPrice)
        return isNaN(parsed) ? 0 : parsed
    }

    return 0
}

/**
 * Нормализация булевого значения
 * @param {*} value - значение в любом формате
 * @returns {boolean} - нормализованное булево значение
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
 * Нормализация количества
 * @param {*} quantity - количество в любом формате
 * @returns {number} - нормализованное количество
 */
export const normalizeQuantity = (quantity) => {
    const num = normalizePrice(quantity)
    return Math.max(0, Math.floor(num))
}

/**
 * Нормализация ID
 * @param {*} id - ID в любом формате
 * @returns {string|null} - нормализованный ID
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
 * Нормализация строки
 * @param {*} str - строка в любом формате
 * @param {string} defaultValue - значение по умолчанию
 * @returns {string} - нормализованная строка
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
 * Нормализация даты
 * @param {*} date - дата в любом формате
 * @returns {Date|null} - нормализованная дата
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
 * Нормализация объекта книги
 * @param {Object} book - объект книги
 * @returns {Object} - нормализованная книга
 */
export const normalizeBook = (book) => {
    if (!book || typeof book !== 'object') {
        return null
    }

    // Нормализуем автора: конструируем name из firstName + lastName если нужно
    let author = book.author
    if (author && typeof author === 'object') {
        author = {
            id: normalizeId(author._id || author.id),
            name:
                normalizeString(author.name) ||
                [author.firstName, author.lastName].filter(Boolean).join(' ') ||
                '',
            bio: author.bio !== undefined ? normalizeString(author.bio) : undefined,
        }
    }

    return {
        id: normalizeId(book._id || book.id), // Нормализуем к единому 'id'
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
 * Нормализация массива книг
 * @param {Array} books - массив книг
 * @returns {Array} - массив нормализованных книг
 */
export const normalizeBooks = (books) => {
    if (!Array.isArray(books)) {
        return []
    }

    return books.map(normalizeBook).filter((book) => book !== null)
}

/**
 * Нормализация объекта автора
 * @param {Object} author - объект автора
 * @returns {Object} - нормализованный автор
 */
export const normalizeAuthor = (author) => {
    if (!author || typeof author !== 'object') {
        return null
    }

    return {
        id: normalizeId(author._id || author.id), // Нормализуем к единому 'id'
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
 * Нормализация объекта пользователя
 * @param {Object} user - объект пользователя
 * @returns {Object} - нормализованный пользователь
 */
export const normalizeUser = (user) => {
    if (!user || typeof user !== 'object') {
        return null
    }

    return {
        id: normalizeId(user._id || user.id), // Нормализуем к единому 'id'
        username: normalizeString(user.username),
        email: normalizeString(user.email),
        role: user.role, // Может быть объектом или строкой
        createdAt: normalizeDate(user.createdAt),
        updatedAt: normalizeDate(user.updatedAt),
    }
}

/**
 * Нормализация объекта товара корзины
 * @param {Object} item - объект товара корзины
 * @returns {Object} - нормализованный товар корзины
 */
export const normalizeCartItem = (item) => {
    if (!item || typeof item !== 'object') {
        return null
    }

    return {
        id: normalizeId(item._id || item.id), // Нормализуем к единому 'id'
        book: item.book ? normalizeBook(item.book) : null,
        bookId: normalizeId(item.bookId),
        quantity: normalizeQuantity(item.quantity),
        price: normalizePrice(item.price),
        total: normalizePrice(item.total),
    }
}

/**
 * Нормализация объекта корзины
 * @param {Object} cart - объект корзины
 * @returns {Object} - нормализованная корзина
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
        id: normalizeId(cart._id || cart.id), // Нормализуем к единому 'id'
        userId: normalizeId(cart.userId),
        items,
        total: normalizePrice(cart.total),
        itemCount: items.length,
        createdAt: normalizeDate(cart.createdAt),
        updatedAt: normalizeDate(cart.updatedAt),
    }
}

/**
 * Нормализация объекта заказа
 * @param {Object} order - объект заказа
 * @returns {Object} - нормализованный заказ
 */
export const normalizeOrder = (order) => {
    if (!order || typeof order !== 'object') {
        return null
    }

    return {
        id: normalizeId(order._id || order.id), // Нормализуем к единому 'id'
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
 * Нормализация пагинации
 * @param {Object} pagination - объект пагинации
 * @returns {Object} - нормализованная пагинация
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
 * Нормализация API ответа
 * @param {*} response - ответ от API
 * @returns {Object} - нормализованный ответ
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
 * Утилиты для работы с нормализованными данными
 */
export const dataUtils = {
    /**
     * Проверка валидности книги
     */
    isValidBook: (book) => {
        return book && book.id && book.title && book.price >= 0 && typeof book.inStock === 'boolean'
    },

    /**
     * Проверка валидности корзины
     */
    isValidCart: (cart) => {
        return cart && Array.isArray(cart.items) && cart.total >= 0
    },

    /**
     * Получение общей стоимости корзины
     */
    calculateCartTotal: (items) => {
        if (!Array.isArray(items)) return 0

        return items.reduce((total, item) => {
            return total + normalizePrice(item.price) * normalizeQuantity(item.quantity)
        }, 0)
    },

    /**
     * Получение количества товаров в корзине
     */
    getCartItemCount: (items) => {
        if (!Array.isArray(items)) return 0

        return items.reduce((count, item) => {
            return count + normalizeQuantity(item.quantity)
        }, 0)
    },
}
