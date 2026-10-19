import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { CLIEngine, Linter } = require('eslint')
const vue = require('eslint-plugin-vue')
const rule = 'vue/no-bare-strings-in-template'
const eslint = new CLIEngine({ cwd: process.cwd() })
const inventoryPath = path.resolve('eslint-legacy-sfc.json')
const legacy = existsSync(inventoryPath) ? JSON.parse(readFileSync(inventoryPath, 'utf8')) : []
const strict = [
    'src/components/features/admin/UserFormDialog.vue',
    'src/views/admin/AdminAuthorsView.vue',
    'src/components/features/admin/AuthorFormDialog.vue',
    'src/components/layout/NavBar.vue',
    'src/components/layout/FooterLayout.vue',
    'src/components/layout/admin/AdminLayout.vue',
    'src/components/ui/BaseModal.vue',
    'src/components/ui/ConfirmModal.vue',
    'src/components/ui/ErrorMessage.vue',
    'src/components/notifications/NotificationContainer.vue',
    'src/views/errors/ErrorView.vue',
    'src/views/errors/UnauthorizedView.vue',
    'src/views/errors/NotFoundView.vue',
    'src/components/layout/LanguageSwitcher.vue',
]
function diagnostics(source, filename = 'src/components/FutureWidget.vue') {
    const config = eslint.getConfigForFile(filename)
    const linter = new Linter()
    linter.defineParser('vue-eslint-parser', require('vue-eslint-parser'))
    linter.defineRule(rule, vue.rules['no-bare-strings-in-template'])
    return linter.verify(
        source,
        {
            parser: 'vue-eslint-parser',
            parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
            rules: { [rule]: config.rules[rule] || 'off' },
        },
        filename
    )
}

describe('translation lint boundary', () => {
    it('keeps all shared components strict and future SFCs strict by default', () => {
        for (const filename of [...strict, 'src/components/FutureWidget.vue']) {
            expect(legacy, filename).not.toContain(filename)
            expect(diagnostics('<template><p>Untranslated copy</p></template>', filename), filename).toEqual([
                expect.objectContaining({ ruleId: rule, severity: 2 }),
            ])
        }
    })
    it('freezes only exact existing untranslated paths without globs or duplicate entries', () => {
        expect(legacy.length).toBeGreaterThan(0)
        expect(new Set(legacy).size).toBe(legacy.length)
        for (const filename of legacy) {
            expect(filename).toMatch(/^src\/.+\.vue$/)
            expect(filename).not.toMatch(/[*?!{}[\]]/)
            expect(existsSync(path.resolve(filename)), filename).toBe(true)
            expect(diagnostics('<template><p>Legacy copy</p></template>', filename)).toEqual([])
        }
        for (const filename of ['src/views/admin/AdminUsersView.vue']) expect(legacy).toContain(filename)
    })
    it.each(['label', 'subtitle', 'placeholder', 'title', 'hint', 'alt', 'aria-label'])(
        'rejects literal %s copy and accepts translated expressions',
        (attribute) => {
            expect(diagnostics('<template><v-text-field ' + attribute + '="Untranslated copy" /></template>')).toEqual([
                expect.objectContaining({ ruleId: rule, messageId: 'unexpectedInAttr' }),
            ])
            expect(
                diagnostics('<template><v-text-field :' + attribute + '="t(\'common.notAvailable\')" /></template>')
            ).toEqual([])
        }
    )
    it('rejects bare text and v-text literals while allowing translations, punctuation and the brand', () => {
        expect(diagnostics('<template><p v-text="\'Untranslated copy\'" /></template>')).toHaveLength(1)
        expect(
            diagnostics("<template><p>{{ t('common.notAvailable') }} \u00b7 Bookstore \u00a9</p></template>")
        ).toEqual([])
        expect(diagnostics('<template><p>Bookstore App</p></template>')).toHaveLength(1)
    })
    it.each(strict)('has no bare UI strings in %s', (filename) => {
        expect(diagnostics(readFileSync(path.resolve(filename), 'utf8'), filename)).toEqual([])
    })
})
