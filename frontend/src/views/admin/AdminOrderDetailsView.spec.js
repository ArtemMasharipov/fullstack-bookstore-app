import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { button, deferred, mountAdmin } from '@/test/admin'
import { formatMoney } from '@/utils/money'
const api = vi.hoisted(() => ({ get: vi.fn(), adminSetPayment: vi.fn(), adminSetStatus: vi.fn() }))
vi.mock('@/services/api/orderApi', () => ({ orderApi: api }))
import View from './AdminOrderDetailsView.vue'
const original = {
    id: 'o1',
    orderNumber: 'ORD-1',
    customer: null,
    status: 'pending',
    paymentStatus: 'unpaid',
    createdAt: '2026-10-19T10:00:00Z',
    items: [{ bookId: 'b1', title: 'Babička', quantity: 2, unitPrice: 1929, lineTotal: 3858 }],
    shippingAddress: {
        fullName: 'Jan Novák',
        line1: 'Vodičkova 12',
        postalCode: '11000',
        city: 'Praha',
        country: 'CZ',
        phone: '+420777123456',
    },
    quote: { currency: 'CZK', total: 3858, itemsTotal: 3858, shipping: 0, vatIncluded: true, vatAmount: 0 },
    statusHistory: [{ axis: 'status', from: 'pending', to: 'processing', by: 'admin', at: '2026-10-19T10:00:00Z' }],
    allowedTransitions: [
        { axis: 'payment', to: 'paid' },
        { axis: 'status', to: 'cancelled' },
    ],
}
let mounted, words
beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset())
    api.get.mockResolvedValue(original)
})
afterEach(() => {
    mounted?.cleanup()
    mounted = null
})
async function mount(locale = 'cs') {
    mounted = await mountAdmin(View, {
        path: `${locale === 'en' ? '/en' : ''}/admin/orders/o1?page=2&paymentStatus=paid`,
        locale,
        routeName: 'AdminOrderDetails',
    })
    words = mounted.words
    await vi.waitFor(() => expect(api.get).toHaveBeenCalledWith('o1'))
    await vi.waitFor(() => expect(mounted.root.textContent).toContain('ORD-1'))
}
const dialog = () => document.querySelector('[role="dialog"]')
describe.each(['cs', 'en'])('AdminOrderDetailsView (%s)', (locale) => {
    it('reloads a stale cancellation and requires a new manual-refund confirmation', async () => {
        await mount(locale)
        api.adminSetStatus.mockRejectedValueOnce({ status: 409, code: 'CONFLICT' })
        api.get.mockResolvedValueOnce({ ...original, status: 'processing', paymentStatus: 'paid' })
        button(words.admin.orderDetails.actions.cancelled).click()
        await vi.waitFor(() => expect(dialog()?.textContent).toContain(words.admin.orderDetails.confirmText))
        expect(dialog().textContent).not.toContain(words.admin.orderDetails.manualRefund)
        button(words.modal.confirm, dialog()).click()
        await vi.waitFor(() => expect(api.get).toHaveBeenCalledTimes(2))
        expect(api.adminSetStatus).toHaveBeenCalledWith('o1', 'cancelled', {
            status: 'pending',
            paymentStatus: 'unpaid',
        })
        expect(api.adminSetStatus).toHaveBeenCalledTimes(1)
        await vi.waitFor(() => expect(dialog()).toBeNull())
        button(words.admin.orderDetails.actions.cancelled).click()
        await vi.waitFor(() => expect(dialog()?.textContent).toContain(words.admin.orderDetails.manualRefund))
    })
    it('describes a customer history entry as the customer rather than the current administrator', async () => {
        api.get.mockResolvedValue({ ...original, statusHistory: [{ ...original.statusHistory[0], by: 'user' }] })
        await mount(locale)
        expect(mounted.root.textContent).toContain(locale === 'en' ? 'by the customer' : 'zákazníkem')
    })
    it('renders the snapshot, customer fallback, history, allowed actions and canonical Back link', async () => {
        await mount(locale)
        for (const text of [
            'Babička',
            'Jan Novák',
            'Vodičkova 12',
            'Praha',
            '+420777123456',
            words.admin.orders.deletedCustomer,
            formatMoney(3858),
        ])
            expect(mounted.root.textContent).toContain(text)
        expect(mounted.root.querySelector('h1')).toBeNull()
        expect(mounted.root.querySelector('h2').textContent).toContain('ORD-1')
        expect(button(words.admin.orderDetails.actions.paid)).toBeTruthy()
        expect(button(words.admin.orderDetails.actions.cancelled)).toBeTruthy()
        expect(button(words.admin.orderDetails.actions.shipped)).toBeUndefined()
        const back = mounted.root.querySelector('a')
        expect(back.getAttribute('href')).toBe(`${locale === 'en' ? '/en' : ''}/admin/orders?page=2&paymentStatus=paid`)
    })
    it.each(['cancelled', 'refunded'])('requires truthful manual refund confirmation for %s', async (to) => {
        api.get.mockResolvedValue({
            ...original,
            paymentStatus: 'paid',
            allowedTransitions: [{ axis: to === 'refunded' ? 'payment' : 'status', to }],
        })
        await mount(locale)
        button(words.admin.orderDetails.actions[to]).click()
        await vi.waitFor(() => expect(dialog()?.textContent).toContain(words.admin.orderDetails.manualRefund))
        button(words.modal.cancel, dialog()).click()
        await nextTick()
        expect(api.adminSetStatus).not.toHaveBeenCalled()
        expect(api.adminSetPayment).not.toHaveBeenCalled()
    })
    it('records payment once, refreshes history and restores focus when its action disappears', async () => {
        await mount(locale)
        const pending = deferred()
        api.adminSetPayment.mockReturnValueOnce(pending.promise)
        api.get.mockResolvedValueOnce({
            ...original,
            status: 'processing',
            paymentStatus: 'paid',
            allowedTransitions: [{ axis: 'status', to: 'shipped' }],
            statusHistory: [
                ...original.statusHistory,
                { axis: 'payment', from: 'unpaid', to: 'paid', by: 'admin', at: '2026-10-19T10:00:00Z' },
            ],
        })
        const opener = button(words.admin.orderDetails.actions.paid)
        opener.focus()
        opener.click()
        await vi.waitFor(() => expect(dialog()).toBeTruthy())
        const confirm = button(words.modal.confirm, dialog())
        confirm.click()
        confirm.click()
        await vi.waitFor(() => expect(api.adminSetPayment).toHaveBeenCalledTimes(1))
        pending.resolve({})
        await vi.waitFor(() => expect(button(words.admin.orderDetails.actions.shipped)).toBeTruthy())
        await vi.waitFor(() => expect(document.activeElement?.textContent).toBe(words.admin.orderDetails.actionsTitle))
        expect(mounted.root.textContent).toContain(words.orders.payment.paid)
    })
})
it('offers Retry after an initial error and displays no stale snapshot', async () => {
    api.get.mockRejectedValueOnce({ code: 'NOT_FOUND' })
    mounted = await mountAdmin(View, { path: '/admin/orders/o1', routeName: 'AdminOrderDetails' })
    words = mounted.words
    await vi.waitFor(() => expect(button(words.errors.retry)).toBeTruthy())
    expect(mounted.root.textContent).not.toContain('Jan Novák')
    button(words.errors.retry).click()
    await vi.waitFor(() => expect(mounted.root.textContent).toContain('ORD-1'))
})
