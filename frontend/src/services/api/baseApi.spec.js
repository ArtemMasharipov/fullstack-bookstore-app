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
    it('retains the existing 401 login redirect and token clearing', async () => {
        const { default: baseApi } = await import('./baseApi')
        window.history.replaceState({}, '', '/books')
        localStorage.setItem('token', 'local-demo-token')
        const error = await baseApi
            .get('/books', {
                adapter: async (config) => {
                    throw { response: { status: 401, data: { error: { code: 'UNAUTHORIZED' } }, headers: {}, config } }
                },
            })
            .catch((e) => e)
        expect(error.status).toBe(401)
        expect(localStorage.getItem('token')).toBeNull()
        expect(window.location.pathname).toBe('/login')
    })
})
