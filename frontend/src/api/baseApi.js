import axios from 'axios';

const API_CONFIG = {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
    timeout: 10000,
    validateStatus: status => status < 500
}

const baseApi = axios.create(API_CONFIG)

const handleError = error => {
    if (!error.response) {
        throw new Error('Network connection error');
    }

    const { status, data } = error.response;
    const message = data?.message || data?.error || 'Unexpected error occurred';    if (status === 401) {
        // Clear token and redirect, but prevent multiple redirects
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
    }

    // Ensure we always return a string message
    const errorObject = new Error(message);
    errorObject.status = status;
    errorObject.data = data;
    throw errorObject;
}

baseApi.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    const isPublic = ['/auth/login', '/auth/register'].some(ep => config.url.endsWith(ep))

    if (!isPublic) {
        if (!token) {
            throw new Error('Authorization required')
        }
        config.headers.Authorization = `Bearer ${token}`
    }

    if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json'
    }

    return config
}, error => {
    return Promise.reject(error);
})

baseApi.interceptors.response.use(
    response => {
        return response;
    }, 
    error => {
        return handleError(error);
    }
);

export const apiRequest = async (method, url, data = null, config = {}) => {
    try {
        const response = await baseApi({
            method,
            url,
            ...(data && { data }),
            ...config
        });

        return response.data;
    } catch (error) {
        throw error;
    }
};

export default baseApi
