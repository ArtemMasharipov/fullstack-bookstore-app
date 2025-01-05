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
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] =
            config.data instanceof FormData
                ? 'multipart/form-data'
                : typeof config.data === 'object'
                ? 'application/json'
                : 'text/plain'
    }

    return config
})

baseApi.interceptors.response.use(
    (response) => response,
    (error) => {
        const errorMessage =
            error.response?.data?.message || error.response?.data?.error || error.request
                ? 'No response from server'
                : error.message || `Server error: ${error.response?.status}`

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
