import { logger } from '@/utils/logger'
import axios from 'axios'

const API_CONFIG = {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
    timeout: 15000, // Increased timeout for better reliability
    validateStatus: (status) => status < 500,
}

const baseApi = axios.create(API_CONFIG)

const handleError = (error) => {
    // Handle network errors
    if (error.message === 'Network Error' || !error.response || error.code === 'ECONNABORTED') {
        console.error('Network connection error:', error)
        let errorMessage = 'Network connection error. Please check your connection and try again.'

        if (error.code === 'ECONNABORTED') {
            errorMessage = 'Request timed out. Please try again later.'
        }

        const networkError = new Error(errorMessage)
        networkError.isNetworkError = true
        throw networkError
    }

    // Handle authorization errors
    if (error.message === 'Authorization required') {
        const authError = new Error('Please log in to access this feature')
        authError.status = 401
        authError.isAuthError = true
        throw authError
    }

    const { status, data, config } = error.response
    const message = data?.message || data?.error || 'Unexpected error occurred'

    // Special handling for 404 errors on specific endpoints
    if (status === 404) {
        // If it's the orders endpoint, provide a more informative error
        if (config?.url?.includes('/orders')) {
            console.warn('Orders API endpoint returned 404. Backend might not be ready yet.')
            const customError = new Error('Orders service is currently unavailable.')
            customError.status = status
            customError.isExpected = true // Mark as an expected error
            throw customError
        }
    }

    if (status === 401) {
        // Clear token and redirect, but prevent multiple redirects
        const currentPath = window.location.pathname
        if (currentPath !== '/login' && currentPath !== '/register') {
            localStorage.removeItem('token')
            localStorage.removeItem('userData')
            window.location.href = '/login'
        }
    }

    // Ensure we always return a string message
    const errorObject = new Error(message)
    errorObject.status = status
    errorObject.data = data
    throw errorObject
}

baseApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        const isPublic = ['/auth/login', '/auth/register', '/books', '/authors'].some(
            (ep) => config.url.endsWith(ep) || config.url.includes(ep)
        )

        if (!isPublic && token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json'
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

baseApi.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        return handleError(error)
    }
)

export const apiRequest = async (method, url, data = null, config = {}) => {
    try {
        logger.debug(`API ${method.toUpperCase()} request to ${url}`, { data }, 'api')

        const response = await baseApi({
            method,
            url,
            ...(data && { data }),
            ...config,
        })

        logger.debug(`API response from ${url}`, { response: response.data }, 'api')

        return response.data
    } catch (error) {
        logger.error(`API error in ${method.toUpperCase()} ${url}`, error, 'api')
        throw error
    }
}

export default baseApi
