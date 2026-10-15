import { useNotifications } from '@/composables/useNotifications'
import { resolveErrorKey } from '@/utils/errorResolver'
import { cartApi } from '@/services/api/cartApi'
import { defineStore } from 'pinia'

/** Check auth without importing auth store (avoids circular dep) */
const isLoggedIn = () => !!localStorage.getItem('token')

const GUEST_KEY = 'cart'
const MAX_QUANTITY = 99
const OBJECT_ID = /^[0-9a-fA-F]{24}$/

const isGuestItem = (item) =>
    typeof item?.bookId === 'string' &&
    OBJECT_ID.test(item.bookId) &&
    Number.isInteger(item.quantity) &&
    item.quantity >= 1 &&
    item.quantity <= MAX_QUANTITY

/**
 * The guest cart in localStorage: only { bookId, quantity }. Entries of the
 * previous shape keep their id and quantity; anything invalid is dropped.
 */
export function readGuestItems() {
    let stored
    try {
        stored = JSON.parse(localStorage.getItem(GUEST_KEY))
    } catch {
        return []
    }
    if (!Array.isArray(stored)) return []
    return stored.filter(isGuestItem).map(({ bookId, quantity }) => ({ bookId: bookId.toLowerCase(), quantity }))
}

function writeGuestItems(items) {
    if (items.length) localStorage.setItem(GUEST_KEY, JSON.stringify(items))
    else localStorage.removeItem(GUEST_KEY)
}

const tooManyCopies = () => Object.assign(new Error('Too many copies'), { code: 'VALIDATION_FAILED' })

// Cart changes run one after another: each starts from the cart the previous
// one left, so two quick additions, or a refresh during a change, never
// overwrite each other. The tasks report their own errors.
let queue = Promise.resolve()
function serial(task) {
    const run = queue.then(task)
    queue = run.catch(() => {})
    return run
}

/**
 * Cart Store
 * The server owns prices and totals: a signed-in cart lives on the server, a
 * guest cart keeps only ids and quantities locally and is priced by the
 * server's quote. lines and quote are always the server's answer.
 */
export const useCartStore = defineStore('cart', {
    state: () => ({
        lines: [],
        quote: null,
        status: 'idle',
        error: null,
        pending: [],
    }),

    getters: {
        totalQuantity: (state) => state.lines.reduce((sum, line) => sum + line.quantity, 0),

        isEmpty: (state) => state.lines.length === 0,

        hasUnavailable: (state) => state.lines.some((line) => !line.available),
    },

    actions: {
        _apply(view) {
            this.lines = view.items
            this.quote = view.quote
            this.status = 'ready'
            this.error = null
        },

        /** Applies a change to the guest cart and stores it once the server priced it */
        async _guestView(change) {
            const items = readGuestItems()
            change(items)
            const view = items.length ? await cartApi.quote(items) : { items: [], quote: null }
            writeGuestItems(items)
            return view
        },

        /** Runs a change of one line, with that line marked pending from the start; false on failure */
        async _changeLine(bookId, request) {
            const { showError } = useNotifications()
            this.pending.push(bookId)
            try {
                return await serial(async () => {
                    try {
                        this._apply(await request())
                        return true
                    } catch (error) {
                        showError(undefined, { messageKey: resolveErrorKey(error) })
                        return false
                    }
                })
            } finally {
                this.pending.splice(this.pending.indexOf(bookId), 1)
            }
        },

        /** Loads the cart; a cart already on screen stays there while it refreshes */
        load() {
            if (this.status !== 'ready') this.status = 'loading'
            return serial(async () => {
                try {
                    if (isLoggedIn()) this._apply(await cartApi.fetch())
                    else this._apply(await this._guestView(() => {}))
                } catch (error) {
                    this.status = 'error'
                    this.error = resolveErrorKey(error)
                }
            })
        },

        add(bookId, quantity = 1) {
            return serial(() => this._add(bookId, quantity))
        },

        async _add(bookId, quantity) {
            const { showSuccess, showError } = useNotifications()
            try {
                const view = isLoggedIn()
                    ? await cartApi.add(bookId, quantity)
                    : await this._guestView((items) => {
                          const existing = items.find((item) => item.bookId === bookId)
                          const total = (existing?.quantity ?? 0) + quantity
                          if (total > MAX_QUANTITY) throw tooManyCopies()
                          if (existing) existing.quantity = total
                          else items.push({ bookId, quantity })
                      })
                this._apply(view)
                const title = view.items.find((line) => line.bookId === bookId)?.title ?? ''
                showSuccess(undefined, {
                    messageKey: 'notifications.cartAdded',
                    messageParams: { title },
                    icon: 'mdi-cart-plus',
                })
                return true
            } catch (error) {
                showError(undefined, { messageKey: resolveErrorKey(error) })
                return false
            }
        },

        setQuantity(bookId, quantity) {
            return this._changeLine(bookId, () =>
                isLoggedIn()
                    ? cartApi.setQuantity(bookId, quantity)
                    : this._guestView((items) => {
                          const item = items.find((entry) => entry.bookId === bookId)
                          if (item) item.quantity = quantity
                      })
            )
        },

        async remove(bookId) {
            const { showSuccess } = useNotifications()
            const title = this.lines.find((line) => line.bookId === bookId)?.title
            const removed = await this._changeLine(bookId, () =>
                isLoggedIn()
                    ? cartApi.remove(bookId)
                    : this._guestView((items) => {
                          const index = items.findIndex((entry) => entry.bookId === bookId)
                          if (index >= 0) items.splice(index, 1)
                      })
            )
            if (removed) {
                showSuccess(undefined, {
                    messageKey: title ? 'notifications.cartRemoved' : 'notifications.cartRemovedGeneric',
                    messageParams: title ? { title } : undefined,
                    icon: 'mdi-cart-minus',
                })
            }
            return removed
        },

        clear() {
            const { showSuccess, showError } = useNotifications()
            return serial(async () => {
                try {
                    if (isLoggedIn()) this._apply(await cartApi.clear())
                    else this._apply(await this._guestView((items) => items.splice(0)))
                    showSuccess(undefined, { messageKey: 'notifications.cartCleared', icon: 'mdi-cart-off' })
                    return true
                } catch (error) {
                    showError(undefined, { messageKey: resolveErrorKey(error) })
                    return false
                }
            })
        },

        /**
         * After sign-in: adds the guest cart to the user's cart. The guest cart
         * is forgotten only once the server took it. Answers the report, or
         * null when there was nothing to merge or the merge failed.
         */
        mergeGuestCart() {
            return serial(() => this._mergeGuestCart())
        },

        async _mergeGuestCart() {
            const items = readGuestItems()
            if (!items.length) return null

            const { showWarning, showError } = useNotifications()
            try {
                const { cart, report } = await cartApi.merge(items)
                localStorage.removeItem(GUEST_KEY)
                this._apply(cart)
                if (report.skipped.length) {
                    showWarning(undefined, {
                        messageKey: 'cart.mergeSkipped',
                        messageParams: { count: report.skipped.length },
                    })
                }
                return report
            } catch (error) {
                showError(undefined, { messageKey: resolveErrorKey(error) })
                return null
            }
        },
    },
})
