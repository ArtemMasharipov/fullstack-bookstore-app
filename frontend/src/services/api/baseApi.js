import axios from 'axios'
import { resolveErrorKey } from '@/utils/errorResolver'

/**
 * Base Axios instance with interceptors
 * Simplified version - no unnecessary wrappers (PHASE 3)
 */

const baseApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api/v1',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
})

let onUnauthorized = null
// While one session reset runs, further 401 answers of that session do not start another
let endingSession = null

/** Sets what ends the session after a 401 to a request that carried the token */
export function setUnauthorizedHandler(handler) {
    onUnauthorized = handler
}

// Request interceptor - add auth token
baseApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')

        // Public endpoints that don't require auth
        const publicEndpoints = ['/auth/login', '/auth/register', '/books', '/authors', '/cart/quote', '/config/public']
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

        // A 401 to a request sent with a token means the session is over. Without a
        // token it means wrong credentials, and the guest's session stays as it is.
        const sentToken = (error.config ?? error.response.config)?.headers?.Authorization
        if (status === 401 && sentToken && onUnauthorized && !endingSession) {
            endingSession = Promise.resolve(onUnauthorized()).finally(() => {
                endingSession = null
            })
        }

        // Error envelope: { success: false, error: { code, message, fields?, details? } }
        const apiError = new Error(data?.error?.message || 'An error occurred')
        apiError.status = status
        apiError.data = data
        apiError.fields = data?.error?.fields
        apiError.details = data?.error?.details
        const messageKey = resolveErrorKey(error)
        if (messageKey !== 'errors.UNKNOWN') apiError.code = messageKey.slice(7)

        return Promise.reject(apiError)
    }
)

export default baseApi
