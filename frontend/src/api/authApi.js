import { apiRequest } from './baseApi'

export const authApi = {
    login: (credentials) =>
        apiRequest('post', '/auth/login', credentials).then((response) => {
            const { token } = response
            if (token) localStorage.setItem('token', token)
            return response
        }),
    register: (userData) =>
        apiRequest('post', '/auth/register', userData).then((response) => {
            const { token } = response
            if (token) localStorage.setItem('token', token)
            return response
        }),
    logout: () => localStorage.removeItem('token'),
}
