import { expect, test } from '@playwright/test'
import { layoutShift } from './support.js'

// Cumulative layout shift of a cold load, without throttling. The stage's lab measurement with throttling is a
// separate report; these checks keep the causes of shifts (unreserved covers, a loading state of another shape than
// the content) from coming back.
for (const path of ['/books', '/']) {
    for (const viewport of [
        { width: 1440, height: 900 },
        { width: 390, height: 844 },
    ]) {
        test(`${path} at ${viewport.width}px shifts the layout by at most 0.1`, async ({ browser }) => {
            const { cls, shifts } = await layoutShift(browser, path, viewport)

            expect(cls, JSON.stringify(shifts)).toBeLessThanOrEqual(0.1)
        })
    }
}

// With a slow API the loading state is painted: the heading, the search and the categories above the list must stay
// where they are when the books arrive
test('the catalogue header keeps its place while a slow list loads', async ({ browser }) => {
    const { shifts } = await layoutShift(browser, '/books', { width: 390, height: 844 }, { apiDelay: 800 })

    const header = shifts.flatMap((shift) => shift.sources).filter((source) => /catalog-|v-input/.test(source.node))
    expect(header, JSON.stringify(header)).toEqual([])
})
