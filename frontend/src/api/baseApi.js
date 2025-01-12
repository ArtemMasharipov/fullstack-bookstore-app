import axios from 'axios'

const API_CONFIG = {
    baseURL: process.env.VUE_APP_API_URL || 'http://localhost:3000/api/v1',
    timeout: 10000,
    validateStatus: status => status < 500
}

const baseApi = axios.create(API_CONFIG)

const handleError = error => {
    if (!error.response) {
        throw new Error('Network connection error');
    }

    const { status, data } = error.response;
    const message = data?.message || data?.error || 'Unexpected error occurred';

    if (status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
    }

    // Ensure we always return a string message
    const errorObject = new Error(message);
    errorObject.status = status;
    errorObject.data = data;
    throw errorObject;
}

baseApi.interceptors.request.use(config => {
    console.log('API Request Config:', {
        url: config.url,
        method: config.method,
        headers: config.headers,
        data: config.data
    });

    const token = localStorage.getItem('token')
    const isPublic = ['/auth/login', '/auth/register'].some(ep => config.url.endsWith(ep))

    if (!isPublic) {
        if (!token) {
            console.error('No token found for protected route');
            throw new Error('Authorization required')
        }
        config.headers.Authorization = `Bearer ${token}`
    }

    if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json'
    }

    return config
}, error => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
})

baseApi.interceptors.response.use(
    response => {
        console.log('API Response:', {
            status: response.status,
            data: response.data,
            url: response.config.url
        });
        return response;
    }, 
    error => {
        console.error('API Error:', {
            message: error.message,
            response: error.response,
            request: error.config
        });
        return handleError(error);
    }
);

export const apiRequest = async (method, url, data = null, config = {}) => {
    try {
        console.log(`API Request ${method.toUpperCase()} ${url}:`, { data, config });
        const response = await baseApi({
            method,
            url,
            ...(data && method !== 'GET' && { data }),
            ...config
        });
        console.log(`API Response ${method.toUpperCase()} ${url}:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`API ${method.toUpperCase()} ${url} failed:`, {
            error,
            response: error.response,
            data: error.response?.data
        });
        throw error;
    }
}

export default baseApi
