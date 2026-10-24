import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick, ref } from 'vue'
import { button, deferred, input, mountAdmin, type } from '@/test/admin'
const api = vi.hoisted(() => ({ get: vi.fn(), create: vi.fn(), update: vi.fn() }))
vi.mock('@/services/api/usersApi', () => ({ usersApi: api }))
import UserFormDialog from './UserFormDialog.vue'

const USER = {
    id: 'u1',
    username: 'jan',
    email: 'jan@example.com',
    firstName: 'Jan',
    lastName: 'Novák',
    role: 'user',
    isActive: true,
    lastLogin: null,
    createdAt: '2026-10-19T00:00:00Z',
}
let mounted, open, selected, saved, words
beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset())
    api.get.mockResolvedValue(USER)
    saved = []
})
afterEach(() => {
    mounted?.cleanup()
    mounted = null
})
const dialog = () => document.querySelector('[role="dialog"]')
async function mount({ user = null, locale = 'cs', isSelf = false, ready = true } = {}) {
    open = ref(false)
    selected = ref(user)
    const Host = {
        render: () => [
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
            h(UserFormDialog, {
                modelValue: open.value,
                user: selected.value,
                isSelf,
                'onUpdate:modelValue': (value) => {
                    open.value = value
                },
                onSaved: (view, created) => saved.push([view, created]),
            }),
        ],
    }
    mounted = await mountAdmin(Host, { locale })
    words = mounted.words
    const opener = document.querySelector('.opener')
    opener.focus()
    opener.click()
    await vi.waitFor(() => expect(dialog()?.querySelector('form')).toBeTruthy())
    if (user && ready) await vi.waitFor(() => expect(button(words.admin.form.save, dialog()).disabled).toBe(false))
}
const field = (key) => input(words.admin.userForm[key], dialog())
const submit = async () => {
    dialog()
        .querySelector('form')
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await nextTick()
}
async function fillCreate() {
    await type(field('username'), ' new_user ')
    await type(field('email'), ' NEW@EXAMPLE.COM ')
    await type(field('password'), 'Silver meadow 58!')
}

describe.each(['cs', 'en'])('UserFormDialog (%s)', (locale) => {
    it.each(['a'.repeat(14), '😀'.repeat(129)])(
        'rejects the new password length and focuses errors',
        async (password) => {
            await mount({ locale })
            await fillCreate()
            await type(field('password'), password)
            await submit()
            await vi.waitFor(() => expect(document.activeElement?.getAttribute('role')).toBe('alert'))
            expect(field('password').getAttribute('aria-invalid')).toBe('true')
            expect(api.create).not.toHaveBeenCalled()
        }
    )
    it.each(['a'.repeat(15), 'a'.repeat(64), '😀'.repeat(128), 'ﬃ'.repeat(5)])(
        'creates with the complete valid input',
        async (password) => {
            api.create.mockResolvedValue(USER)
            await mount({ locale })
            await fillCreate()
            expect(dialog().textContent).toContain(words.profile.passwordHint)
            expect(field('password').hasAttribute('maxlength')).toBe(false)
            await type(field('password'), password)
            await submit()
            await vi.waitFor(() => expect(api.create).toHaveBeenCalledTimes(1))
            expect(api.create.mock.calls[0][0].password).toBe(password)
        }
    )
    it.each(['common', 'context', 'too_small', 'too_big'])('shows a specific %s password error', async (code) => {
        api.create.mockRejectedValueOnce({ code: 'VALIDATION_FAILED', fields: { password: code } })
        await mount({ locale })
        await fillCreate()
        await submit()
        await vi.waitFor(() => expect(document.activeElement?.getAttribute('role')).toBe('alert'))
        expect(dialog().textContent).toContain(words.profile.passwordErrors[code])
        expect(field('password').value).toBe('Silver meadow 58!')
        expect(field('password').getAttribute('aria-describedby')).toBeTruthy()
    })
    it('names the dialog and every account field in the current language', async () => {
        await mount({ locale })
        expect(document.getElementById(dialog().getAttribute('aria-labelledby')).textContent.trim()).toBe(
            words.admin.userForm.createTitle
        )
        for (const key of ['username', 'email', 'firstName', 'lastName', 'password', 'role'])
            expect(field(key)).toBeInstanceOf(HTMLElement)
        expect(field('password').getAttribute('autocomplete')).toBe('new-password')
        expect(field('firstName').getAttribute('autocomplete')).toBe('given-name')
    })
    it('creates once with a trimmed account payload and no status field', async () => {
        const pending = deferred()
        api.create.mockReturnValue(pending.promise)
        await mount({ locale })
        await fillCreate()
        await submit()
        await submit()
        expect(api.create).toHaveBeenCalledTimes(1)
        expect(api.create).toHaveBeenCalledWith({
            username: 'new_user',
            email: 'new@example.com',
            password: 'Silver meadow 58!',
            role: 'user',
        })
        pending.resolve(USER)
        await vi.waitFor(() => expect(saved).toEqual([[USER, true]]))
        expect(open.value).toBe(false)
    })
    it('loads the latest user for editing and never sends password or isActive', async () => {
        api.get.mockResolvedValue({ ...USER, firstName: 'Fresh' })
        api.update.mockResolvedValue(USER)
        await mount({ user: USER, locale })
        await vi.waitFor(() => expect(field('firstName').value).toBe('Fresh'))
        expect(dialog().querySelector('input[type="password"]')).toBeNull()
        await type(field('lastName'), '')
        await submit()
        await vi.waitFor(() => expect(saved).toEqual([[USER, false]]))
        expect(api.update).toHaveBeenCalledWith('u1', {
            username: 'jan',
            email: 'jan@example.com',
            firstName: 'Fresh',
            lastName: '',
            role: 'user',
        })
    })
    it('preserves input and focuses the summary for duplicate fields', async () => {
        api.update.mockRejectedValue({
            code: 'CONFLICT',
            fields: { email: 'duplicate' },
            message: 'PRIVATE_SERVER_TEXT',
        })
        await mount({ user: USER, locale })
        await submit()
        await vi.waitFor(() => expect(field('email').getAttribute('aria-invalid')).toBe('true'))
        expect(document.activeElement).toBe(dialog().querySelector('.v-alert'))
        expect(field('email').value).toBe('jan@example.com')
        expect(dialog().textContent).not.toContain('PRIVATE_SERVER_TEXT')
        expect(open.value).toBe(true)
    })
})

