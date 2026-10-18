import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, reactive } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { activateLocale, i18n, loadLocale } from '@/i18n'
import en from '@/i18n/locales/en.json'
import cs from '@/i18n/locales/cs.json'
import AdminTable from './AdminTable.vue'

const HEADERS = [
    { title: 'Název', key: 'title', sortable: true },
    { title: 'Cena', key: 'price', sortable: true },
    { title: 'Akce', key: 'actions', sortable: false },
]
const rows = (count) =>
    Array.from({ length: count }, (_, i) => ({ id: `b${i + 1}`, title: `Kniha ${i + 1}`, price: 100 + i }))

let app
let state
let events

beforeEach(async () => {
    vi.stubGlobal('fetch', async (url) => new Response(JSON.stringify(String(url).includes('/en.json') ? en : cs)))
    await loadLocale('cs')
    activateLocale('cs')
    events = []
    state = reactive({
        items: rows(10),
        itemsLength: 25,
        loading: false,
        error: null,
        page: 1,
        limit: 10,
        sortBy: '-createdAt',
        emptyText: 'Zatím tu nic není.',
        filtered: false,
    })
})

afterEach(() => {
    app?.unmount()
    app = undefined
    document.body.replaceChildren()
    vi.unstubAllGlobals()
})

// The table in a screen that applies what it emits, as a screen with the address would
async function mount() {
    const Screen = {
        render: () =>
            h(
                AdminTable,
                {
                    headers: HEADERS,
                    ...state,
                    'onUpdate:sortBy': (sortBy) => {
                        events.push(['sortBy', sortBy])
                        state.sortBy = sortBy ?? '-createdAt'
                    },
                    'onUpdate:page': (page) => events.push(['page', page]),
                    'onUpdate:limit': (limit) => events.push(['limit', limit]),
                    onRetry: () => events.push(['retry']),
                    onResetFilters: () => events.push(['resetFilters']),
                },
                { 'empty-action': () => h('button', { class: 'add-book' }, 'Přidat knihu') }
            ),
    }
    const root = document.createElement('div')
    document.body.append(root)
    app = createApp({ render: () => h(components.VApp, null, { default: () => h(Screen) }) })
        .use(i18n)
        .use(createVuetify({ components, directives }))
    app.mount(root)
    await nextTick()
}

const header = (text) => [...document.querySelectorAll('th')].find((th) => th.textContent.includes(text))
const button = (text) => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === text)

describe('AdminTable', () => {
    it('shows the rows it is given and the total', async () => {
        await mount()

        expect(document.querySelectorAll('tbody tr')).toHaveLength(10)
        expect(document.querySelector('tbody').textContent).toContain('Kniha 1')
        expect(document.querySelector('.v-data-table-footer').textContent).toContain('25')
    })

    it('emits the API sort key: ascending, descending, then none', async () => {
        await mount()

        header('Cena').click()
        await nextTick()
        header('Cena').click()
        await nextTick()
        header('Cena').click()
        await nextTick()

        expect(events.filter(([name]) => name === 'sortBy')).toEqual([
            ['sortBy', 'price'],
            ['sortBy', '-price'],
            ['sortBy', null],
        ])
    })

    it('shows the error with a retry button', async () => {
        state.error = { code: 'INTERNAL' }
        state.items = []
        state.itemsLength = 0
        await mount()

        const alert = document.querySelector('[role="alert"]')
        expect(alert.textContent).toContain(cs.admin.table.loadError)
        expect(document.body.textContent).not.toContain(state.emptyText)
        alert.querySelector('button').click()
        expect(events).toEqual([['retry']])
    })

    it('shows why the table is empty and what to do', async () => {
        state.items = []
        state.itemsLength = 0
        await mount()

        expect(document.body.textContent).toContain('Zatím tu nic není.')
        expect(document.querySelector('.add-book')).not.toBeNull()
        expect(button(cs.catalog.resetFilters)).toBeUndefined()
    })

    it('offers to reset the filters when they leave nothing', async () => {
        state.items = []
        state.itemsLength = 0
        state.filtered = true
        await mount()

        expect(document.querySelector('.add-book')).toBeNull()
        button(cs.catalog.resetFilters).click()
        expect(events).toEqual([['resetFilters']])
    })

    it('names the rows-per-page select by the text next to it', async () => {
        await mount()

        const select = document.querySelector('.v-data-table-footer input')
        const text = document.querySelector('.v-data-table-footer__items-per-page > span').textContent.trim()
        expect(select.getAttribute('aria-label')).toBe(text)
    })

    it('offers 10, 20 and 50 rows per page', async () => {
        await mount()

        const field = document.querySelector('.v-data-table-footer .v-field')
        field.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
        await vi.waitFor(() => expect(document.querySelectorAll('.v-overlay__content .v-list-item')).toHaveLength(3))

        expect(
            [...document.querySelectorAll('.v-overlay__content .v-list-item')].map((item) => item.textContent.trim())
        ).toEqual(['10', '20', '50'])
    })
})
