import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick, reactive } from 'vue'
import BookCover from './BookCover.vue'

const COVER = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%2F%3E'

let app

afterEach(() => {
    app?.unmount()
    document.body.replaceChildren()
})

// Mounts the cover with reactive props, so a test can change them later
function mount(initial) {
    const props = reactive({ title: 'Babička', author: 'Božena Němcová', ...initial })
    const root = document.createElement('div')
    document.body.append(root)
    app = createApp({ render: () => h(BookCover, props) })
    app.mount(root)
    return { props, cover: () => root.querySelector('.book-cover') }
}

describe('BookCover', () => {
    it('shows the cover lazily with an empty alt', () => {
        const { cover } = mount({ src: COVER })
        const img = cover().querySelector('img')

        expect(img.getAttribute('alt')).toBe('')
        expect(img.getAttribute('loading')).toBe('lazy')
        expect(img.getAttribute('decoding')).toBe('async')
        expect(img.hasAttribute('fetchpriority')).toBe(false)
    })

    it('reserves a 2:3 box', () => {
        const { cover } = mount({ src: COVER })

        expect(cover().style.getPropertyValue('aspect-ratio')).toBe('2 / 3')
    })

    it('draws the title and the author when there is no image', () => {
        const { cover } = mount({})
        const placeholder = cover().querySelector('.book-cover__placeholder')

        expect(cover().querySelector('img')).toBeNull()
        expect(placeholder.textContent).toContain('Babička')
        expect(placeholder.textContent).toContain('Božena Němcová')
        expect(placeholder.getAttribute('aria-hidden')).toBe('true')
    })

    it('falls back to the placeholder when the image fails to load', async () => {
        const { props, cover } = mount({ src: 'https://example.invalid/missing.jpg' })

        cover().querySelector('img').dispatchEvent(new Event('error'))
        await nextTick()

        expect(cover().querySelector('img')).toBeNull()
        expect(cover().querySelector('.book-cover__placeholder').textContent).toContain('Babička')

        props.src = COVER
        await nextTick()

        expect(cover().querySelector('img')).not.toBeNull()
    })

    it('loads a priority cover eagerly with high fetch priority', () => {
        const { cover } = mount({ src: COVER, priority: true })
        const img = cover().querySelector('img')

        expect(img.getAttribute('loading')).toBe('eager')
        expect(img.getAttribute('fetchpriority')).toBe('high')
    })

    it('loads an eager cover without raising its priority', () => {
        const { cover } = mount({ src: COVER, eager: true })
        const img = cover().querySelector('img')

        expect(img.getAttribute('loading')).toBe('eager')
        expect(img.hasAttribute('fetchpriority')).toBe(false)
    })
})
