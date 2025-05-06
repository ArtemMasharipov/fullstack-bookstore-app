import { createApiClient } from './apiFactory'
import { apiRequest } from './baseApi'

/**
 * Authentication API service
 * Exports the authApi object for authentication-related operations
 */
export const authApi = createApiClient('auth', {
    login: (credentials) => apiRequest('post', '/auth/login', credentials),
    register: (userData) => apiRequest('post', '/auth/register', userData),
    refreshToken: () => apiRequest('post', '/auth/refresh-token'),
    logout: () => apiRequest('post', '/auth/logout'),
    verifyToken: (token) => apiRequest('post', '/auth/verify-token', { token }),
    forgotPassword: (email) => apiRequest('post', '/auth/forgot-password', { email }),
    resetPassword: (data) => apiRequest('post', '/auth/reset-password', data),
    updateProfile: (userData) => apiRequest('put', '/users/profile', userData),
    changePassword: (passwordData) => apiRequest('put', '/users/change-password', passwordData),
})
