import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { button, deferred, input, mountAdmin, type } from '@/test/admin'
import { useAuthStore } from '@/stores/auth'
const api = vi.hoisted(() => ({ getCurrentUser: vi.fn(), updateProfile: vi.fn(), logoutAll: vi.fn() }))
vi.mock('@/services/api/authService', () => ({ authApi: api }))
import ProfileView from './ProfileView.vue'

const USER = {
    id: 'a'.repeat(24),
    username: 'reader',
    email: 'reader@example.com',
    firstName: 'Jan',
    lastName: null,
    role: 'user',
    isActive: true,
    lastLogin: null,
    createdAt: null,
}
let mounted
beforeEach(() => {
    localStorage.setItem('token', 'original')
    Object.values(api).forEach((fn) => fn.mockReset())
    api.getCurrentUser.mockResolvedValue({ data: USER })
    api.updateProfile.mockResolvedValue({ data: { ...USER, firstName: 'Jana' } })
})
afterEach(() => {
    mounted?.cleanup()
    mounted = null
    localStorage.clear()
})
async function mount(locale = 'en') {
    mounted = await mountAdmin(ProfileView, {
        routeName: 'Profile',
        path: locale === 'en' ? '/en/profile' : '/profile',
        locale,
    })
}
const save = () => button(mounted.words.profile.save)
describe('profile', () => {
    it('loads authoritative details, can retry, and has one heading', async () => {
        const pending = deferred()
        api.getCurrentUser.mockReturnValueOnce(pending.promise).mockRejectedValueOnce(new Error('offline'))
        await mount()
        expect(api.getCurrentUser).toHaveBeenCalledTimes(1)
        expect(document.querySelector('[role="progressbar"]')).toBeTruthy()
        pending.reject(new Error('offline'))
        await vi.waitFor(() => expect(button(mounted.words.errors.retry)).toBeTruthy())
        button(mounted.words.errors.retry).click()
        await vi.waitFor(() => expect(api.getCurrentUser).toHaveBeenCalledTimes(2))
        await vi.waitFor(() => expect(button(mounted.words.errors.retry).disabled).toBe(false))
        button(mounted.words.errors.retry).click()
        await vi.waitFor(() => expect(input(mounted.words.profile.firstName)?.value).toBe('Jan'))
        expect(document.querySelectorAll('h1')).toHaveLength(1)
    })
    it.each(['cs', 'en'])('edits only profile fields and keeps localized orders link (%s)', async (locale) => {
        await mount(locale)
        await vi.waitFor(() => expect(input(mounted.words.profile.firstName)?.value).toBe('Jan'))
        const first = input(mounted.words.profile.firstName)
        expect(first.autocomplete).toBe('given-name')
        expect(input(mounted.words.profile.lastName).autocomplete).toBe('family-name')
        expect(input(mounted.words.profile.username).autocomplete).toBe('username')
        expect(document.querySelector('input[type="email"]')).toBeNull()
        expect(document.body.textContent).toContain(USER.email)
        expect(save().disabled).toBe(true)
        await type(first, 'Jana')
        expect(save().disabled).toBe(false)
        document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }))
        await vi.waitFor(() => expect(api.updateProfile).toHaveBeenCalledWith({ firstName: 'Jana' }, 'original'))
        await vi.waitFor(() => expect(save().disabled).toBe(true))
        const orders = [...document.querySelectorAll('a')].find((a) =>
            a.textContent.includes(mounted.words.profile.orders)
        )
        expect(orders?.getAttribute('href')).toBe(locale === 'en' ? '/en/orders' : '/orders')
        expect(document.querySelector('input[type="tel"]')).toBeNull()
        expect(document.body.textContent).not.toMatch(/Change photo|Delete Account/)
    })
    it('keeps edits after failure and blocks other account actions while pending', async () => {
        const pending = deferred()
        api.updateProfile.mockReturnValueOnce(pending.promise)
        await mount()
        await vi.waitFor(() => expect(input(mounted.words.profile.firstName)?.value).toBe('Jan'))
        await type(input(mounted.words.profile.firstName), 'Draft')
        document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }))
        await nextTick()
        expect(button(mounted.words.profile.changePassword).disabled).toBe(true)
        expect(button(mounted.words.profile.logoutAll).disabled).toBe(true)
        pending.reject({ status: 400, code: 'VALIDATION_FAILED', fields: { firstName: 'too_big' } })
        await vi.waitFor(() => expect(document.activeElement?.getAttribute('role')).toBe('alert'))
        expect(input(mounted.words.profile.firstName).value).toBe('Draft')
        expect(input(mounted.words.profile.firstName).getAttribute('aria-invalid')).toBe('true')
    })

    it.each([
        ['cs', true],
        ['en', true],
        ['cs', false],
        ['en', false],
    ])('loads a reopened profile after pending save settles (%s, success=%s)', async (locale, success) => {
        const saving = deferred()
        const reading = deferred()
        api.updateProfile.mockReturnValueOnce(saving.promise)
        api.getCurrentUser.mockResolvedValueOnce({ data: USER }).mockReturnValueOnce(reading.promise)
        await mount(locale)
        await vi.waitFor(() => expect(input(mounted.words.profile.firstName)?.value).toBe('Jan'))
        const store = useAuthStore()
        await type(input(mounted.words.profile.firstName), 'Jana')
        save().click()
        await vi.waitFor(() => expect(api.updateProfile).toHaveBeenCalledTimes(1))
        const prefix = locale === 'en' ? '/en' : ''
        await mounted.router.push(prefix + '/orders')
        await nextTick()
        expect(input(mounted.words.profile.firstName)).toBeNull()
        await mounted.router.push(prefix + '/profile')
        await nextTick()
        expect(useAuthStore()).toBe(store)
        const latest = success ? { ...USER, firstName: 'Jana' } : USER
        if (success) saving.resolve({ data: latest })
        else saving.reject(new Error('offline'))
        await vi.waitFor(() => expect(store.accountBusy).toBe(false))
        reading.resolve({ data: latest })
        await vi.waitFor(() => expect(input(mounted.words.profile.firstName)?.value).toBe(latest.firstName))
        expect(button(mounted.words.profile.logoutAll)).toBeTruthy()
        expect(button(mounted.words.errors.retry)).toBeUndefined()
        await type(input(mounted.words.profile.firstName), 'Unsaved draft')
        store.user = { ...latest, firstName: 'Background update' }
        await nextTick()
        expect(input(mounted.words.profile.firstName).value).toBe('Unsaved draft')
    })

    it('offers retry if an initial read is invalidated instead of showing a blank page', async () => {
        const pending = deferred()
        api.getCurrentUser.mockReturnValueOnce(pending.promise)
        await mount()
        const store = useAuthStore()
        store.clearAuth()
        pending.resolve({ data: USER })
        await vi.waitFor(() => expect(button(mounted.words.errors.retry)).toBeTruthy())
        expect(document.querySelector('[role="progressbar"]')).toBeNull()
        localStorage.setItem('token', 'fresh')
        store.token = 'fresh'
        button(mounted.words.errors.retry).click()
        await vi.waitFor(() => expect(input(mounted.words.profile.firstName)?.value).toBe('Jan'))
    })
})
