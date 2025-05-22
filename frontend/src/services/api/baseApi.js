import axios from 'axios'

const API_CONFIG = {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
    timeout: 15000, // Increased timeout for better reliability
    validateStatus: (status) => status < 500,
}

const baseApi = axios.create(API_CONFIG)

const handleError = (error) => {
    // Improved network error detection
    if (error.message === 'Network Error' || !error.response || error.code === 'ECONNABORTED') {
        console.error('Network connection error:', error)
        let errorMessage = 'Network connection error. Please check your connection and try again.'

        if (error.code === 'ECONNABORTED') {
            errorMessage = 'Request timed out. Please try again later.'
        }

        throw new Error(errorMessage)
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
        const isPublic = ['/auth/login', '/auth/register'].some((ep) => config.url.endsWith(ep))

        if (!isPublic) {
            if (!token) {
                throw new Error('Authorization required')
            }
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
        console.log(`API ${method.toUpperCase()} request to ${url}`);
        if (data) {
            console.log('Request data:', data);
        }
        
        const response = await baseApi({
            method,
            url,
            ...(data && { data }),
            ...config,
        });
        
        console.log(`API response from ${url}:`, response.data);
        
        // Deep check for inStock values in the data (if it's books endpoint)
        if (url.includes('/books')) {
            const books = Array.isArray(response.data) ? response.data :
                         response.data?.books || response.data?.data || [];
            
            if (books.length > 0) {
                console.log('Sample book from API:', books[0]);
                console.log('inStock value:', books[0].inStock, 'type:', typeof books[0].inStock);
                console.log('price value:', books[0].price, 'type:', typeof books[0].price);
            }
        }

        return response.data;
    } catch (error) {
        console.error(`API error in ${method.toUpperCase()} ${url}:`, error);
        throw error;
    }
}

export default baseApi
