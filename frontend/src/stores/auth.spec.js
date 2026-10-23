import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useNotifications } from '@/composables/useNotifications'
import { useAuthStore } from './auth'

const api = vi.hoisted(() => ({
    getCurrentUser: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    logoutAll: vi.fn(),
    login: vi.fn(),
}))
const reset = vi.hoisted(() => vi.fn())
vi.mock('@/services/api/authService', () => ({ authApi: api }))
vi.mock('@/services/session', () => ({ resetSession: reset }))

const USER = {
    id: 'a'.repeat(24),
    username: 'reader',
    email: 'reader@example.com',
    firstName: 'Jan',
    lastName: null,
    role: 'user',
    isActive: true,
    lastLogin: null,
    createdAt: '2026-10-23T00:00:00Z',
}
const UPDATED = { ...USER, firstName: 'Jana' }
const OTHER = { ...USER, id: 'b'.repeat(24), username: 'another', email: 'another@example.com' }
const deferred = () => {
    let resolve, reject
    const promise = new Promise((yes, no) => {
        resolve = yes
        reject = no
    })
    return { promise, resolve, reject }
}
let store, notifications
beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    localStorage.clear()
    setActivePinia(createPinia())
    notifications = useNotifications()
    notifications.clear()
    store = useAuthStore()
    store.$patch({ token: 'original-token', user: USER, userChecked: true })
    localStorage.setItem('token', 'original-token')
    localStorage.setItem('userData', JSON.stringify(USER))
    vi.spyOn(store, '_takeOverCart').mockResolvedValue(undefined)
    reset.mockImplementation(async () => {
        if (store.forget) store.forget()
        else store.clearAuth()
        notifications.clear()
    })
})
afterEach(() => {
    notifications.clear()
    vi.clearAllTimers()
    vi.useRealTimers()
})

