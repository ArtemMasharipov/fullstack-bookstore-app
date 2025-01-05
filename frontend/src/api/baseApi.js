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
        let errorMessage = 'Unknown error occurred'

        if (error.response) {
            errorMessage =
                error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`
        } else if (error.request) {
            errorMessage = 'No response from server'
        } else {
            errorMessage = error.message
        }

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
        const config = {
            method,
            url,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };
        
        if (data && method !== 'GET') {
            config.data = JSON.stringify(data);
        }

        const response = await baseApi(config);
        return response.data;
    } catch (error) {
        console.error(`API ${method} ${url} error:`, error);
        throw error.response?.data || { message: error.message };
    }
};

export default baseApi
