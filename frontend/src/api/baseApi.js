import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api/v1'

const baseApi = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
})

baseApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

baseApi.interceptors.response.use(
    (response) => response,
    ({ response }) => {
        const errorMessage = response?.data?.message || 'Unknown error occurred'
        console.error(`[API Error]: ${errorMessage}`)
        return Promise.reject(errorMessage)
    }
)

export const apiRequest = async (method, url, data = null) => baseApi({ method, url, data }).then((res) => res.data)

export default baseApi
