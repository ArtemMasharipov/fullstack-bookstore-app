import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

// Claims the shop cannot back: a return policy, payment security, delivery speed,
// invented activity and stock levels, features that do not exist, and dollar prices
const PROMISES = [
    /30-day/i,
    /30 day/i,
    /30denn/i,
    /30 dn/i,
    /easy returns/i,
    /snadné vrácení/i,
    /fast delivery/i,
    /rychlé doručení/i,
    /secure payment/i,
    /encryption/i,
    /šifrov/i,
    /low in stock/i,
    /John Doe/i,
    /New order #/i,
    /wishlist/i,
    /personali[sz]ed/i,
    /\$\s?\d/,
]

// Every template, script and dictionary of the app; tests may name the claims they forbid
const sources = readdirSync('src', { recursive: true })
    .filter((file) => /\.(vue|js|json)$/.test(file) && !file.endsWith('.spec.js'))
    .map((file) => ({
        file: path.join('src', file).replaceAll('\\', '/'),
        text: readFileSync(path.join('src', file), 'utf8'),
    }))

describe('honest copy', () => {
    it.each(PROMISES.map((pattern) => [String(pattern), pattern]))(
        'promises nothing the shop does not offer: %s',
        (_name, pattern) => {
            expect(sources.filter(({ text }) => pattern.test(text)).map(({ file }) => file)).toEqual([])
        }
    )
})
