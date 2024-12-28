import baseApi from './baseApi'

export const login = async (credentials) => {
    const response = await baseApi.post('/auth/login', credentials);
    const { token } = response.data;
    if (token) {
        localStorage.setItem('token', token);
    }
    return response.data;
};

export const register = async (userData) => {
    const response = await baseApi.post('/auth/register', userData)
    const { token } = response.data
    if (token) {
        localStorage.setItem('token', token)
    }
    return response.data
}

export const logout = () => {
    localStorage.removeItem('token')
}
