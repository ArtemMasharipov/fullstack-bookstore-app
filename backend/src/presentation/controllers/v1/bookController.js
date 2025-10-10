import {
    createCreateController,
    createDeleteController,
    createGetAllController,
    createGetByIdController,
    createUpdateController
} from '../../../shared/helpers/controllerHelpers.js'

/**
 * Book Controllers using DI Container
 * 
 * Преимущества нового подхода:
 * - Нет дублирования кода
 * - Автоматическая обработка ошибок
 * - Валидация из коробки
 * - Легкое тестирование с моками
 * - Консистентный API ответов
 */

// Используем helper функции для создания контроллеров
export const getAllBooks = createGetAllController('getAllBooksUseCase')

export const getBookById = createGetByIdController('getBookByIdUseCase')

export const createBook = createCreateController('createBookUseCase')

export const updateBook = createUpdateController('updateBookUseCase')

export const deleteBook = createDeleteController('deleteBookUseCase')
