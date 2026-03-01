import axios from 'axios'
import { ROUTE_PATHS } from '@/utils/constants/routes'

/**
 * Base Axios instance with interceptors
 * Simplified version - no unnecessary wrappers (PHASE 3)
 */

const baseApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor - add auth token
baseApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')

        // Public endpoints that don't require auth
        const publicEndpoints = ['/auth/login', '/auth/register', '/books', '/authors']
        const isPublic = publicEndpoints.some((ep) => config.url.includes(ep))

        if (token && (!isPublic || config.headers.Authorization)) {
            config.headers.Authorization = `Bearer ${token}`
        } else if (!isPublic && !token) {
            return Promise.reject(new Error('Authorization required'))
        }

        return config
    },
    (error) => Promise.reject(error)
)

// Response interceptor - handle errors
baseApi.interceptors.response.use(
    (response) => response,
    (error) => {
        // Network error
        if (!error.response) {
            const networkError = new Error('Network connection error. Please check your connection.')
            networkError.code = 'NETWORK_ERROR'
            return Promise.reject(networkError)
        }

        const { status, data } = error.response

        // Unauthorized - redirect to login
        if (status === 401) {
            const currentPath = window.location.pathname
            if (currentPath !== ROUTE_PATHS.LOGIN && currentPath !== ROUTE_PATHS.REGISTER) {
                localStorage.removeItem('token')
                window.location.href = ROUTE_PATHS.LOGIN
            }
        }

        // Create error with message
        const message = data?.message || data?.error || 'An error occurred'
        const apiError = new Error(message)
        apiError.status = status
        apiError.data = data

        return Promise.reject(apiError)
    }
)

export default baseApi
