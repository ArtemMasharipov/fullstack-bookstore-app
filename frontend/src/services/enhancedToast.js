/**
 * Enhanced Toast Service
 * 
 * An improved toast notification system that provides:
 * 1. Consistent type-based configurations
 * 2. Message templates for common operations
 * 3. Helper functions for CRUD operations
 */
import { useToast } from 'vue-toast-notification'

// ==========================================
// Toast Configuration
// ==========================================

/**
 * Базовые настройки для всех типов уведомлений
 */
const BASE_CONFIG = {
  position: 'top-right',
  dismissible: true,
  pauseOnHover: true,
  queue: false
}

/**
 * Специфичные настройки по типам уведомлений
 */
const TYPE_CONFIG = {
  success: { 
    duration: 4000 
  },
  error: { 
    duration: 8000 
  },
  warning: { 
    duration: 6000 
  },
  info: { 
    duration: 3000 
  },
  default: { 
    duration: 5000 
  }
}

// ==========================================
// Message Templates
// ==========================================

/**
 * Шаблоны сообщений для типовых операций
 */
const MESSAGES = {
  crud: {
    createSuccess: entity => `${entity} успешно создан`,
    createError: entity => `Не удалось создать ${entity}`,
    updateSuccess: entity => `${entity} успешно обновлен`,
    updateError: entity => `Не удалось обновить ${entity}`,
    deleteSuccess: entity => `${entity} успешно удален`,
    deleteError: entity => `Не удалось удалить ${entity}`,
    loadError: entity => `Ошибка при загрузке ${entity}`,
  },
  auth: {
    loginSuccess: name => `Добро пожаловать, ${name}!`,
    loginError: () => `Ошибка входа`,
    logoutSuccess: name => `${name} успешно вышел из системы`,
    logoutError: () => `Ошибка выхода из системы`,
    registerSuccess: name => `Добро пожаловать, ${name}! Регистрация прошла успешно.`,
    registerError: () => `Ошибка регистрации`,
  },
  cart: {
    addSuccess: item => `"${item}" добавлен в корзину`,
    addError: item => `Ошибка добавления "${item}" в корзину`,
    removeSuccess: item => `"${item}" удален из корзины`,
    removeError: item => `Ошибка удаления "${item}" из корзины`,
    updateSuccess: (item, qty) => `Количество "${item}" изменено на ${qty}`,
    updateError: () => `Ошибка обновления количества`,
    clearSuccess: () => `Корзина очищена`,
    clearError: () => `Ошибка очистки корзины`,
  },
  order: {
    createSuccess: id => `Заказ #${id} успешно создан!`,
    updateSuccess: (id, status) => `Статус заказа #${id} изменен на "${status}"`,
    cancelSuccess: id => `Заказ #${id} отменен`,
  }
}

// ==========================================
// Base Functions
// ==========================================

/**
 * Показывает уведомление об успехе
 * @param {string} message - Сообщение для отображения
 * @param {Object} [options] - Опциональные настройки
 * @returns {Object} Экземпляр уведомления
 */
export function showSuccess(message, options = {}) {
  return useToast().success(message, { 
    ...BASE_CONFIG, 
    ...TYPE_CONFIG.success, 
    ...options 
  })
}

/**
 * Показывает уведомление об ошибке
 * @param {string} message - Сообщение для отображения
 * @param {Error|string} [error] - Объект ошибки или текст ошибки
 * @param {Object} [options] - Опциональные настройки
 * @returns {Object} Экземпляр уведомления
 */
export function showError(message, error, options = {}) {
  let errorMessage = message;
  
  if (error) {
    const errorText = error.message || error.toString();
    errorMessage = `${message}: ${errorText}`;
  }
  
  return useToast().error(errorMessage, { 
    ...BASE_CONFIG, 
    ...TYPE_CONFIG.error, 
    ...options 
  })
}

/**
 * Показывает предупреждающее уведомление
 * @param {string} message - Сообщение для отображения
 * @param {Object} [options] - Опциональные настройки
 * @returns {Object} Экземпляр уведомления
 */
