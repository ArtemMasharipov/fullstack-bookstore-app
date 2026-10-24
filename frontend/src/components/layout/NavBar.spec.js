import { afterEach, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mountAdmin } from '@/test/admin'
import { useAuthStore } from '@/stores/auth'
import NavBar from './NavBar.vue'

let mounted
afterEach(() => {
    mounted?.cleanup()
    localStorage.clear()
})
it('renders current UserView names and falls back to username', async () => {
    localStorage.setItem('token', 'session')
    mounted = await mountAdmin(NavBar, { routeName: 'Profile', path: '/en/profile', locale: 'en' })
    const auth = useAuthStore()
    auth.user = { id: 'u1', username: 'reader', firstName: 'Jan', lastName: 'Novák', role: 'user' }
    await nextTick()
    const menu = () => document.querySelector('header button:has(.v-avatar)')
    expect(menu().textContent).toContain('Jan Novák')
    expect(menu().querySelector('.v-avatar').textContent).toBe('JN')
    auth.user = { ...auth.user, firstName: 'Jana' }
    await nextTick()
    expect(menu().textContent).toContain('Jana Novák')
    auth.user = { ...auth.user, firstName: null, lastName: null }
    await nextTick()
    expect(menu().textContent).toContain('reader')
})
