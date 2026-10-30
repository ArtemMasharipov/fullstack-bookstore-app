import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'

const makeI18n = () =>
    createI18n({
        legacy: false,
        locale: 'en',
        escapeParameter: true,
        warnHtmlMessage: false,
        messages: {
            en: {
                direct: '<iframe srcdoc="<b>x</b>"></iframe>',
                parameter: '<iframe srcdoc="{content}"></iframe>',
                mixed: '{0} {name}',
                greeting: 'Hello {name}',
                list: '{0} {1}',
            },
        },
    })

describe('Vue I18n translation escaping security', () => {
    it('neutralizes srcdoc in a translated HTML message', () => {
        const i18n = makeI18n()

        expect(i18n.global.t('direct')).toBe('<iframe &#115;rcdoc="&lt;b&gt;x&lt;/b&gt;"></iframe>')
    })

    it('neutralizes srcdoc after escaping a named interpolation', () => {
        const i18n = makeI18n()

        expect(i18n.global.t('parameter', { content: '<b>x</b>' })).toBe(
            '<iframe &#115;rcdoc="&lt;b&gt;x&lt;&#x2F;b&gt;"></iframe>'
        )
    })

    it('escapes named values when the same translation also receives a list', () => {
        const i18n = makeI18n()

        expect(i18n.global.t('mixed', ['a'], { named: { name: '<b>x</b>' } })).toBe('a &lt;b&gt;x&lt;&#x2F;b&gt;')
    })

    it('preserves ordinary named interpolation', () => {
        const i18n = makeI18n()

        expect(i18n.global.t('greeting', { name: 'Ada' })).toBe('Hello Ada')
    })

    it('preserves ordinary list interpolation', () => {
        const i18n = makeI18n()

        expect(i18n.global.t('list', ['one', 'two'])).toBe('one two')
    })
})
