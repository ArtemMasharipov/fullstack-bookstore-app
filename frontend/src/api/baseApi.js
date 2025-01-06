import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api/v1'

const baseApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

baseApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (!token) {
        console.warn('No authorization token found')
        throw new Error('Authorization required')
    }
    
    config.headers.Authorization = `Bearer ${token}`

    if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] =
            config.data instanceof FormData
                ? 'multipart/form-data'
                : 'application/json'
    }

    return config
}, (error) => {
    return Promise.reject(error)
})

baseApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            window.location.href = '/login'
            return Promise.reject(new Error('Please login to continue'))
        }

        const errorMessage =
            error.response?.data?.message || 
            error.response?.data?.error || 
            'Server error occurred'

        console.error('[API Error]:', {
            message: errorMessage,
            status: error.response?.status,
            url: error.config?.url,
            method: error.config?.method,
        })

        return Promise.reject(new Error(errorMessage))
    }
)

export const apiRequest = async (method, url, data = null, headers = {}) => {
    try {
        const response = await baseApi({
            method,
            url,
            ...(data && method !== 'GET' && { data }),
            headers,
        })
        return response.data
    } catch (error) {
        console.error(`API ${method} ${url} error:`, error)
        throw error.response?.data || { message: error.message }
    }
}

export default baseApi
