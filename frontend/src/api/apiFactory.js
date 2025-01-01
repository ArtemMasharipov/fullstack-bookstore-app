import { apiRequest } from './baseApi'

export const createApiClient = (resource, customMethods = {}) => {
    const defaultMethods = {
        fetchAll: () => apiRequest('get', `/${resource}`),
        fetchById: (id) => apiRequest('get', `/${resource}/${id}`),
        create: (data) => apiRequest('post', `/${resource}`, data),
        update: (id, data) => apiRequest('put', `/${resource}/${id}`, data),
        delete: (id) => apiRequest('delete', `/${resource}/${id}`),
    }
    return { ...defaultMethods, ...customMethods }
}
