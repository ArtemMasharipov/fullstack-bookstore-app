import { useNotifications } from '@/composables/useNotifications'
import { orderApi } from '@/services/api/orderApi'
import { resolveErrorKey } from '@/utils/errorResolver'
import { defineStore } from 'pinia'

const PAGE_SIZE = 10

const codeOf = (error) => error?.code ?? 'UNKNOWN'

// Answers can come late. The list and the details keep only the answer to their newest request, and nothing that
// answers after the session ended is kept or shown: forget() moves every number on.
let listRequest = 0
let currentRequest = 0
let session = 0

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
            const request = ++listRequest
            const latest = () => request === listRequest
            this.listStatus = 'loading'
            this.listError = null
            try {
                const { items, pagination } = await orderApi.list({ page, limit: PAGE_SIZE })
                if (!latest()) return
                this.list = items
                this.pagination = pagination
                this.listStatus = 'ready'
            } catch (error) {
                if (!latest()) return
                this.listStatus = 'error'
                this.listError = codeOf(error)
            }
        },

        async fetchOne(id) {
            const request = ++currentRequest
            const latest = () => request === currentRequest
            this.current = null
            this.currentStatus = 'loading'
            this.currentError = null
            try {
                const order = await orderApi.get(id)
                if (!latest()) return
                this.current = order
                this.currentStatus = 'ready'
            } catch (error) {
                if (!latest()) return
                this.currentStatus = 'error'
                this.currentError = codeOf(error)
            }
        },

        /**
         * Cancels an order; the details and the list show the new status
         * @returns {Promise<boolean>} whether the order was cancelled; false as well when the session ended first
         */
        async cancel(id) {
            if (this.cancelling) return false
            const started = session
            const live = () => started === session
            this.cancelling = true
            try {
                const order = await orderApi.cancel(id)
                if (!live()) return false
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
                if (!live()) return false
                useNotifications().showError(undefined, { messageKey: resolveErrorKey(error) })
                return false
            } finally {
                if (live()) this.cancelling = false
            }
        },

        /** After the session ends: empty at once; the answers still on their way belong to the old session */
        forget() {
            listRequest++
            currentRequest++
            session++
            this.$reset()
        },
    },
})
