import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import { activateLocale, i18n, loadLocale } from '@/i18n'
import en from '@/i18n/locales/en.json'
import cs from '@/i18n/locales/cs.json'
import { useNotifications } from '@/composables/useNotifications'
import NotificationContainer from './NotificationContainer.vue'

const notices = useNotifications()
let app
beforeEach(async () => {
    vi.stubGlobal('fetch', async (url) => new Response(JSON.stringify(String(url).includes('/en.json') ? en : cs)))
    await loadLocale('cs')
    await loadLocale('en')
    activateLocale('en')
    notices.clear()
})
afterEach(() => {
    notices.clear()
    app?.unmount()
    document.body.replaceChildren()
    vi.unstubAllGlobals()
})
describe('translated notification rendering', () => {
    it('updates open and queued message/action labels without injecting HTML and preserves actions', async () => {
        let actions = 0
        for (let i = 0; i < 5; i++)
            notices.show({
                message: 'private sentinel',
                messageKey: 'notifications.cartAdded',
                messageParams: { title: '<b>Book</b>' },
                persistent: true,
                html: true,
                actions: [
                    {
                        label: 'private sentinel',
                        labelKey: 'notifications.itemUpdated',
                        labelParams: { item: 'Book' },
                        handler: () => actions++,
                        keepOpen: true,
                    },
                ],
            })
        const queued = notices.show({
            messageKey: 'notifications.cartRemoved',
            messageParams: { title: 'Queued' },
            persistent: true,
        })
        const root = document.createElement('div')
        document.body.append(root)
        app = createApp({ render: () => h(components.VApp, {}, { default: () => h(NotificationContainer) }) })
            .use(i18n)
            .use(createVuetify({ components }))
        app.mount(root)
        await nextTick()
        await nextTick()
        expect(document.body.textContent).toContain('<b>Book</b>')
        expect(document.body.textContent).toContain('added to cart')
        expect(document.body.textContent).not.toContain('private sentinel')
        expect(document.body.querySelector('.notification-message b')).toBeNull()
        activateLocale('cs')
        await nextTick()
        expect(document.body.textContent).toContain('p\u0159id\u00e1na do ko\u0161\u00edku')
        expect(document.body.textContent).toContain('Book byl aktualizov\u00e1n')
        const action = [...document.body.querySelectorAll('button')].find((b) =>
            b.textContent.includes('Book byl aktualizov\u00e1n')
        )
        action.click()
        expect(actions).toBe(1)
        expect(notices.notifications.value).toHaveLength(5)
        notices.hide(notices.notifications.value[0].id)
        await nextTick()
        await nextTick()
        expect(notices.notifications.value.some((n) => n.id === queued)).toBe(true)
        expect(document.body.textContent).toContain('Queued')
        expect(document.body.textContent).toContain('odebr\u00e1na z ko\u0161\u00edku')
        activateLocale('en')
        await nextTick()
        expect(document.body.textContent).toContain('removed from cart')
    })
})

it.each([false, true])(
    'translates a real guest cart removal with a missing title at display time (queued: %s)',
    async (queued) => {
        const { createPinia, setActivePinia } = await import('pinia')
        const { useCartStore } = await import('@/stores/cart')
        setActivePinia(createPinia())
        localStorage.clear()
        const cart = useCartStore()
        cart.setItems([{ bookId: 'removed', quantity: 1, price: 299.9 }])
        if (queued) {
            for (let i = 0; i < 5; i++) notices.show({ message: 'Existing notice', persistent: true })
        }
        const root = document.createElement('div')
        document.body.append(root)
        app = createApp({ render: () => h(components.VApp, {}, { default: () => h(NotificationContainer) }) })
            .use(i18n)
            .use(createVuetify({ components }))
        app.mount(root)
        await nextTick()
        await cart.removeFromCart('removed')
        expect(cart.items).toEqual([])
        expect(JSON.parse(localStorage.getItem('cart'))).toEqual([])
        if (queued) {
            expect(document.body.textContent).not.toContain('removed from cart')
            activateLocale('cs')
            notices.hide(notices.notifications.value[0].id)
        }
        await nextTick()
        await nextTick()
        if (queued) expect(document.body.textContent).toContain('Polo\u017eka odebr\u00e1na z ko\u0161\u00edku')
        activateLocale('en')
        await nextTick()
        expect(document.body.textContent).toContain('Item removed from cart')
        expect(document.body.textContent).not.toContain('"Item"')
        activateLocale('cs')
        await nextTick()
        expect(document.body.textContent).toContain('Polo\u017eka odebr\u00e1na z ko\u0161\u00edku')
        expect(document.body.textContent).not.toContain('Item')
        notices.clear()
        await cart.removeFromCart('another', 'Provided title')
        await nextTick()
        expect(document.body.textContent).toContain('Provided title')
        localStorage.clear()
    }
)
