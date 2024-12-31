import { apiRequest } from './baseApi'

const createFormDataConfig = (data) => ({
    headers: { 'Content-Type': 'multipart/form-data' },
    data: data instanceof FormData ? data : Object.entries(data).reduce((fd, [key, value]) => {
        fd.append(key, value)
        return fd
    }, new FormData())
})

export const createApiClient = (resource, customMethods = {}) => {
    const defaultMethods = {
        fetchAll: () => apiRequest('get', `/${resource}`),
        fetchById: id => apiRequest('get', `/${resource}/${id}`),
        create: data => apiRequest('post', `/${resource}`, data, 
            data instanceof FormData && createFormDataConfig(data)),
        update: (id, data) => apiRequest('put', `/${resource}/${id}`, data,
            data instanceof FormData && createFormDataConfig(data)),
        delete: id => apiRequest('delete', `/${resource}/${id}`)
    }

    return { ...defaultMethods, ...customMethods }
}
