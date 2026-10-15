import { createRouter, createWebHistory } from 'vue-router'
import { buildRoutes } from './buildRoutes.js'
import unifiedGuard from './guards/unified.js'
import { installLocaleRouting } from './locale.js'
import { t } from '@/i18n'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL || '/'),
    routes: buildRoutes(),
})

installLocaleRouting(router, {
    onLoadError: ({ retry }) => {
        const previous = document.getElementById('locale-load-error')
        previous?.remove()
        const alert = document.createElement('div')
        alert.id = 'locale-load-error'
        alert.setAttribute('role', 'alert')
        alert.lang = document.documentElement.lang
        const message = document.createElement('p')
        message.textContent = t('bootstrap.loadError')
        const button = document.createElement('button')
        button.type = 'button'
        button.textContent = t('bootstrap.retry')
        button.addEventListener(
            'click',
            () => {
                alert.remove()
                retry()
            },
            { once: true }
        )
        alert.append(message, button)
        document.body.append(alert)
        button.focus()
    },
})
router.beforeEach(unifiedGuard)
router.afterEach((_to, _from, failure) => {
    if (!failure) document.getElementById('locale-load-error')?.remove()
})

export default router
