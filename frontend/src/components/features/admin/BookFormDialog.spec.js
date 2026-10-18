import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const books = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }))
const authors = vi.hoisted(() => ({ fetchAll: vi.fn() }))
vi.mock('@/services/api/booksApi', () => ({ booksApi: books }))
vi.mock('@/services/api/authorsApi', () => ({ authorsApi: authors }))

import { activateLocale, i18n, loadLocale } from '@/i18n'
import en from '@/i18n/locales/en.json'
import cs from '@/i18n/locales/cs.json'
import BookFormDialog from './BookFormDialog.vue'

const dictionaries = { cs, en }
const fill = (text, values) => Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), text)

// GET /authors as it answers before the authors contract: raw documents with _id
const AUTHORS = {
    success: true,
    data: [
        { _id: 'a1', firstName: 'Karel', lastName: 'Čapek' },
        { _id: 'a2', firstName: 'Božena', lastName: 'Němcová' },
    ],
    pagination: { page: 1, limit: 100, total: 2, pages: 1 },
}
const BOOK = {
    id: 'b1',
    title: 'Krakatit',
    author: { id: 'a1', firstName: 'Karel', lastName: 'Čapek' },
    publicationYear: 1924,
    category: 'Fiction',
    description: 'Román',
    price: 249.9,
    image: 'https://example.com/krakatit.jpg',
    inStock: false,
}

function deferred() {
    let resolve
    let reject
    const promise = new Promise((res, rej) => {
        resolve = res
        reject = rej
    })
    return { promise, resolve, reject }
}

let app
let open
let events
let words

beforeEach(() => {
    vi.stubGlobal('fetch', async (url) => new Response(JSON.stringify(String(url).includes('/en.json') ? en : cs)))
    books.create.mockReset()
    books.update.mockReset()
    authors.fetchAll.mockReset()
    authors.fetchAll.mockResolvedValue(AUTHORS)
    events = []
})

afterEach(() => {
    app?.unmount()
    app = undefined
    document.body.replaceChildren()
    vi.unstubAllGlobals()
})

// The dialog in a screen with the button that opens it
async function mount({ book = null, locale = 'cs' } = {}) {
    await loadLocale(locale)
    activateLocale(locale)
    words = dictionaries[locale]
    open = ref(false)
    const Screen = {
        render: () => [
            h('button', { class: 'opener', onClick: () => (open.value = true) }, 'Open'),
            h(BookFormDialog, {
                modelValue: open.value,
                book,
                'onUpdate:modelValue': (value) => {
                    events.push(['open', value])
                    open.value = value
                },
                onSaved: (saved, created) => events.push(['saved', saved, created]),
            }),
        ],
    }
    const root = document.createElement('div')
    document.body.append(root)
    app = createApp({ render: () => h(components.VApp, null, { default: () => h(Screen) }) })
        .use(i18n)
        .use(createVuetify({ components, directives }))
    app.mount(root)
    const opener = document.querySelector('.opener')
    opener.focus()
    opener.click()
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"] form')).not.toBeNull())
    await vi.waitFor(() => expect(authors.fetchAll).toHaveBeenCalled())
    await nextTick()
}

const dialog = () => document.querySelector('[role="dialog"]')
// The input of a field by its visible label
const input = (label) => {
    const element = [...dialog().querySelectorAll('label')].find((l) => l.textContent.trim() === label)
    return document.getElementById(element.htmlFor)
}
const type = async (label, value) => {
    const element = input(label)
    element.value = value
    element.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
}
// The summary on top of the form (a field's hint has role=alert too, so the alert is found by its component)
const summaryOf = () => dialog().querySelector('.v-alert')
const button = (text) => [...dialog().querySelectorAll('button')].find((b) => b.textContent.trim() === text)
// Opens a select or an autocomplete and picks the option with this text
const choose = async (label, option) => {
    input(label)
        .closest('.v-field')
        .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await vi.waitFor(() =>
        expect([...document.querySelectorAll('.v-list-item')].some((i) => i.textContent.includes(option))).toBe(true)
    )
    ;[...document.querySelectorAll('.v-list-item')].find((i) => i.textContent.includes(option)).click()
    await nextTick()
}
const options = async (label) => {
    input(label)
        .closest('.v-field')
        .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await vi.waitFor(() => expect(document.querySelectorAll('.v-list-item').length).toBeGreaterThan(0))
    return [...document.querySelectorAll('.v-list-item')].map((item) => item.textContent.trim())
}
const save = async () => {
    button(words.admin.form.save).click()
    await nextTick()
}

