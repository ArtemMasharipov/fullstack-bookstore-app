import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
const authors = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }))
vi.mock('@/services/api/authorsApi', () => ({ authorsApi: authors }))
import AuthorFormDialog from './AuthorFormDialog.vue'
import { activateLocale, i18n, loadLocale } from '@/i18n'
import cs from '@/i18n/locales/cs.json'
import en from '@/i18n/locales/en.json'

const AUTHOR = {
    id: 'a1',
    firstName: 'Karel',
    lastName: 'Čapek',
    bio: 'Biography',
    birthYear: 1890,
    country: 'CZ',
    website: 'https://example.com',
    booksCount: 0,
}
let app, open, selected, events, words
beforeEach(() => {
    vi.stubGlobal('fetch', async (url) => new Response(JSON.stringify(String(url).includes('/en.json') ? en : cs)))
    authors.create.mockReset()
    authors.update.mockReset()
    events = []
})
afterEach(() => {
    app?.unmount()
    app = undefined
    document.body.replaceChildren()
    vi.unstubAllGlobals()
    vi.useRealTimers()
})
async function mount({ author = null, locale = 'cs' } = {}) {
    await loadLocale(locale)
    activateLocale(locale)
    words = { cs, en }[locale]
    open = ref(false)
    selected = ref(author)
    const root = document.createElement('div')
    document.body.append(root)
    app = createApp({
        render: () =>
            h(components.VApp, null, {
                default: () => [
                    h(
                        'button',
                        {
                            class: 'opener',
                            onClick: () => {
                                open.value = true
                            },
                        },
                        'Open'
                    ),
                    h(AuthorFormDialog, {
                        modelValue: open.value,
                        author: selected.value,
                        'onUpdate:modelValue': (value) => {
                            open.value = value
                        },
                        onSaved: (saved, created) => events.push(['saved', saved, created]),
                    }),
                ],
            }),
    })
        .use(i18n)
        .use(createVuetify({ components, directives }))
    app.mount(root)
    const opener = root.querySelector('.opener')
    opener.focus()
    opener.click()
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"] form')).not.toBeNull())
}
const dialog = () => document.querySelector('[role="dialog"]')
const input = (field) => {
    const label = [...dialog().querySelectorAll('label')].find(
        (el) => el.textContent.trim() === words.admin.authorForm[field]
    )
    return document.getElementById(label.htmlFor)
}
const type = async (field, value) => {
    const el = input(field)
    el.value = value
    el.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
}
const button = (text) => [...dialog().querySelectorAll('button')].find((el) => el.textContent.trim() === text)
const submit = async () => {
    dialog()
        .querySelector('form')
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await nextTick()
}
const summary = () => dialog().querySelector('.v-alert')
const deferred = () => {
    let resolve, reject
    const promise = new Promise((yes, no) => {
        resolve = yes
        reject = no
    })
    return { promise, resolve, reject }
}

describe.each(['cs', 'en'])('AuthorFormDialog (%s)', (locale) => {
    it('names the dialog and all six model fields', async () => {
        await mount({ locale })
        expect(document.getElementById(dialog().getAttribute('aria-labelledby')).textContent.trim()).toBe(
            words.admin.authorForm.createTitle
        )
        for (const field of ['firstName', 'lastName', 'bio', 'birthYear', 'country', 'website'])
            expect(input(field)).toBeInstanceOf(HTMLElement)
        expect(dialog().textContent).not.toMatch(/photo|fotografie/i)
    })
    it('creates a trimmed numeric payload and emits the saved view once', async () => {
        authors.create.mockResolvedValue({ success: true, data: { ...AUTHOR, firstName: 'Jane', lastName: 'Writer' } })
        await mount({ locale })
        await type('firstName', ' Jane ')
        await type('lastName', ' Writer ')
        await type('bio', ' Biography ')
        await type('birthYear', '1900')
        await type('country', ' CZ ')
        await type('website', 'http://example.com')
        await submit()
        await vi.waitFor(() => expect(events).toHaveLength(1))
        expect(authors.create).toHaveBeenCalledWith({
            firstName: 'Jane',
            lastName: 'Writer',
            bio: 'Biography',
            birthYear: 1900,
            country: 'CZ',
            website: 'http://example.com',
        })
        expect(events[0]).toEqual(['saved', { ...AUTHOR, firstName: 'Jane', lastName: 'Writer' }, true])
        expect(open.value).toBe(false)
    })
    it('replaces through the id and omits cleared optional fields', async () => {
        authors.update.mockResolvedValue({ success: true, data: AUTHOR })
        await mount({ author: AUTHOR, locale })
        for (const field of ['bio', 'birthYear', 'country', 'website']) await type(field, '')
        await submit()
        await vi.waitFor(() => expect(events).toHaveLength(1))
        expect(authors.update).toHaveBeenCalledWith('a1', { firstName: 'Karel', lastName: 'Čapek' })
        expect(events[0]).toEqual(['saved', AUTHOR, false])
    })
    it('keeps a duplicate error at the field with a focused summary and preserves input', async () => {
        authors.update.mockRejectedValueOnce({
            code: 'CONFLICT',
            fields: { lastName: 'duplicate' },
            message: 'PRIVATE_SERVER_TEXT',
        })
        await mount({ author: AUTHOR, locale })
        await submit()
        await vi.waitFor(() => expect(summary()?.textContent).toContain(words.admin.form.summary))
        expect(input('lastName').getAttribute('aria-invalid')).toBe('true')
        expect(dialog().textContent).toContain(words.admin.form.errors.duplicateAuthor)
        expect(document.activeElement).toBe(summary())
        expect(input('bio').value).toBe('Biography')
        expect(dialog().textContent).not.toContain('PRIVATE_SERVER_TEXT')
        expect(events).toEqual([])
        authors.update.mockResolvedValue({ success: true, data: { ...AUTHOR, lastName: 'Other' } })
        await type('lastName', 'Other')
        await submit()
        await vi.waitFor(() => expect(open.value).toBe(false))
    })
})

