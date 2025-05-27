/**
 * API Constants
 * Константы для работы с API
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_PROFILE: '/auth/profile',

  // Books endpoints
  BOOKS: '/books',
  BOOKS_BY_ID: (id) => `/books/${id}`,
  BOOKS_SEARCH: '/books/search',

  // Authors endpoints
  AUTHORS: '/authors',
  AUTHORS_BY_ID: (id) => `/authors/${id}`,

  // Cart endpoints
  CART: '/cart',
  CART_ADD: '/cart/add',
  CART_REMOVE: '/cart/remove',
  CART_CLEAR: '/cart/clear',

  // Orders endpoints
  ORDERS: '/orders',
  ORDERS_BY_ID: (id) => `/orders/${id}`,

  // Users endpoints (admin)
  USERS: '/users',
  USERS_BY_ID: (id) => `/users/${id}`
}

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
}