describe('user form lifecycle', () => {
    it('explains why the current admin role cannot change', async () => {
        api.get.mockResolvedValue({ ...USER, id: 'self', role: 'admin' })
        await mount({ user: { ...USER, id: 'self', role: 'admin' }, isSelf: true })
        await vi.waitFor(() => expect(field('role').disabled).toBe(true))
        expect(dialog().textContent).toContain(words.admin.userForm.selfHint)
    })
    it('keeps saving disabled after a failed fresh read and retries it', async () => {
        api.get.mockRejectedValueOnce({ code: 'INTERNAL' }).mockResolvedValueOnce(USER)
        await mount({ user: USER, ready: false })
        await vi.waitFor(() => expect(button(words.errors.retry, dialog())).toBeTruthy())
        expect(button(words.admin.form.save, dialog()).disabled).toBe(true)
        button(words.errors.retry, dialog()).click()
        await vi.waitFor(() => expect(button(words.admin.form.save, dialog()).disabled).toBe(false))
        expect(api.get).toHaveBeenCalledTimes(2)
    })
    it.each([
        ['username', 'a'],
        ['username', 'bad name'],
        ['email', 'invalid'],
        ['password', '12345'],
        ['firstName', 'x'.repeat(51)],
    ])('rejects invalid %s before sending', async (key, value) => {
        await mount()
        await fillCreate()
        await type(field(key), value)
        await submit()
        expect(field(key).getAttribute('aria-invalid')).toBe('true')
        expect(api.create).not.toHaveBeenCalled()
    })
    it.each(['success', 'failure'])('keeps a new opening intact after a late save %s', async (outcome) => {
        const pending = deferred()
        api.update.mockReturnValue(pending.promise)
        await mount({ user: USER })
        await submit()
        button(words.modal.cancel, dialog()).click()
        await nextTick()
        selected.value = null
        open.value = true
        await nextTick()
        await type(field('username'), 'new_draft')
        if (outcome === 'success') pending.resolve(USER)
        else pending.reject({ code: 'CONFLICT', fields: { username: 'duplicate' } })
        await new Promise((resolve) => setTimeout(resolve, 20))
        expect(open.value).toBe(true)
        expect(field('username').value).toBe('new_draft')
        expect(dialog().querySelector('.v-alert')).toBeNull()
        expect(saved).toEqual(outcome === 'success' ? [[USER, false]] : [])
    })
    it('ignores a late read after a different form opens and returns focus on cancel', async () => {
        const pending = deferred()
        api.get.mockReturnValue(pending.promise)
        await mount({ user: USER, ready: false })
        button(words.modal.cancel, dialog()).click()
        await nextTick()
        selected.value = null
        open.value = true
        await nextTick()
        await type(field('username'), 'new_draft')
        pending.resolve(USER)
        await new Promise((resolve) => setTimeout(resolve, 20))
        expect(field('username').value).toBe('new_draft')
        button(words.modal.cancel, dialog()).click()
        await vi.waitFor(() => expect(document.activeElement).toBe(document.querySelector('.opener')))
    })
})
