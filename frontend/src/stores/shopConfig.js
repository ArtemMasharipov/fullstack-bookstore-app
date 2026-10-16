import { configApi } from '@/services/api/configApi'
import { defineStore } from 'pinia'

/**
 * Shop Config Store
 * The shop settings from the server, loaded once. Pages state delivery and VAT
 * only from them; until they are here, a page says nothing about those terms.
 */
export const useShopConfigStore = defineStore('shopConfig', {
    state: () => ({
        config: null,
        status: 'idle',
    }),

    actions: {
        /** Loads the settings once; after a failure the next call tries again */
        async load() {
            if (this.status === 'ready' || this.status === 'loading') return
            this.status = 'loading'
            try {
                this.config = await configApi.fetchPublic()
                this.status = 'ready'
            } catch {
                this.status = 'error'
            }
        },
    },
})
