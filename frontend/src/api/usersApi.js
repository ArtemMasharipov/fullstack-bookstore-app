import baseApi from './baseApi';

export const fetchUsers = async () => {
    const response = await baseApi.get('/users');
    return response.data;
};

export const fetchUserDetails = async (userId) => {
    const response = await baseApi.get(`/users/${userId}`);
    return response.data;
};

export const fetchCurrentUser = async () => {
    const response = await baseApi.get('/users/me');
    return response.data;
};

export const createUser = async (userData) => {
    const response = await baseApi.post('/users', userData);
    return response.data;
};

export const updateUser = async (userData) => {
    const response = await baseApi.put(`/users/${userData.id}`, userData);
    return response.data;
};

export const deleteUser = async (userId) => {
    const response = await baseApi.delete(`/users/${userId}`);
    return response.data;
};

export const fetchUserPermissions = async () => {
    const response = await baseApi.get('/users/permissions');
    return response.data;
};