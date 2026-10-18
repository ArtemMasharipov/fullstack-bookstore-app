import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import { activateLocale, i18n, loadLocale } from '@/i18n'
import en from '@/i18n/locales/en.json'
import cs from '@/i18n/locales/cs.json'
import ConfirmModal from './ConfirmModal.vue'
import BaseModal from './BaseModal.vue'
import FooterLayout from '@/components/layout/FooterLayout.vue'
import { createMemoryHistory, createRouter } from 'vue-router'

let app
beforeEach(async () => {
    vi.stubGlobal('fetch', async (url) => new Response(JSON.stringify(String(url).includes('/en.json') ? en : cs)))
    await loadLocale('cs')
    await loadLocale('en')
    activateLocale('cs')
})
afterEach(() => {
    app?.unmount()
    document.body.replaceChildren()
    vi.unstubAllGlobals()
})
async function mount(component, props, router) {
    const root = document.createElement('div')
    document.body.append(root)
    app = createApp({
        render: () => h(components.VApp, null, { default: () => h(component, { modelValue: true, ...props }) }),
    })
        .use(i18n)
        .use(createVuetify({ components }))
    if (router) app.use(router)
    app.mount(root)
    await nextTick()
}
const buttons = () => [...document.querySelectorAll('button')]
const button = (text) => buttons().find((element) => element.textContent.trim() === text)

describe('localized modal defaults', () => {
    it('updates the default title and both actions when the active locale changes', async () => {
        await mount(ConfirmModal, { message: 'Caller message' })
        expect(document.querySelector('.v-card-title').textContent).toContain('Potvrdit akci')
        expect(button('Potvrdit')).toBeDefined()
        expect(button('Zru\u0161it')).toBeDefined()
        activateLocale('en')
        await nextTick()
        expect(document.querySelector('.v-card-title').textContent).toContain('Confirm action')
        expect(button('Confirm')).toBeDefined()
        expect(button('Cancel')).toBeDefined()
        expect(document.body.textContent).toContain('Caller message')
    })
    it('names the dialog by its title', async () => {
        await mount(ConfirmModal, { title: 'Delete this book?', message: 'Caller message' })

        const dialog = document.querySelector('[role="dialog"]')
        const name = document.getElementById(dialog.getAttribute('aria-labelledby'))
        expect(name.textContent.trim()).toBe('Delete this book?')
    })
    it('preserves caller copy and confirm/cancel/model events after a locale change', async () => {
        const events = []
        await mount(ConfirmModal, {
            title: 'Custom title',
            message: 'Custom message',
            confirmText: 'Proceed',
            cancelText: 'Leave',
            onConfirm: () => events.push('confirm'),
            onCancel: () => events.push('cancel'),
            'onUpdate:modelValue': (value) => events.push(value),
        })
        activateLocale('en')
        await nextTick()
        expect(document.querySelector('.v-card-title').textContent).toContain('Custom title')
        expect(document.body.textContent).toContain('Custom message')
        button('Proceed').click()
        button('Leave').click()
        expect(events).toEqual(['confirm', false, 'cancel', false])
    })
    it('keeps an absent BaseModal header absent and localizes the close action for caller titles', async () => {
        await mount(BaseModal, {})
        expect(document.querySelector('.v-card-title')).toBeNull()
        app.unmount()
        let closed = 0
        await mount(BaseModal, { title: 'Caller title', onClose: () => closed++ })
        expect(document.querySelector('button[aria-label="Zav\u0159\u00edt dialog"]')).not.toBeNull()
        activateLocale('en')
        await nextTick()
        expect(document.querySelector('.v-card-title').textContent).toContain('Caller title')
        document.querySelector('button[aria-label="Close dialog"]').click()
        expect(closed).toBe(1)
    })
})

it('updates the footer copy in place on locale activation', async () => {
    const names = [
        'Home',
        'Books',
        'Authors',
        'Orders',
        'Cart',
        'Profile',
        'AdminDashboard',
        'AdminBooks',
        'AdminAuthors',
        'AdminOrders',
        'AdminUsers',
    ]
    const router = createRouter({
        history: createMemoryHistory(),
        routes: names.map((name) => ({ name, path: '/' + name, component: { render: () => null } })),
    })
    await router.push('/Home')
    await mount({ render: () => h('div', [h(FooterLayout)]) }, {}, router)
    expect(document.body.textContent).toContain('O nás')
    expect(document.body.textContent).toContain('Všechna práva vyhrazena.')
    activateLocale('en')
    await nextTick()
    expect(document.body.textContent).toContain('Discover your next great read at Bookstore')
    expect(document.body.textContent).toContain('All rights reserved.')
    expect(document.body.textContent).not.toContain('Bookstore App')
})
