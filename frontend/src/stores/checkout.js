import { useNotifications } from '@/composables/useNotifications'
import { orderApi } from '@/services/api/orderApi'
import { defineStore } from 'pinia'
import { useCartStore } from './cart'

/**
 * A version 4 UUID. crypto.randomUUID exists only in secure contexts (https,
 * localhost); a page opened over plain HTTP on another host, such as a phone
 * on the LAN, builds the same kind of UUID from random bytes.
 */
function newKey() {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

// The numbers of the session and of the current checkout: forget() moves both, start() moves the checkout. An answer
// of an ended session changes nothing and says nothing. An order an earlier checkout of the same session placed is
// announced and reloads the cart, but leaves the new checkout's key and state as they are
let session = 0
let flow = 0

/**
 * Checkout Store
 * One checkout is one Idempotency-Key, made when the checkout starts and
 * again after an order is placed. Every retry of the same checkout (a lost
 * connection, a confirmed price change) sends the same key, so the server
 * places the order at most once.
 */
export const useCheckoutStore = defineStore('checkout', {
    state: () => ({
        key: null,
        status: 'idle',
        error: null,
        fields: {},
        priceChange: null,
    }),

    actions: {
        start() {
            flow++
            this.key = newKey()
            this.status = 'idle'
            this.error = null
            this.fields = {}
            this.priceChange = null
        },

        /**
         * Places the order at the total the customer saw (geller)
         * @returns {Promise<object|null>} the order; null when it was not placed, and when this checkout is over
         * before the answer (a new checkout or the end of the session): the server keeps an order it placed, and
         * within the same session the customer still hears about it
         */
        async submit(shippingAddress, expectedTotal) {
            if (this.status === 'submitting') return null
            const startedSession = session
            const startedFlow = flow
            const sameSession = () => startedSession === session
            const current = () => startedFlow === flow
            this.status = 'submitting'
            this.error = null
            this.fields = {}
            this.priceChange = null

            try {
                const { order } = await orderApi.create({ shippingAddress, expectedTotal }, this.key)
                if (!sameSession()) return null
                if (current()) {
                    this.key = newKey()
                    this.status = 'idle'
                }
                await useCartStore().load()
                if (!sameSession()) return null
                useNotifications().showSuccess(undefined, {
                    messageKey: 'notifications.orderPlaced',
                    sound: 'success',
                    icon: 'mdi-check-circle',
                })
                return current() ? order : null
            } catch (error) {
                if (!current()) return null
                this.status = 'idle'
                this.error = error.code ?? 'UNKNOWN'
                if (error.code === 'PRICE_CHANGED') this.priceChange = error.details?.quote ?? null
                if (error.code === 'VALIDATION_FAILED') this.fields = error.fields ?? {}
                return null
            }
        },

        /** Orders at the new total after the customer has seen it, with the same key */
        confirmPriceChange(shippingAddress) {
            return this.submit(shippingAddress, this.priceChange.total)
        },

        /** After the session ends: empty at once; an answer still on its way belongs to the old session */
        forget() {
            session++
            flow++
            this.$reset()
        },
    },
})
