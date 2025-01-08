import axios from 'axios'

const baseApi = axios.create({
    baseURL: 'http://localhost:3000/api/v1'
})

const isPublicEndpoint = url => ['/auth/login', '/auth/register'].some(ep => url.endsWith(ep))

baseApi.interceptors.request.use(config => {
    if (!isPublicEndpoint(config.url)) {
        const token = localStorage.getItem('token')
        if (!token) throw new Error('Authorization required')
        config.headers.Authorization = `Bearer ${token}`
    }

    if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = config.data instanceof FormData ? 'multipart/form-data' : 'application/json'
    }

    return config
})

baseApi.interceptors.response.use(
    response => response,
    error => {
        if (!error.response) throw new Error('Network connection error')
        if (error.response.status === 401) {
            localStorage.removeItem('token')
            window.location.href = '/login'
        }
        throw error.response.data?.message || 'An unexpected error occurred'
    }
)

export const apiRequest = async (method, url, data = null, headers = {}) => {
    try {
        const response = await baseApi({ method, url, ...(data && method !== 'GET' && { data }), headers })
        return response.data
    } catch (error) {
        console.error(`API Error: ${method} ${url}`, error)
        throw error
    }
}

export default baseApi