describe('author form validation and lifecycle', () => {
    it.each([
        ['firstName', 'A'],
        ['lastName', 'x'.repeat(51)],
        ['bio', 'x'.repeat(2001)],
        ['country', 'x'.repeat(101)],
        ['birthYear', '999'],
        ['birthYear', '2032'],
        ['birthYear', '1000.5'],
        ['website', 'javascript:alert(1)'],
        ['website', 'not a URL'],
        ['website', 'https://example.com/' + 'a'.repeat(2030)],
    ])('refuses invalid %s without sending', async (field, value) => {
        vi.useFakeTimers({ toFake: ['Date'] })
        vi.setSystemTime(new Date(2031, 0, 1))
        await mount({ author: AUTHOR })
        await type(field, value)
        await submit()
        await vi.waitFor(() => expect(summary()).not.toBeNull())
        expect(input(field).getAttribute('aria-invalid')).toBe('true')
        expect(input(field).getAttribute('aria-describedby')).toBeTruthy()
        expect(authors.update).not.toHaveBeenCalled()
    })
    it('uses the current year when saving rather than a cached bound', async () => {
        await mount({ author: AUTHOR })
        vi.useFakeTimers({ toFake: ['Date'] })
        vi.setSystemTime(new Date(2031, 0, 1))
        authors.update.mockResolvedValue({ success: true, data: { ...AUTHOR, birthYear: 2031 } })
        await type('birthYear', '2031')
        await submit()
        await vi.waitFor(() =>
            expect(authors.update).toHaveBeenCalledWith('a1', expect.objectContaining({ birthYear: 2031 }))
        )
    })
    it('shows a server year error without closing or discarding the values', async () => {
        authors.update.mockRejectedValue({ fields: { birthYear: 'too_big' }, code: 'VALIDATION_FAILED' })
        await mount({ author: AUTHOR })
        await submit()
        await vi.waitFor(() => expect(input('birthYear').getAttribute('aria-invalid')).toBe('true'))
        expect(open.value).toBe(true)
        expect(input('birthYear').value).toBe('1890')
    })
    it('sends once while pending and keeps input on a general failure', async () => {
        const pending = deferred()
        authors.update.mockReturnValue(pending.promise)
        await mount({ author: AUTHOR })
        await submit()
        await submit()
        expect(authors.update).toHaveBeenCalledTimes(1)
        pending.reject({ code: 'INTERNAL', message: 'PRIVATE_SERVER_TEXT' })
        await vi.waitFor(() => expect(summary()?.textContent).toContain(cs.errors.INTERNAL))
        expect(input('firstName').value).toBe('Karel')
        expect(open.value).toBe(true)
    })
    it('does not show a late failure in a different opening', async () => {
        const pending = deferred()
        authors.update.mockReturnValue(pending.promise)
        await mount({ author: AUTHOR })
        await submit()
        button(cs.modal.cancel).click()
        await nextTick()
        selected.value = { ...AUTHOR, id: 'a2', firstName: 'Other' }
        open.value = true
        await nextTick()
        pending.reject({ fields: { lastName: 'duplicate' } })
        await new Promise((resolve) => setTimeout(resolve, 20))
        expect(input('firstName').value).toBe('Other')
        expect(summary()).toBeNull()
        expect(events).toEqual([])
    })
    it('returns focus after cancel', async () => {
        await mount()
        button(cs.modal.cancel).click()
        await vi.waitFor(() => expect(document.activeElement).toBe(document.querySelector('.opener')))
        expect(open.value).toBe(false)
    })
})
