import { afterEach, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import cs from '@/i18n/locales/cs.json'

afterEach(() => {
    vi.unstubAllGlobals()
    document.body.replaceChildren()
})
it('clears obsolete locale failure only after a successful current navigation', async () => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', async (url) => {
        if (String(url).includes('/en.json')) throw new Error('Offline')
        return new Response(JSON.stringify(cs))
    })
    const { default: router } = await import('./index')
    await router.push('/books')
    await router.push('/en/books')
    expect(document.getElementById('locale-load-error')).not.toBeNull()
    const removeGuard = router.beforeEach((to) => (to.path === '/authors' ? false : undefined))
    await router.push('/authors')
    expect(document.getElementById('locale-load-error')).not.toBeNull()
    removeGuard()
    await router.push('/authors')
    expect(document.getElementById('locale-load-error')).toBeNull()
})
