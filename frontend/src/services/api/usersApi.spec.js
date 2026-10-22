import { beforeEach, describe, expect, it, vi } from 'vitest'
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn() }))
vi.mock('./baseApi', () => ({ default: http }))
import { usersApi } from './usersApi'

const user = {
    id: 'u1',
    username: 'jan',
    email: 'jan@example.com',
    firstName: null,
    lastName: null,
    role: 'user',
    isActive: true,
    lastLogin: null,
    createdAt: '2026-10-19T00:00:00Z',
}
const pagination = { page: 2, limit: 20, total: 25, pages: 2 }
const response = (data, extra = {}) => ({ data: { success: true, data, ...extra } })
beforeEach(() => vi.resetAllMocks())
describe('usersApi', () => {
    it('exposes exactly the six supported user operations', () => {
        expect(Object.keys(usersApi).sort()).toEqual(['create', 'get', 'list', 'setStatus', 'stats', 'update'])
    })
    it('unwraps writes into the shared user DTO', async () => {
        http.post.mockResolvedValue(response(user))
        http.put.mockResolvedValue(response(user))
        expect(await usersApi.create({ username: 'jan' })).toEqual(user)
        expect(await usersApi.update('u1', { firstName: 'Jan' })).toEqual(user)
        expect(http.post).toHaveBeenCalledWith('/users', { username: 'jan' })
        expect(http.put).toHaveBeenCalledWith('/users/u1', { firstName: 'Jan' })
    })
    it('lists a server page and reads a fresh user', async () => {
        http.get.mockResolvedValueOnce(response([user], { pagination })).mockResolvedValueOnce(response(user))
        expect(await usersApi.list({ page: 2, limit: 20, role: 'user' })).toEqual({ data: [user], pagination })
        expect(await usersApi.get('u1')).toEqual(user)
        expect(http.get).toHaveBeenNthCalledWith(1, '/users', { params: { page: 2, limit: 20, role: 'user' } })
        expect(http.get).toHaveBeenNthCalledWith(2, '/users/u1')
    })
    it('changes only status with PATCH and unwraps statistics', async () => {
        const stats = { total: 25, active: 20, inactive: 5, byRole: { admin: 1, user: 24 } }
        http.patch.mockResolvedValue(response({ ...user, isActive: false }))
        http.get.mockResolvedValue(response(stats))
        expect(await usersApi.setStatus('u1', false)).toEqual({ ...user, isActive: false })
        expect(await usersApi.stats()).toEqual(stats)
        expect(http.patch).toHaveBeenCalledWith('/users/u1/status', { isActive: false })
        expect(http.get).toHaveBeenCalledWith('/users/stats')
    })
})
