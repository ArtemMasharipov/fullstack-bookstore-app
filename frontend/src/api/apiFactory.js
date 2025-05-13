import { apiRequest } from './baseApi'

const createFormDataConfig = (data) => ({
    headers: { 'Content-Type': 'multipart/form-data' },
    data:
        data instanceof FormData
            ? data
            : Object.entries(data).reduce((fd, [key, value]) => {
                  fd.append(key, value)
                  return fd
              }, new FormData()),
})

export const createApiClient = (resource, customMethods = {}) => {
    const validateId = (id) => {
        if (!id) throw new Error(`Invalid ${resource} ID`)
        return id
    }

    const defaultMethods = {
        fetchAll: (params) => apiRequest('get', `/${resource}`, null, { params }),
        fetchById: (id) => apiRequest('get', `/${resource}/${validateId(id)}`),
        create: (data) =>
            apiRequest('post', `/${resource}`, data, data instanceof FormData && createFormDataConfig(data)),
        update: (id, data) =>
            apiRequest(
                'put',
                `/${resource}/${validateId(id)}`,
                data,
                data instanceof FormData ? createFormDataConfig(data) : null
            ),
        delete: (id) => apiRequest('delete', `/${resource}/${validateId(id)}`),
    }

    return { ...defaultMethods, ...customMethods }
}
