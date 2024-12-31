import axios from 'axios'

const API_CONFIG = {
    baseURL: process.env.VUE_APP_API_URL || 'http://localhost:3000/api/v1',
    timeout: 10000,
    validateStatus: status => status < 500
}

const baseApi = axios.create(API_CONFIG)

const handleError = error => {
    if (!error.response) {
        throw new Error('Network connection error')
    }

    const { status, data } = error.response
    const message = data?.message || data?.error || 'Unexpected error occurred'

    if (status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
    }

    throw { status, message, data }
}

baseApi.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    const isPublic = ['/auth/login', '/auth/register'].some(ep => config.url.endsWith(ep))

    if (!isPublic) {
        if (!token) throw new Error('Authorization required')
        config.headers.Authorization = `Bearer ${token}`
    }

    if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json'
    }

    return config
}, Promise.reject)

baseApi.interceptors.response.use(response => response, handleError)

export const apiRequest = async (method, url, data = null, config = {}) => {
    try {
        const response = await baseApi({
            method,
            url,
            ...(data && method !== 'GET' && { data }),
            ...config
        })
        return response.data
    } catch (error) {
        console.error(`API ${method.toUpperCase()} ${url} failed:`, error)
        throw error
    }
}

export default baseApi
