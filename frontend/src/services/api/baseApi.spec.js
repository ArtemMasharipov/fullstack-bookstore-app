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
