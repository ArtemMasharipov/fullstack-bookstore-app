/**
 * Book Validation Schema
 * Схемы валидации для книг
 */

export const bookValidationRules = {
    title: {
        required: true,
        minLength: 1,
        maxLength: 200,
        message: 'Название книги обязательно (1-200 символов)',
    },
    description: {
        required: false,
        maxLength: 2000,
        message: 'Описание не должно превышать 2000 символов',
    },
    price: {
        required: true,
        min: 0,
        max: 999999.99,
        type: 'number',
        message: 'Цена должна быть положительным числом',
    },
    authorId: {
        required: true,
        type: 'string',
        message: 'Автор обязателен',
    },
    stock: {
        required: true,
        min: 0,
        type: 'integer',
        message: 'Количество на складе должно быть целым числом >= 0',
    },
    isbn: {
        required: false,
        pattern: /^[0-9-X]+$/,
        message: 'ISBN должен содержать только цифры, дефисы и X',
    },
}

export const validateBook = (book) => {
    const errors = {}

    // Валидация названия
    if (!book.title || book.title.trim().length === 0) {
        errors.title = bookValidationRules.title.message
    } else if (book.title.length > bookValidationRules.title.maxLength) {
        errors.title = bookValidationRules.title.message
    }

    // Валидация описания
    if (book.description && book.description.length > bookValidationRules.description.maxLength) {
        errors.description = bookValidationRules.description.message
    }

    // Валидация цены
    if (!book.price || isNaN(book.price) || book.price < 0) {
        errors.price = bookValidationRules.price.message
    }

    // Валидация автора
    if (!book.authorId) {
        errors.authorId = bookValidationRules.authorId.message
    }

    // Валидация количества
    if (book.stock === undefined || book.stock === null || isNaN(book.stock) || book.stock < 0) {
        errors.stock = bookValidationRules.stock.message
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    }
}
