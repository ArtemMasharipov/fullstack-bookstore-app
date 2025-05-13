import { createApiClient } from './apiFactory'
import { jwtDecode } from 'jwt-decode'

export const usersApi = createApiClient('users', {
    fetchUserPermissions: () => {
        const token = localStorage.getItem('token')
        if (!token) throw new Error('No token found')
        const decoded = jwtDecode(token)
        return decoded.permissions
    },
})
