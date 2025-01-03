import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api/v1'

const baseApi = axios.create({
    baseURL: API_BASE_URL,
})

baseApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    if (!config.headers['Content-Type']) {
        if (config.data instanceof FormData) {
            config.headers['Content-Type'] = 'multipart/form-data'
        } else if (typeof config.data === 'object') {
            config.headers['Content-Type'] = 'application/json'
        } else {
            config.headers['Content-Type'] = 'text/plain'
        }
    }

    return config
})

baseApi.interceptors.response.use(
    (response) => response,
    (error) => {
        const errorMessage = error.response?.data?.message || 'Unknown error occurred'
        console.error(`[API Error]: ${errorMessage}`)
        return Promise.reject(new Error(errorMessage))
    }
)

export const apiRequest = async (method, url, data = null, headers = {}) => {
    return baseApi({ method, url, data, headers }).then((res) => res.data)
}

export default baseApi
