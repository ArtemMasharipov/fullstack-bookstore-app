import baseApi from './baseApi'

const forSession = (token) => (token ? { headers: { Authorization: 'Bearer ' + token } } : undefined)
const pick = (value, fields) =>
    Object.fromEntries(fields.filter((field) => Object.hasOwn(value, field)).map((field) => [field, value[field]]))

/** Auth endpoints; account operations may bind the session captured by their caller. */
export const authApi = {
    login: (credentials) => {
        const payload = {
            emailOrUsername: credentials.email ?? credentials.emailOrUsername,
            password: credentials.password,
        }
        return baseApi.post('/auth/login', payload).then((res) => res.data)
    },

    register: (userData) => baseApi.post('/auth/register', userData).then((res) => res.data),

    /** No body; the token belongs to the session that has already ended locally. */
    logout: (token) => baseApi.post('/auth/logout', undefined, forSession(token)).then((res) => res.data),

    getCurrentUser: (token) => baseApi.get('/auth/me', forSession(token)).then((res) => res.data),

    updateProfile: (body, token) =>
        baseApi
            .put('/auth/profile', pick(body, ['firstName', 'lastName', 'username']), forSession(token))
            .then((res) => res.data),

    changePassword: (body, token) =>
        baseApi
            .put('/auth/password', pick(body, ['currentPassword', 'newPassword']), forSession(token))
            .then((res) => res.data),

    logoutAll: (token) => baseApi.delete('/auth/sessions', forSession(token)).then((res) => res.data),
}
