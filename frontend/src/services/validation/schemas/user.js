/**
 * User Validation Schema
 * Схемы валидации для пользователей
 */

export const userValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Введите корректный email адрес'
  },
  password: {
    required: true,
    minLength: 6,
    message: 'Пароль должен содержать минимум 6 символов'
  },
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    message: 'Имя обязательно (2-50 символов)'
  },
  lastName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    message: 'Фамилия обязательна (2-50 символов)'
  }
}

export const validateUser = (user) => {
  const errors = {}

  // Валидация email
  if (!user.email || !userValidationRules.email.pattern.test(user.email)) {
    errors.email = userValidationRules.email.message
  }

  // Валидация пароля
  if (!user.password || user.password.length < userValidationRules.password.minLength) {
    errors.password = userValidationRules.password.message
  }

  // Валидация имени
  if (!user.firstName || user.firstName.trim().length < 2 || user.firstName.length > 50) {
    errors.firstName = userValidationRules.firstName.message
  }

  // Валидация фамилии
  if (!user.lastName || user.lastName.trim().length < 2 || user.lastName.length > 50) {
    errors.lastName = userValidationRules.lastName.message
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const validateLogin = (credentials) => {
  const errors = {}

  if (!credentials.email || !userValidationRules.email.pattern.test(credentials.email)) {
    errors.email = userValidationRules.email.message
  }

  if (!credentials.password) {
    errors.password = 'Пароль обязателен'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
