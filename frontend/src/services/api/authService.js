import baseApi from './baseApi'

/**
 * Authentication API - direct axios implementation
 * No factory abstractions (ЭТАП 3)
 */
export const authApi = {
    login: (credentials) => baseApi.post('/auth/login', credentials).then((res) => res.data),
    
    register: (userData) => baseApi.post('/auth/register', userData).then((res) => res.data),
    
    refreshToken: () => baseApi.post('/auth/refresh-token').then((res) => res.data),
    
    logout: () => baseApi.post('/auth/logout').then((res) => res.data),
    
    verifyToken: (token) => baseApi.post('/auth/verify-token', { token }).then((res) => res.data),
    
    forgotPassword: (email) => baseApi.post('/auth/forgot-password', { email }).then((res) => res.data),
    
    resetPassword: (data) => baseApi.post('/auth/reset-password', data).then((res) => res.data),
    
    updateProfile: (userData) => baseApi.put('/users/profile', userData).then((res) => res.data),
    
    changePassword: (passwordData) => baseApi.put('/users/change-password', passwordData).then((res) => res.data),
}
