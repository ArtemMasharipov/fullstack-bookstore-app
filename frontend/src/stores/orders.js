import { useNotifications } from '@/composables/useNotifications'
import { orderApi } from '@/services/api/orderApi'
import { resolveErrorKey } from '@/utils/errorResolver'
import { defineStore } from 'pinia'

const PAGE_SIZE = 10

const codeOf = (error) => error?.code ?? 'UNKNOWN'

/**
 * Orders Store
 * The user's orders (a page of the list and one order's details).
 * Each part keeps its own status
 * (idle | loading | ready | error) and the code of its last error.
 */
export const useOrdersStore = defineStore('orders', {
    state: () => ({
        list: [],
        pagination: null,
        listStatus: 'idle',
        listError: null,

        current: null,
        currentStatus: 'idle',
        currentError: null,
        cancelling: false,
    }),

    actions: {
        async fetchList(page = 1) {
            this.listStatus = 'loading'
            this.listError = null
            try {
                const { items, pagination } = await orderApi.list({ page, limit: PAGE_SIZE })
                this.list = items
                this.pagination = pagination
                this.listStatus = 'ready'
            } catch (error) {
                this.listStatus = 'error'
                this.listError = codeOf(error)
            }
        },

        async fetchOne(id) {
            this.current = null
            this.currentStatus = 'loading'
            this.currentError = null
            try {
                this.current = await orderApi.get(id)
                this.currentStatus = 'ready'
            } catch (error) {
                this.currentStatus = 'error'
                this.currentError = codeOf(error)
            }
        },

        /**
         * Cancels an order; the details and the list show the new status
         * @returns {Promise<boolean>} whether the order was cancelled
         */
        async cancel(id) {
            if (this.cancelling) return false
            this.cancelling = true
            try {
                const order = await orderApi.cancel(id)
                if (this.current?.id === id) this.current = order
                const row = this.list.find((item) => item.id === id)
                if (row) row.status = order.status
                useNotifications().showSuccess(undefined, {
                    messageKey: 'notifications.orderCancelled',
                    messageParams: { number: order.orderNumber },
                    icon: 'mdi-cancel',
                })
                return true
            } catch (error) {
                useNotifications().showError(undefined, { messageKey: resolveErrorKey(error) })
                return false
            } finally {
                this.cancelling = false
            }
        },
    },
})
