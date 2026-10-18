import { describe, expect, it } from 'vitest'
import { vuetify } from '@/config/vuetify'
import { dark, focus, light } from './tokens'

// The light surface and text of the theme, which the stage keeps as they are
const SURFACE = '#FAFAF7'
const ON_SURFACE = '#2D3436'
const NAVY = '#1B2A4A'
const DARK_SURFACE = '#1A1A1A'

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const toHex = (rgb) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`

// A colour at an opacity over a background, the way the browser paints it
const over = (hex, opacity, background) =>
    toHex(channels(hex).map((value, i) => value * opacity + channels(background)[i] * (1 - opacity)))

// WCAG 2.x contrast ratio
function contrast(a, b) {
    const luminance = (hex) => {
        const [r, g, b] = channels(hex).map((v) => {
            const s = v / 255
            return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
        })
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (lighter + 0.05) / (darker + 0.05)
}

describe('light theme colours', () => {
    it.each(['price', 'success', 'error', 'warning', 'info'])(
        '%s text is at least 4.5:1 on the light surface',
        (role) => {
            expect(contrast(light[role], SURFACE)).toBeGreaterThanOrEqual(4.5)
        }
    )

    // Vuetify's tonal variant paints the role colour at 12 % under text of the role colour
    it.each(['success', 'error', 'warning', 'info'])(
        '%s text is at least 4.5:1 on its own tonal background',
        (role) => {
            expect(contrast(light[role], over(light[role], 0.12, SURFACE))).toBeGreaterThanOrEqual(4.5)
        }
    )

    it('text on the call to action colour is at least 4.5:1 in both themes', () => {
        expect(contrast(light['on-secondary'], light.secondary)).toBeGreaterThanOrEqual(4.5)
        expect(contrast(dark['on-secondary'], light.secondary)).toBeGreaterThanOrEqual(4.5)
    })

    it('secondary text and field labels stay at least 4.5:1', () => {
        const opacity = vuetify.theme.themes.value.light.variables['medium-emphasis-opacity']
        expect(contrast(over(ON_SURFACE, opacity, SURFACE), SURFACE)).toBeGreaterThanOrEqual(4.5)
        // A field label applies the medium emphasis on top of the field's 0.87
        expect(contrast(over(ON_SURFACE, opacity * 0.87, SURFACE), SURFACE)).toBeGreaterThanOrEqual(4.5)
    })
})

describe('focus ring', () => {
    it('is at least 3:1 on the light surface, on navy and on the dark surface', () => {
        expect(contrast(focus.light.inner, SURFACE)).toBeGreaterThanOrEqual(3)
        expect(contrast(focus.onDark.inner, NAVY)).toBeGreaterThanOrEqual(3)
        expect(contrast(focus.onDark.inner, DARK_SURFACE)).toBeGreaterThanOrEqual(3)
    })
})

describe('theme wiring', () => {
    it('the light and dark themes take their colours and focus variables from the tokens', () => {
        const { light: lightTheme, dark: darkTheme } = vuetify.theme.themes.value
        for (const role of Object.keys(light)) expect(lightTheme.colors[role], role).toBe(light[role])
        expect(darkTheme.colors['on-secondary']).toBe('#2B2118')
        // The dark theme keeps its current price colour until it is redesigned
        expect(darkTheme.colors.price).toBe('#E8E8E8')
        expect(lightTheme.variables['focus-inner']).toBe('#1F4F8C')
        expect(lightTheme.variables['focus-inner-on-dark']).toBe('#FFD27A')
        expect(darkTheme.variables['focus-inner']).toBe('#FFD27A')
    })
})
