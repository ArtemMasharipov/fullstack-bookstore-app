/**
 * Toast Helpers
 *
 * Дополнительные хелперы для типичных сценариев использования toast-уведомлений
 * Эти функции дополняют основной toast-сервис и помогают сократить дублирование кода
 */

import { toast } from './enhancedToast'

/**
 * Хелпер для обработки операции создания с уведомлениями
 * @param {Object} options - Настройки операции
 * @param {string} options.entityName - Название сущности (например, "Пользователь")
 * @param {string|function} options.displayName - Отображаемое имя или функция для его получения
 * @param {function} options.operation - Функция, выполняющая операцию создания
 * @param {function} [options.onSuccess] - Колбэк при успешном выполнении (опционально)
 * @param {function} [options.onError] - Колбэк при ошибке (опционально)
 * @returns {Promise<any>}
 */
export async function handleCreate({ entityName, displayName, operation, onSuccess, onError }) {
    try {
        const result = await operation()

        // Получаем отображаемое имя (может быть функцией)
        const displayValue = typeof displayName === 'function' ? displayName(result) : displayName

        toast.success(toast.messages.crud.createSuccess(`${entityName} "${displayValue}"`))

        if (onSuccess) {
            onSuccess(result)
        }

        return result
    } catch (error) {
        toast.error(toast.messages.crud.createError(entityName), error)

        if (onError) {
            onError(error)
        }

        throw error
    }
}

/**
 * Хелпер для обработки операции обновления с уведомлениями
 * @param {Object} options - Настройки операции
 * @param {string} options.entityName - Название сущности (например, "Пользователь")
 * @param {string|function} options.displayName - Отображаемое имя или функция для его получения
 * @param {function} options.operation - Функция, выполняющая операцию обновления
 * @param {function} [options.onSuccess] - Колбэк при успешном выполнении (опционально)
 * @param {function} [options.onError] - Колбэк при ошибке (опционально)
 * @returns {Promise<any>}
 */
export async function handleUpdate({ entityName, displayName, operation, onSuccess, onError }) {
    try {
        const result = await operation()

        // Получаем отображаемое имя (может быть функцией)
        const displayValue = typeof displayName === 'function' ? displayName(result) : displayName

        toast.success(toast.messages.crud.updateSuccess(`${entityName} "${displayValue}"`))

        if (onSuccess) {
            onSuccess(result)
        }

        return result
    } catch (error) {
        toast.error(toast.messages.crud.updateError(entityName), error)

        if (onError) {
            onError(error)
        }

        throw error
    }
}

/**
 * Хелпер для обработки операции удаления с уведомлениями
 * @param {Object} options - Настройки операции
 * @param {string} options.entityName - Название сущности (например, "Пользователь")
 * @param {string|function} options.displayName - Отображаемое имя или функция для его получения
 * @param {function} options.operation - Функция, выполняющая операцию удаления
 * @param {function} [options.onSuccess] - Колбэк при успешном выполнении (опционально)
 * @param {function} [options.onError] - Колбэк при ошибке (опционально)
 * @returns {Promise<any>}
 */
export async function handleDelete({ entityName, displayName, operation, onSuccess, onError }) {
    try {
        const result = await operation()

        // Получаем отображаемое имя (может быть функцией)
        const displayValue = typeof displayName === 'function' ? displayName(result) : displayName

        toast.info(toast.messages.crud.deleteSuccess(`${entityName} "${displayValue}"`))

        if (onSuccess) {
            onSuccess(result)
        }

        return result
    } catch (error) {
        toast.error(toast.messages.crud.deleteError(entityName), error)

        if (onError) {
            onError(error)
        }

        throw error
    }
}

/**
 * Хелпер для обработки загрузки данных с уведомлениями только при ошибке
 * @param {Object} options - Настройки операции
 * @param {string} options.entityName - Название сущности во множественном числе (например, "Пользователи")
 * @param {function} options.operation - Функция, выполняющая операцию загрузки
 * @param {function} [options.onSuccess] - Колбэк при успешном выполнении (опционально)
 * @param {function} [options.onError] - Колбэк при ошибке (опционально)
 * @param {boolean} [options.silent=true] - Не показывать уведомление при успехе
 * @returns {Promise<any>}
 */
export async function handleLoad({
    entityName,
    operation,
    onSuccess,
    onError,
    silent = true, // По умолчанию, не показываем уведомление при успешной загрузке
}) {
    try {
        const result = await operation()

        if (!silent) {
            toast.success(`${entityName} успешно загружены`)
        }

        if (onSuccess) {
            onSuccess(result)
        }

        return result
    } catch (error) {
        toast.error(toast.messages.crud.loadError(entityName), error)

        if (onError) {
            onError(error)
        }

        throw error
    }
}

/**
 * Универсальный хелпер для CRUD операций
 * @param {string} operationType - Тип операции ('create', 'update', 'delete', 'load')
 * @param {Object} options - Настройки операции
 * @returns {Promise<any>}
 */
export async function handleOperation(operationType, options) {
    switch (operationType) {
        case 'create':
            return handleCreate(options)
        case 'update':
            return handleUpdate(options)
        case 'delete':
            return handleDelete(options)
        case 'load':
            return handleLoad(options)
        default:
            throw new Error(`Неизвестный тип операции: ${operationType}`)
    }
}

export default {
    handleCreate,
    handleUpdate,
    handleDelete,
    handleLoad,
    handleOperation,
}
