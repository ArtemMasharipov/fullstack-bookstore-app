/**
 * Order Validation Schema
 * Схемы валидации для заказов
 */

export const orderValidationRules = {
  items: {
    required: true,
    minLength: 1,
    message: 'Заказ должен содержать хотя бы один товар'
  },
  shippingAddress: {
    required: true,
    message: 'Адрес доставки обязателен'
  },
  paymentMethod: {
    required: true,
    allowedValues: ['card', 'cash', 'online'],
    message: 'Выберите способ оплаты'
  }
}

export const validateOrder = (order) => {
  const errors = {}

  // Валидация товаров
  if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
    errors.items = orderValidationRules.items.message
  }

  // Валидация адреса доставки
  if (!order.shippingAddress || order.shippingAddress.trim().length === 0) {
    errors.shippingAddress = orderValidationRules.shippingAddress.message
  }

  // Валидация способа оплаты
  if (!order.paymentMethod || !orderValidationRules.paymentMethod.allowedValues.includes(order.paymentMethod)) {
    errors.paymentMethod = orderValidationRules.paymentMethod.message
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
