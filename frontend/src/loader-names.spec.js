import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { parse } from 'vue/compiler-sfc'

// Vuetify draws its own progress indicator for a `loading` prop, and that indicator has no accessible name
// (axe aria-progressbar-name). Each such element supplies a #loader slot whose indicator carries an aria-label.
const ELEMENT = 1
const ATTRIBUTE = 6
const DIRECTIVE = 7

const sources = readdirSync('src', { recursive: true })
    .filter((file) => file.endsWith('.vue'))
    .map((file) => path.join('src', file).replaceAll('\\', '/'))

const hasProp = (node, name) =>
    node.props.some(
        (prop) =>
            (prop.type === ATTRIBUTE && prop.name === name) ||
            (prop.type === DIRECTIVE && prop.name === 'bind' && prop.arg?.content === name)
    )
const isLoaderSlot = (node) =>
    node.type === ELEMENT &&
    node.tag === 'template' &&
    node.props.some((prop) => prop.type === DIRECTIVE && prop.name === 'slot' && prop.arg?.content === 'loader')
const isNamed = (node) => node.type === ELEMENT && (hasProp(node, 'aria-label') || (node.children ?? []).some(isNamed))

function unnamedLoaders(file) {
    const { descriptor } = parse(readFileSync(file, 'utf8'), { filename: file })
    const found = []
    const visit = (node) => {
        if (node.type !== ELEMENT) return
        if (node.tag.startsWith('v-') && hasProp(node, 'loading')) {
            const slot = node.children.find(isLoaderSlot)
            if (!slot || !isNamed(slot)) found.push(`${file}:${node.loc.start.line} <${node.tag}>`)
        }
        node.children.forEach(visit)
    }
    if (descriptor.template) descriptor.template.ast.children.forEach(visit)
    return found
}

describe('loading indicators', () => {
    it('finds the components to check', () => {
        expect(sources.length).toBeGreaterThan(50)
    })

    it('gives every Vuetify loading indicator an accessible name', () => {
        expect(sources.flatMap(unnamedLoaders)).toEqual([])
    })
})
