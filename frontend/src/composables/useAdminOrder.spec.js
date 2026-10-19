import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'
import { deferred, mountAdmin } from '@/test/admin'
import { useNotifications } from '@/composables/useNotifications'
const api = vi.hoisted(() => ({ get: vi.fn(), adminSetPayment: vi.fn(), adminSetStatus: vi.fn() }))
vi.mock('@/services/api/orderApi', () => ({ orderApi: api }))
import { useAdminOrder } from './useAdminOrder'
const original = {
    id: 'a',
    orderNumber: 'A',
    customer: { email: 'a@example.com' },
    allowedTransitions: [{ axis: 'payment', to: 'paid' }],
}
let state, mounted
const Harness = {
    setup() {
        state = useAdminOrder()
        return () => h('p', state.order.value?.orderNumber)
    },
}
beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset())
    api.get.mockResolvedValue(original)
    api.adminSetPayment.mockResolvedValue({ ...original, paymentStatus: 'paid' })
})
afterEach(() => {
    mounted?.cleanup()
    mounted = null
})
async function mount() {
    mounted = await mountAdmin(Harness, { path: '/admin/orders/a', routeName: 'AdminOrderDetails' })
    await vi.waitFor(() => expect(api.get).toHaveBeenCalledWith('a'))
    await vi.waitFor(() => expect(state.loading.value).toBe(false))
}
it('loads by id and waits for a fresh GET before enabling new actions', async () => {
    await mount()
    const fresh = deferred(),
        write = deferred()
    api.adminSetPayment.mockReturnValueOnce(write.promise)
    api.get.mockReturnValueOnce(fresh.promise)
    const action = state.transition({ axis: 'payment', to: 'paid' })
    await state.transition({ axis: 'payment', to: 'paid' })
    expect(api.adminSetPayment).toHaveBeenCalledTimes(1)
    write.resolve({})
    await vi.waitFor(() => expect(api.get).toHaveBeenCalledTimes(2))
    expect(state.mutating.value).toBe(true)
    fresh.resolve({ ...original, allowedTransitions: [{ axis: 'status', to: 'shipped' }] })
    await action
    expect(state.mutating.value).toBe(false)
    expect(state.order.value.allowedTransitions).toEqual([{ axis: 'status', to: 'shipped' }])
    expect(useNotifications().notifications.value).toHaveLength(1)
})
it('reports one confirmed success even when the fresh GET fails, and can retry', async () => {
    await mount()
    api.get.mockRejectedValueOnce({ code: 'INTERNAL' })
    await state.transition({ axis: 'payment', to: 'paid' })
    expect(useNotifications().notifications.value).toHaveLength(1)
    expect(useNotifications().notifications.value[0].type).toBe('success')
    expect(state.error.value).toEqual({ code: 'INTERNAL' })
    await state.reload()
    expect(state.error.value).toBeNull()
})
it.each(['CONFLICT', 'INVALID_TRANSITION'])('reloads after %s and reports the rejected write', async (code) => {
    await mount()
    api.adminSetPayment.mockRejectedValueOnce({ status: 409, code })
    await state.transition({ axis: 'payment', to: 'paid' })
    expect(api.get).toHaveBeenCalledTimes(2)
    expect(state.actionError.value).toEqual({ status: 409, code })
    expect(useNotifications().notifications.value.filter((n) => n.type === 'success')).toHaveLength(0)
})
it('rejects unoffered actions without calling the API', async () => {
    await mount()
    await state.transition({ axis: 'status', to: 'delivered' })
    expect(api.adminSetStatus).not.toHaveBeenCalled()
})
it('clears old PII on id change and ignores the old GET', async () => {
    await mount()
    const old = deferred(),
        fresh = deferred()
    api.get.mockReturnValueOnce(old.promise).mockReturnValueOnce(fresh.promise)
    const reload = state.reload()
    await mounted.router.push('/admin/orders/b')
    expect(state.order.value).toBeNull()
    old.resolve(original)
    await reload
    expect(state.order.value).toBeNull()
    fresh.resolve({ ...original, id: 'b', orderNumber: 'B' })
    await vi.waitFor(() => expect(state.order.value?.id).toBe('b'))
})
it('does not let a late mutation replace another order or trigger its reload', async () => {
    await mount()
    const old = deferred()
    api.adminSetPayment.mockReturnValueOnce(old.promise)
    const action = state.transition({ axis: 'payment', to: 'paid' })
    api.get.mockResolvedValueOnce({ ...original, id: 'b', orderNumber: 'B' })
    await mounted.router.push('/admin/orders/b')
    await vi.waitFor(() => expect(state.order.value?.id).toBe('b'))
    old.resolve(original)
    await action
    expect(state.order.value.id).toBe('b')
    expect(api.get).toHaveBeenCalledTimes(2)
    expect(state.mutating.value).toBe(false)
})
it.each(['abort', 'error'])('resumes loading after an %s during leave', async (kind) => {
    await mount()
    const stopError = mounted.router.onError(() => {})
    const stop = mounted.router.beforeResolve((to) => {
        if (to.name === 'AdminUsers') {
            if (kind === 'error') throw new Error('Import failed')
            return false
        }
    })
    await mounted.router.push('/admin/users').catch(() => {})
    stop()
    stopError()
    await vi.waitFor(() => expect(api.get).toHaveBeenCalledTimes(2))
    await state.reload()
    expect(api.get).toHaveBeenCalledTimes(3)
})
it('ignores a GET resolved after disposal', async () => {
    await mount()
    const late = deferred()
    api.get.mockReturnValueOnce(late.promise)
    const reload = state.reload()
    await mounted.router.push('/admin/users')
    late.resolve({ ...original, orderNumber: 'Late' })
    await reload
    await nextTick()
    expect(mounted.root.textContent).not.toContain('Late')
})
it('keeps a pending write locked through an aborted leave and refreshes after it commits', async () => {
    await mount()
    const pending = deferred()
    api.adminSetPayment.mockReturnValueOnce(pending.promise)
    const action = state.transition({ axis: 'payment', to: 'paid' })
    const stop = mounted.router.beforeResolve((to) => (to.name === 'AdminUsers' ? false : undefined))
    await mounted.router.push('/admin/users')
    stop()
    expect(state.mutating.value).toBe(true)
    await state.transition({ axis: 'payment', to: 'paid' })
    expect(api.adminSetPayment).toHaveBeenCalledTimes(1)
    pending.resolve({})
    await action
    expect(api.get).toHaveBeenCalledTimes(3)
    expect(state.mutating.value).toBe(false)
})
