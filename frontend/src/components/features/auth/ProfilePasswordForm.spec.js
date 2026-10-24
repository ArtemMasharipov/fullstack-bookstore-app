import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { button, deferred, input, mountAdmin, type } from '@/test/admin'
import { useAuthStore } from '@/stores/auth'
const api = vi.hoisted(() => ({ changePassword: vi.fn() }))
vi.mock('@/services/api/authService', () => ({ authApi: api }))
import ProfilePasswordForm from './ProfilePasswordForm.vue'

let mounted
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
beforeEach(() => {
    localStorage.setItem('token', 'original')
    api.changePassword.mockReset().mockResolvedValue({ data: { user: USER, token: 'replacement' } })
})
afterEach(() => {
    mounted?.cleanup()
    mounted = null
    localStorage.clear()
})
async function mount(locale = 'en') {
    mounted = await mountAdmin(ProfilePasswordForm, {
        routeName: 'Profile',
        path: locale === 'en' ? '/en/profile' : '/profile',
        locale,
    })
}
const current = () => input(mounted.words.profile.currentPassword)
const fresh = () => input(mounted.words.profile.newPassword)
async function submit(password = 'Silver meadow 58!') {
    await type(current(), 'legacy')
    await type(fresh(), password)
    document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }))
    await nextTick()
}
describe('profile password form', () => {
    it.each(['cs', 'en'])('labels fields, hints and keyboard buttons (%s)', async (locale) => {
        await mount(locale)
        expect(current().autocomplete).toBe('current-password')
        expect(fresh().autocomplete).toBe('new-password')
        expect(fresh().hasAttribute('maxlength')).toBe(false)
        expect(document.body.textContent).toContain(mounted.words.profile.passwordHint)
        const reveal = document.querySelector('button[aria-label="' + mounted.words.profile.showCurrent + '"]')
        expect(reveal?.tagName).toBe('BUTTON')
        expect(reveal.type).toBe('button')
        reveal.focus()
        reveal.click()
        await nextTick()
        expect(document.activeElement).toBe(reveal)
        expect(current().type).toBe('text')
        expect(reveal.getAttribute('aria-label')).toBe(mounted.words.profile.hideCurrent)
    })
    it.each(['a'.repeat(14), 'a'.repeat(129)])(
        'rejects invalid normalized length with focused summary',
        async (password) => {
            await mount()
            document.querySelector('button[aria-label="' + mounted.words.profile.showCurrent + '"]').click()
            document.querySelector('button[aria-label="' + mounted.words.profile.showNew + '"]').click()
            await submit(password)
            await vi.waitFor(() => expect(document.activeElement?.getAttribute('role')).toBe('alert'))
            expect(fresh().getAttribute('aria-invalid')).toBe('true')
            expect(fresh().getAttribute('aria-describedby')).toBeTruthy()
            expect(api.changePassword).not.toHaveBeenCalled()
        }
    )
    it.each(['a'.repeat(64), '😀'.repeat(128), 'ﬃ'.repeat(5)])(
        'submits the full input and clears accepted credentials',
        async (password) => {
            await mount()
            await submit(password)
            await vi.waitFor(() =>
                expect(api.changePassword).toHaveBeenCalledWith(
                    { currentPassword: 'legacy', newPassword: password },
                    'original'
                )
            )
            await vi.waitFor(() => expect(current().value).toBe(''))
            expect(fresh().value).toBe('')
            expect(current().type).toBe('password')
            expect(fresh().type).toBe('password')
            expect(useAuthStore().token).toBe('replacement')
        }
    )
    it.each([
        ['currentPassword', 'incorrect'],
        ['newPassword', 'common'],
        ['newPassword', 'context'],
        ['newPassword', 'same_as_current'],
    ])('links %s/%s and retains input/session', async (field, code) => {
        api.changePassword.mockRejectedValueOnce({ status: 400, code: 'VALIDATION_FAILED', fields: { [field]: code } })
        await mount()
        await submit()
        await vi.waitFor(() => expect(document.activeElement?.getAttribute('role')).toBe('alert'))
        expect((field === 'currentPassword' ? current() : fresh()).getAttribute('aria-invalid')).toBe('true')
        expect(document.body.textContent).toContain(mounted.words.profile.passwordErrors[code])
        expect(current().value).toBe('legacy')
        expect(useAuthStore().token).toBe('original')
    })
    it.each([{ status: 409, code: 'CONFLICT' }, { status: 429, code: 'RATE_LIMITED' }, new Error('network')])(
        'focuses generic failure without losing input',
        async (error) => {
            api.changePassword.mockRejectedValueOnce(error)
            await mount()
            await submit()
            await vi.waitFor(() => expect(document.activeElement?.getAttribute('role')).toBe('alert'))
            expect(fresh().value).toBe('Silver meadow 58!')
            expect(useAuthStore().token).toBe('original')
        }
    )
    it('blocks duplicate submit and ignores a stale success', async () => {
        const pending = deferred()
        api.changePassword.mockReturnValueOnce(pending.promise)
        await mount()
        await submit()
        document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }))
        await nextTick()
        expect(api.changePassword).toHaveBeenCalledTimes(1)
        useAuthStore().clearAuth()
        pending.resolve({ data: { user: USER, token: 'late' } })
        await vi.waitFor(() => expect(button(mounted.words.profile.changePassword).disabled).toBe(false))
        expect(fresh().value).toBe('Silver meadow 58!')
        expect(useAuthStore().token).toBeNull()
    })
    it('does not touch a newly mounted form after navigation', async () => {
        const pending = deferred()
        api.changePassword.mockReturnValueOnce(pending.promise)
        await mount()
        await submit()
        mounted.cleanup()
        mounted = null
        await mount()
        await type(fresh(), 'New page draft password')
        pending.resolve({ data: { user: USER, token: 'replacement' } })
        await vi.waitFor(() => expect(useAuthStore().token).toBe('replacement'))
        expect(fresh().value).toBe('New page draft password')
    })
})