describe('account store actions', () => {
    it('saves the returned profile and keeps the token with one notification', async () => {
        api.updateProfile.mockResolvedValue({ success: true, data: UPDATED })
        expect(await store.updateProfile({ firstName: 'Jana' })).toEqual(UPDATED)
        expect(store.user).toEqual(UPDATED)
        expect(JSON.parse(localStorage.getItem('userData'))).toEqual(UPDATED)
        expect(store.token).toBe('original-token')
        expect(api.updateProfile).toHaveBeenCalledWith({ firstName: 'Jana' }, 'original-token')
        expect(notifications.notifications.value.map((item) => item.messageKey)).toEqual(['profile.saved'])
        expect(store.loading).toBe(false)
    })

    it('takes over the new password token and user without merging the cart', async () => {
        api.changePassword.mockResolvedValue({ success: true, data: { user: UPDATED, token: 'replacement-token' } })
        expect(await store.changePassword({ currentPassword: 'old', newPassword: 'new' })).toEqual({
            user: UPDATED,
            token: 'replacement-token',
        })
        expect(store.token).toBe('replacement-token')
        expect(localStorage.getItem('token')).toBe('replacement-token')
        expect(JSON.parse(localStorage.getItem('userData'))).toEqual(UPDATED)
        expect(store._takeOverCart).not.toHaveBeenCalled()
        expect(notifications.notifications.value.map((item) => item.messageKey)).toEqual(['profile.passwordChanged'])
        expect(store.loading).toBe(false)
    })

    it.each([400, 409])('keeps the session and exposes a %i field/conflict failure', async (status) => {
        const failure = Object.assign(new Error('Validation failed'), {
            status,
            code: status === 400 ? 'VALIDATION_FAILED' : 'CONFLICT',
            fields: status === 400 ? { currentPassword: 'incorrect' } : undefined,
        })
        api.changePassword.mockRejectedValue(failure)
        await expect(store.changePassword({ currentPassword: 'wrong', newPassword: 'new' })).rejects.toBe(failure)
        expect(store.token).toBe('original-token')
        expect(store.user).toEqual(USER)
        expect(store.accountBusy).toBe(false)
        expect(reset).not.toHaveBeenCalled()
        expect(notifications.notifications.value).toHaveLength(0)
    })

    it('waits for logout-all success before resetting without a way back', async () => {
        const wait = deferred()
        api.logoutAll.mockReturnValue(wait.promise)
        const pending = store.logoutAll()
        expect(store.token).toBe('original-token')
        expect(reset).not.toHaveBeenCalled()
        wait.resolve(undefined)
        await pending
        expect(api.logoutAll).toHaveBeenCalledWith('original-token')
        expect(reset).toHaveBeenCalledWith({ wayBack: false })
        expect(store.token).toBeNull()
        expect(localStorage.getItem('token')).toBeNull()
        expect(notifications.notifications.value.map((item) => item.messageKey)).toEqual(['profile.signedOutAll'])
    })

    it('keeps the current session if logout-all has a network failure', async () => {
        const failure = Object.assign(new Error('Network unavailable'), { code: 'NETWORK_ERROR' })
        api.logoutAll.mockRejectedValue(failure)
        await expect(store.logoutAll()).rejects.toBe(failure)
        expect(store.token).toBe('original-token')
        expect(reset).not.toHaveBeenCalled()
        expect(store.accountBusy).toBe(false)
    })

    it('blocks a duplicate account mutation while a request is pending', async () => {
        const wait = deferred()
        api.updateProfile.mockReturnValue(wait.promise)
        const pending = store.updateProfile({ firstName: 'Jana' })
        expect(store.accountBusy).toBe(true)
        expect(await store.updateProfile({ firstName: 'Second' })).toBeNull()
        expect(api.updateProfile).toHaveBeenCalledTimes(1)
        wait.resolve({ success: true, data: UPDATED })
        await pending
        expect(store.accountBusy).toBe(false)
    })

    it('does not overwrite the user with an old me response after saving', async () => {
        const wait = deferred()
        api.getCurrentUser.mockReturnValue(wait.promise)
        const pending = store.loadProfile()
        api.updateProfile.mockResolvedValue({ success: true, data: UPDATED })
        await store.updateProfile({ firstName: 'Jana' })
        wait.resolve({ success: true, data: USER })
        expect(await pending).toBeNull()
        expect(store.user).toEqual(UPDATED)
        expect(JSON.parse(localStorage.getItem('userData'))).toEqual(UPDATED)
    })

    it.each(['updateProfile', 'changePassword'])('ignores a late %s response after local logout', async (action) => {
        const wait = deferred()
        api[action].mockReturnValue(wait.promise)
        const pending = store[action]({})
        store.clearAuth()
        wait.resolve({
            success: true,
            data: action === 'changePassword' ? { user: UPDATED, token: 'stale-token' } : UPDATED,
        })
        expect(await pending).toBeNull()
        expect(store.user).toBeNull()
        expect(store.token).toBeNull()
        expect(localStorage.getItem('token')).toBeNull()
        expect(notifications.notifications.value).toHaveLength(0)
    })

    it('ignores a previous user response after another successful login', async () => {
        const wait = deferred()
        api.updateProfile.mockReturnValue(wait.promise)
        const pending = store.updateProfile({ firstName: 'Jana' })
        api.login.mockResolvedValue({ success: true, data: { user: OTHER, token: 'other-token' } })
        await store.login({ email: OTHER.email, password: 'test' })
        wait.resolve({ success: true, data: UPDATED })
        expect(await pending).toBeNull()
        expect(store.user).toEqual(OTHER)
        expect(localStorage.getItem('token')).toBe('other-token')
        expect(notifications.notifications.value.map((item) => item.messageKey)).toEqual(['notifications.welcomeBack'])
    })

    it('does not reset a later session when old logout-all completes', async () => {
        const wait = deferred()
        api.logoutAll.mockReturnValue(wait.promise)
        const pending = store.logoutAll()
        api.login.mockResolvedValue({ success: true, data: { user: OTHER, token: 'other-token' } })
        await store.login({ email: OTHER.email, password: 'test' })
        wait.resolve(undefined)
        await pending
        expect(reset).not.toHaveBeenCalled()
        expect(store.token).toBe('other-token')
    })

    it.each(['ensureFreshUser', 'fetchCurrentUser'])(
        'ignores an old %s response after session reset',
        async (action) => {
            store.userChecked = false
            const wait = deferred()
            api.getCurrentUser.mockReturnValue(wait.promise)
            const pending = store[action]()
            store.clearAuth()
            wait.resolve({ success: true, data: USER })
            await pending
            expect(store.user).toBeNull()
            expect(localStorage.getItem('userData')).toBeNull()
        }
    )

    it('rejects a malformed password success without losing the active token', async () => {
        api.changePassword.mockResolvedValue({ success: true, data: { user: UPDATED } })
        await expect(store.changePassword({})).rejects.toThrow()
        expect(store.token).toBe('original-token')
        expect(store.accountBusy).toBe(false)
    })

    describe.each(['removed', 'replaced'])('%s persisted session in another tab', (session) => {
        function changePersistedSession() {
            if (session === 'removed') {
                localStorage.removeItem('token')
                localStorage.removeItem('userData')
            } else {
                localStorage.setItem('token', 'other-token')
                localStorage.setItem('userData', JSON.stringify(OTHER))
            }
        }
        function expectUntouched() {
            expect(localStorage.getItem('token')).toBe(session === 'removed' ? null : 'other-token')
            expect(localStorage.getItem('userData')).toBe(session === 'removed' ? null : JSON.stringify(OTHER))
            expect(store.token).toBe('original-token')
            expect(store.user).toEqual(USER)
            expect(store.accountBusy).toBe(false)
            expect(reset).not.toHaveBeenCalled()
            expect(notifications.notifications.value).toHaveLength(0)
        }
        it.each(['loadProfile', 'updateProfile', 'changePassword', 'logoutAll'])(
            'ignores late %s success without changing the other tab session',
            async (action) => {
                const wait = deferred()
                api[action === 'loadProfile' ? 'getCurrentUser' : action].mockReturnValue(wait.promise)
                const pending = store[action]({})
                changePersistedSession()
                wait.resolve({
                    success: true,
                    data: action === 'changePassword' ? { user: UPDATED, token: 'stale-token' } : UPDATED,
                })
                expect(await pending).toBeNull()
                expectUntouched()
            }
        )
        it.each(['loadProfile', 'updateProfile', 'changePassword', 'logoutAll'])(
            'ignores late %s failure belonging to the old persisted session',
            async (action) => {
                const wait = deferred()
                api[action === 'loadProfile' ? 'getCurrentUser' : action].mockReturnValue(wait.promise)
                const pending = store[action]({})
                changePersistedSession()
                wait.reject(new Error('old request failed'))
                expect(await pending).toBeNull()
                expectUntouched()
            }
        )
    })

    it.each(['loadProfile', 'updateProfile', 'changePassword', 'logoutAll'])(
        'does not start %s under an already replaced persisted session',
        async (action) => {
            localStorage.setItem('token', 'other-token')
            localStorage.setItem('userData', JSON.stringify(OTHER))
            expect(await store[action]({})).toBeNull()
            expect(api[action === 'loadProfile' ? 'getCurrentUser' : action]).not.toHaveBeenCalled()
            expect(store.accountBusy).toBe(false)
            expect(reset).not.toHaveBeenCalled()
            expect(notifications.notifications.value).toHaveLength(0)
        }
    )

    it('does not announce logout-all after another tab signs in during navigation', async () => {
        const navigation = deferred()
        api.logoutAll.mockResolvedValue(undefined)
        reset.mockImplementation(() => {
            store.forget()
            return navigation.promise
        })
        const pending = store.logoutAll()
        await vi.waitFor(() => expect(reset).toHaveBeenCalled())
        localStorage.setItem('token', 'other-token')
        localStorage.setItem('userData', JSON.stringify(OTHER))
        navigation.resolve()
        await pending
        expect(localStorage.getItem('token')).toBe('other-token')
        expect(notifications.notifications.value).toHaveLength(0)
    })
})
