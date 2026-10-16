import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ fetchPublic: vi.fn() }))
vi.mock('@/services/api/configApi', () => ({ configApi: api }))

import { useShopConfigStore } from './shopConfig'

const SETTINGS = {
    currency: 'CZK',
    vatIncluded: true,
    vatRatePercent: 0,
    shippingFee: 9900,
    freeShippingThreshold: 100000,
    paymentMethods: [],
}

beforeEach(() => {
    api.fetchPublic.mockReset()
    setActivePinia(createPinia())
})

describe('shop config store', () => {
    it('loads the settings once', async () => {
        api.fetchPublic.mockResolvedValue(SETTINGS)
        const shop = useShopConfigStore()

        await Promise.all([shop.load(), shop.load()])
        await shop.load()

        expect(api.fetchPublic).toHaveBeenCalledTimes(1)
        expect(shop.status).toBe('ready')
        expect(shop.config).toEqual(SETTINGS)
    })

    it('tries again after a failure', async () => {
        api.fetchPublic.mockRejectedValueOnce(new Error('Network Error')).mockResolvedValueOnce(SETTINGS)
        const shop = useShopConfigStore()

        await shop.load()
        expect(shop.status).toBe('error')
        expect(shop.config).toBeNull()

        await shop.load()
        expect(shop.status).toBe('ready')
        expect(shop.config).toEqual(SETTINGS)
    })
})
