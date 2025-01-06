import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api/v1'

const baseApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

const PUBLIC_ENDPOINTS = [
    '/auth/login',
    '/auth/register'
]

baseApi.interceptors.request.use((config) => {
    const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint => 
        config.url.endsWith(endpoint)
    )

    if (!isPublicEndpoint) {
        const token = localStorage.getItem('token')
        if (!token) {
            console.warn('No authorization token found')
            throw new Error('Authorization required')
        }
        config.headers.Authorization = `Bearer ${token}`
    }

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
        // Network error
        if (!error.response) {
            console.error('[Network Error]:', error.message);
            return Promise.reject(new Error('Network connection error. Please check your internet connection.'));
        }

        // Authentication error
        if (error.response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return Promise.reject(new Error('Authentication expired. Please login again.'));
        }

        const errorMessage = 
            error.response?.data?.message || 
            error.response?.data?.error || 
            (error.response?.status === 500 ? 'Internal server error' : 'An unexpected error occurred');

        console.error('[API Error]:', {
            message: errorMessage,
            status: error.response.status,
            url: error.config.url,
            method: error.config.method,
            data: error.config.data,
            responseData: error.response.data
        });

        return Promise.reject({
            message: errorMessage,
            status: error.response.status,
            data: error.response.data
        });
    }
);

export const apiRequest = async (method, url, data = null, headers = {}) => {
    try {
        const response = await baseApi({
            method,
            url,
            ...(data && method !== 'GET' && { data }),
            headers,
        });
        return response.data;
    } catch (error) {
        console.error(`API ${method} ${url} error:`, {
            error,
            requestData: data
        });
        
        if (error.response) {
            throw error;
        } else {
            throw new Error('Network connection error. Please try again later.');
        }
    }
};

export default baseApi