export function showWarning(message, options = {}) {
  return useToast().warning(message, { 
    ...BASE_CONFIG, 
    ...TYPE_CONFIG.warning, 
    ...options 
  })
}

/**
 * Показывает информационное уведомление
 * @param {string} message - Сообщение для отображения
 * @param {Object} [options] - Опциональные настройки
 * @returns {Object} Экземпляр уведомления
 */
export function showInfo(message, options = {}) {
  return useToast().info(message, { 
    ...BASE_CONFIG, 
    ...TYPE_CONFIG.info, 
    ...options 
  })
}

/**
 * Очищает все уведомления
 */
export function clearAll() {
  useToast().clear()
}

// ==========================================
// Helper Functions for CRUD Operations
// ==========================================

/**
 * Обертка для асинхронной операции с обработкой уведомлений
 * @param {function} operation - Асинхронная операция
 * @param {Object} messages - Объект с сообщениями для успеха и ошибки
 * @param {Object} [options] - Опциональные настройки для уведомлений
 * @returns {Promise<any>} Результат операции
 */
export async function withToast(operation, messages, options = {}) {
  try {
    const result = await operation()
    if (messages.success) {
      showSuccess(messages.success, options.success || {})
    }
    return result
  } catch (error) {
    if (messages.error) {
      showError(messages.error, error, options.error || {})
    }
    throw error
  }
}

/**
 * Обертка для операции создания сущности с уведомлениями
 * @param {string} entityName - Название сущности 
 * @param {string} displayName - Отображаемое имя сущности для сообщения
 * @param {function} createFn - Функция создания
 * @param {Object} [options] - Опциональные настройки для уведомлений
 * @returns {Promise<any>} Результат операции
 */
export function createWithToast(entityName, displayName, createFn, options = {}) {
  const messages = {
    success: displayName 
      ? `${entityName} "${displayName}" создан успешно` 
      : MESSAGES.crud.createSuccess(entityName),
    error: MESSAGES.crud.createError(entityName)
  }
  
  return withToast(createFn, messages, options)
}

/**
 * Обертка для операции обновления сущности с уведомлениями
 * @param {string} entityName - Название сущности 
 * @param {string} displayName - Отображаемое имя сущности для сообщения
 * @param {function} updateFn - Функция обновления
 * @param {Object} [options] - Опциональные настройки для уведомлений
 * @returns {Promise<any>} Результат операции
 */
export function updateWithToast(entityName, displayName, updateFn, options = {}) {
  const messages = {
    success: displayName 
      ? `${entityName} "${displayName}" обновлен успешно` 
      : MESSAGES.crud.updateSuccess(entityName),
    error: MESSAGES.crud.updateError(entityName)
  }
  
  return withToast(updateFn, messages, options)
}

/**
 * Обертка для операции удаления сущности с уведомлениями
 * @param {string} entityName - Название сущности 
 * @param {string} displayName - Отображаемое имя сущности для сообщения
 * @param {function} deleteFn - Функция удаления
 * @param {Object} [options] - Опциональные настройки для уведомлений
 * @returns {Promise<any>} Результат операции
 */
export function deleteWithToast(entityName, displayName, deleteFn, options = {}) {
  const messages = {
    success: displayName 
      ? `${entityName} "${displayName}" удален успешно` 
      : MESSAGES.crud.deleteSuccess(entityName),
    error: MESSAGES.crud.deleteError(entityName)
  }
  
  return withToast(deleteFn, messages, options)
}

// Экспортируем основные функции и константы
export const toast = {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  clear: clearAll,
  
  // CRUD helpers
  withToast,
  createWithToast,
  updateWithToast,
  deleteWithToast,
  
  // Message templates
  messages: MESSAGES,
  
  // Config
  baseConfig: BASE_CONFIG,
  typeConfig: TYPE_CONFIG
}

// Экспорт по умолчанию
export default toast
