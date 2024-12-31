import baseApi from './baseApi'
import {jwtDecode} from 'jwt-decode'

export const fetchUsers = async () => {
    const response = await baseApi.get('/users')
    return response.data
}

export const fetchUserDetails = async (userId) => {
    const response = await baseApi.get(`/users/${userId}`)
    return response.data
}

export const createUser = async (userData) => {
    const response = await baseApi.post('/users', userData)
    return response.data
}

export const updateUser = async (userData) => {
    const response = await baseApi.put(`/users/${userData.id}`, userData)
    return response.data
}

export const deleteUser = async (userId) => {
    const response = await baseApi.delete(`/users/${userId}`)
    return response.data
}

export const fetchUserPermissions = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
        throw new Error('No token found')
    }
    const decoded = jwtDecode(token)
    return decoded.permissions
}