describe.each(['cs', 'en'])('BookFormDialog (%s)', (locale) => {
    it('opens as a named dialog with the book fields and no ISBN or quantity', async () => {
        await mount({ locale })

        const name = document.getElementById(dialog().getAttribute('aria-labelledby'))
        expect(name.textContent.trim()).toBe(words.admin.bookForm.createTitle)
        for (const key of ['title', 'author', 'year', 'category', 'description', 'image']) {
            expect(input(words.admin.bookForm[key]), key).toBeInstanceOf(HTMLElement)
        }
        expect(input(fill(words.common.priceLabel, { currency: 'CZK' }))).toBeInstanceOf(HTMLElement)
        expect(dialog().textContent).toContain(words.admin.bookForm.inStock)
        expect(dialog().textContent).not.toMatch(/ISBN|quantity|množství|počet/i)
    })

    it('names every field by its label, the category select included', async () => {
        await mount({ locale })

        for (const key of ['title', 'author', 'year', 'category', 'description', 'image']) {
            const label = words.admin.bookForm[key]
            expect([null, label], key).toContain(input(label).getAttribute('aria-label'))
        }
    })
})

describe('BookFormDialog', () => {
    it('lists the authors by last name', async () => {
        await mount()

        expect(authors.fetchAll).toHaveBeenCalledWith({ limit: 100, sortBy: 'lastName' })
        expect(await options(cs.admin.bookForm.author)).toEqual(['Čapek, Karel', 'Němcová, Božena'])
    })

    it('fills the fields of the book it edits', async () => {
        await mount({ book: BOOK })

        const name = document.getElementById(dialog().getAttribute('aria-labelledby'))
        expect(name.textContent.trim()).toBe(cs.admin.bookForm.editTitle)
        expect(input(cs.admin.bookForm.title).value).toBe('Krakatit')
        expect(input(fill(cs.common.priceLabel, { currency: 'CZK' })).value).toBe('249.9')
        expect(input(cs.admin.bookForm.year).value).toBe('1924')
        await vi.waitFor(() => expect(dialog().textContent).toContain('Čapek, Karel'))
    })

    it('checks the fields before it sends anything', async () => {
        await mount()

        await save()

        expect(books.create).not.toHaveBeenCalled()
        expect(dialog().textContent).toContain(cs.admin.form.errors.required)
        const summary = summaryOf()
        expect(summary.textContent).toContain(cs.admin.form.summary)
        await vi.waitFor(() => expect(summary.contains(document.activeElement)).toBe(true))

        await type(fill(cs.common.priceLabel, { currency: 'CZK' }), '10.005')
        await type(cs.admin.bookForm.image, 'http://example.com/a.jpg')
        await save()

        expect(dialog().textContent).toContain(cs.admin.form.errors.price)
        expect(dialog().textContent).toContain(cs.admin.form.errors.image)
        expect(books.create).not.toHaveBeenCalled()
    })

    it('creates a book and reports it', async () => {
        const created = { ...BOOK, id: 'b9', inStock: true }
        books.create.mockResolvedValue({ success: true, data: created })
        await mount()

        await type(cs.admin.bookForm.title, ' Krakatit ')
        await choose(cs.admin.bookForm.author, 'Čapek, Karel')
        await type(cs.admin.bookForm.year, '1924')
        await choose(cs.admin.bookForm.category, 'Fiction')
        await type(fill(cs.common.priceLabel, { currency: 'CZK' }), '249.90')
        await save()

        await vi.waitFor(() => expect(events).toContainEqual(['saved', created, true]))
        expect(books.create).toHaveBeenCalledWith({
            title: 'Krakatit',
            authorId: 'a1',
            publicationYear: 1924,
            category: 'Fiction',
            price: 249.9,
            inStock: true,
        })
        expect(events).toContainEqual(['open', false])
    })

    it('saves an edited book through its id', async () => {
        books.update.mockResolvedValue({ success: true, data: { ...BOOK, price: 199.9 } })
        await mount({ book: BOOK })
        await vi.waitFor(() => expect(dialog().textContent).toContain('Čapek, Karel'))

        await type(fill(cs.common.priceLabel, { currency: 'CZK' }), '199.9')
        await save()

        await vi.waitFor(() => expect(books.update).toHaveBeenCalledTimes(1))
        expect(books.update).toHaveBeenCalledWith('b1', {
            title: 'Krakatit',
            authorId: 'a1',
            publicationYear: 1924,
            category: 'Fiction',
            description: 'Román',
            price: 199.9,
            image: 'https://example.com/krakatit.jpg',
            inStock: false,
        })
        await vi.waitFor(() => expect(events).toContainEqual(['saved', { ...BOOK, price: 199.9 }, false]))
    })

    it.each([
        [{ status: 409, code: 'CONFLICT', fields: { title: 'duplicate' } }, cs.admin.form.errors.duplicateBook],
        [
            { status: 400, code: 'VALIDATION_FAILED', fields: { authorId: 'not_found' } },
            cs.admin.form.errors.authorNotFound,
        ],
        [
            { status: 400, code: 'VALIDATION_FAILED', fields: { title: 'too_small' } },
            fill(cs.admin.form.errors.length, { min: 2, max: 100 }),
        ],
    ])('shows the server answer %j at its field', async (failure, message) => {
        books.update.mockRejectedValue(failure)
        await mount({ book: BOOK })
        await vi.waitFor(() => expect(dialog().textContent).toContain('Čapek, Karel'))

        await save()

        await vi.waitFor(() => expect(dialog().textContent).toContain(message))
        expect(summaryOf().textContent).toContain(cs.admin.form.summary)
    })

    it('keeps the dialog and the entered values after a failed save and sends once', async () => {
        const answer = deferred()
        books.update.mockReturnValue(answer.promise)
        await mount({ book: BOOK })
        await vi.waitFor(() => expect(dialog().textContent).toContain('Čapek, Karel'))

        await save()
        await save()
        answer.reject({ code: 'NETWORK_ERROR', message: 'Network connection error.' })
        await vi.waitFor(() => expect(summaryOf()).not.toBeNull())

        expect(books.update).toHaveBeenCalledTimes(1)
        expect(summaryOf().textContent).toContain(cs.errors.UNKNOWN)
        expect(input(cs.admin.bookForm.title).value).toBe('Krakatit')
        expect(button(cs.admin.form.save).disabled).toBe(false)
        expect(events.filter(([name]) => name === 'saved')).toEqual([])
    })

    it('tells when the authors cannot be loaded', async () => {
        authors.fetchAll.mockRejectedValue({ code: 'INTERNAL' })
        await mount()

        await vi.waitFor(() => expect(dialog().textContent).toContain(cs.admin.bookForm.authorsError))
        expect(button(cs.admin.form.save).disabled).toBe(true)
    })

    it('returns focus to the button that opened it', async () => {
        await mount()

        button(cs.modal.cancel).click()

        await vi.waitFor(() => expect(document.activeElement).toBe(document.querySelector('.opener')))
        expect(events).toContainEqual(['open', false])
    })
})
