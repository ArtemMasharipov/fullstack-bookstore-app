import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import baseApi from './baseApi'
import { authApi } from './authService'

let originalAdapter
let requests
beforeEach(() => {
    localStorage.clear()
    requests = []
    originalAdapter = baseApi.defaults.adapter
    baseApi.defaults.adapter = async (config) => {
        requests.push(config)
        return {
            status: config.method === 'delete' ? 204 : 200,
            data: { success: true, data: { id: 'user-id' } },
            headers: {},
            config,
        }
    }
})
afterEach(() => {
    baseApi.defaults.adapter = originalAdapter
    localStorage.clear()
})

describe('account API contract', () => {
    it('sends only editable profile fields to auth/profile using the captured session', async () => {
        const pending = authApi.updateProfile(
            {
                id: 'user-id',
                firstName: 'Jana',
                lastName: 'Novák',
                username: 'jana',
                email: 'read-only@example.com',
                role: 'admin',
            },
            'captured-token'
        )
        localStorage.setItem('token', 'another-session')
        expect(await pending).toEqual({ success: true, data: { id: 'user-id' } })
        expect(requests[0].method).toBe('put')
        expect(requests[0].url).toBe('/auth/profile')
        expect(JSON.parse(requests[0].data)).toEqual({ firstName: 'Jana', lastName: 'Novák', username: 'jana' })
        expect(requests[0].headers.Authorization).toBe('Bearer captured-token')
    })

    it('sends only current/new passwords to auth/password with the captured session', async () => {
        const pending = authApi.changePassword(
            { currentPassword: 'old password', newPassword: 'Cedar lantern 47!', confirmPassword: 'unused' },
            'captured-token'
        )
        localStorage.setItem('token', 'another-session')
        await pending
        expect(requests[0].method).toBe('put')
        expect(requests[0].url).toBe('/auth/password')
        expect(JSON.parse(requests[0].data)).toEqual({
            currentPassword: 'old password',
            newPassword: 'Cedar lantern 47!',
        })
        expect(requests[0].headers.Authorization).toBe('Bearer captured-token')
    })

    it('deletes auth/sessions without a body and cannot revoke a later session', async () => {
        const pending = authApi.logoutAll('captured-token')
        localStorage.setItem('token', 'another-session')
        await pending
        expect(requests[0].method).toBe('delete')
        expect(requests[0].url).toBe('/auth/sessions')
        expect(requests[0].data).toBeUndefined()
        expect(requests[0].headers.Authorization).toBe('Bearer captured-token')
    })

    it('reads auth/me for the captured session even if storage changes before dispatch', async () => {
        const pending = authApi.getCurrentUser('captured-token')
        localStorage.setItem('token', 'another-session')
        await pending
        expect(requests[0].url).toBe('/auth/me')
        expect(requests[0].headers.Authorization).toBe('Bearer captured-token')
    })
})
