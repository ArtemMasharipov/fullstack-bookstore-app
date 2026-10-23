import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { button, deferred, input, mountAdmin, type } from '@/test/admin'
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
})
