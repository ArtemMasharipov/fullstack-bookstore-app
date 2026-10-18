import { AxiosError } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('baseApi base URL', () => {
    beforeEach(() => {
        vi.resetModules()
    })

    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('defaults to the relative /api/v1 when VITE_API_URL is empty', async () => {
        vi.stubEnv('VITE_API_URL', '')

        const { default: baseApi } = await import('./baseApi')

        expect(baseApi.defaults.baseURL).toBe('/api/v1')
    })

    it('uses VITE_API_URL when it is set', async () => {
        vi.stubEnv('VITE_API_URL', 'https://api.example/v1')

        const { default: baseApi } = await import('./baseApi')

        expect(baseApi.defaults.baseURL).toBe('https://api.example/v1')
    })
})

describe('baseApi rejection metadata', () => {
    it('preserves HTTP status, complete data and stable error code at the real request boundary', async () => {
        const { default: baseApi } = await import('./baseApi')
        const data = {
            success: false,
            error: { code: 'PRICE_CHANGED', message: 'private sentinel', details: { price: 299.9 } },
        }
        const error = await baseApi
            .get('/books', {
                adapter: async (config) => {
                    throw new AxiosError('private sentinel', AxiosError.ERR_BAD_REQUEST, config, null, {
                        status: 409,
                        data,
                        headers: {},
                        config,
                    })
                },
            })
            .catch((e) => e)
        expect(error).toBeInstanceOf(Error)
        expect(error).toMatchObject({ status: 409, data, code: 'PRICE_CHANGED' })
    })
    it('takes the message and the details from the error envelope', async () => {
        const { default: baseApi } = await import('./baseApi')
        const data = {
            success: false,
            error: { code: 'BOOK_UNAVAILABLE', message: 'Book is out of stock', details: { x: 1 } },
        }
        const error = await baseApi
            .get('/books', {
                adapter: async (config) => {
                    throw new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, {
                        status: 409,
                        data,
                        headers: {},
                        config,
                    })
                },
            })
            .catch((e) => e)
        expect(error.message).toBe('Book is out of stock')
        expect(error.details).toEqual({ x: 1 })
        expect(error.status).toBe(409)
    })
    it('carries the invalid fields of a validation error', async () => {
        const { default: baseApi } = await import('./baseApi')
        const data = {
            success: false,
            error: { code: 'VALIDATION_FAILED', message: 'Validation failed', fields: { quantity: 'too_big' } },
        }
        const error = await baseApi
            .get('/books', {
                adapter: async (config) => {
                    throw new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, {
                        status: 400,
                        data,
                        headers: {},
                        config,
                    })
                },
            })
            .catch((e) => e)
        expect(error.fields).toEqual({ quantity: 'too_big' })
        expect(error.code).toBe('VALIDATION_FAILED')
    })
    it('retains successful response envelopes and the existing NETWORK_ERROR marker', async () => {
        const { default: baseApi } = await import('./baseApi')
        const data = { success: true, data: { books: [] }, message: 'Loaded' }
        const result = await baseApi.get('/books', {
            adapter: async (config) => ({ status: 200, data, headers: {}, config }),
        })
        expect(result.data).toBe(data)
        const error = await baseApi
            .get('/books', {
                adapter: async () => {
                    throw new Error('Network Error')
                },
            })
            .catch((e) => e)
        expect(error.code).toBe('NETWORK_ERROR')
    })
})

describe('baseApi token', () => {
    // Answers the request it was given, so a test sees what would be sent
    const echo = async (config) => ({ data: {}, status: 200, statusText: 'OK', headers: {}, config })
    const sentAuthorization = async (path, options = {}) => {
        const { default: baseApi } = await import('./baseApi')
        const response = await baseApi.get(path, { adapter: echo, ...options })
        return response.config.headers.Authorization
    }

    afterEach(() => {
        localStorage.clear()
    })

    it.each(['/books', '/authors', '/cart/quote', '/config/public', '/auth/login', '/orders'])(
        'sends the token with a request to %s',
        async (path) => {
            localStorage.setItem('token', 'local-demo-token')

            expect(await sentAuthorization(path)).toBe('Bearer local-demo-token')
        }
    )

    it.each(['/books', '/orders'])(
        'sends a request to %s without an Authorization header when there is no token',
        async (path) => {
            expect(await sentAuthorization(path)).toBeUndefined()
        }
    )

    it('keeps the token a request brings itself', async () => {
        localStorage.setItem('token', 'current-token')

        expect(await sentAuthorization('/auth/logout', { headers: { Authorization: 'Bearer ended-token' } })).toBe(
            'Bearer ended-token'
        )
    })
})

describe('baseApi session handler', () => {
    const answering = (status) => async (config) => {
        throw { response: { status, data: { error: { code: 'UNAUTHORIZED' } }, headers: {}, config } }
    }

    afterEach(() => {
        localStorage.clear()
    })

    it('calls the session handler once for a 401 to a request sent with a token', async () => {
        const { default: baseApi, setUnauthorizedHandler } = await import('./baseApi')
        const handler = vi.fn()
        setUnauthorizedHandler(handler)
        window.history.replaceState({}, '', '/orders')
        localStorage.setItem('token', 'local-demo-token')

        const error = await baseApi.get('/orders', { adapter: answering(401) }).catch((e) => e)

        expect(error.status).toBe(401)
        expect(handler).toHaveBeenCalledTimes(1)
        expect(window.location.pathname).toBe('/orders')
    })

    it('does not call it for a 401 to a request without a token', async () => {
        const { default: baseApi, setUnauthorizedHandler } = await import('./baseApi')
        const handler = vi.fn()
        setUnauthorizedHandler(handler)

        const error = await baseApi.post('/auth/login', {}, { adapter: answering(401) }).catch((e) => e)

        expect(error.status).toBe(401)
        expect(handler).not.toHaveBeenCalled()
    })

    it('does not call it for a 403', async () => {
        const { default: baseApi, setUnauthorizedHandler } = await import('./baseApi')
        const handler = vi.fn()
        setUnauthorizedHandler(handler)
        localStorage.setItem('token', 'local-demo-token')

        const error = await baseApi.get('/orders', { adapter: answering(403) }).catch((e) => e)

        expect(error.status).toBe(403)
        expect(handler).not.toHaveBeenCalled()
    })
})
