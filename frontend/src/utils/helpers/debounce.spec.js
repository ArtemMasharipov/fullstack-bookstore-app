import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { debounce } from './debounce'

describe('debounce', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('calls the function once with the last arguments after the wait elapses', () => {
        const fn = vi.fn()
        const debounced = debounce(fn, 300)

        debounced('a')
        debounced('b')
        debounced('c')

        vi.advanceTimersByTime(299)
        expect(fn).not.toHaveBeenCalled()

        vi.advanceTimersByTime(1)
        expect(fn).toHaveBeenCalledTimes(1)
        expect(fn).toHaveBeenCalledWith('c')
    })

    it('does not call the function after cancel()', () => {
        const fn = vi.fn()
        const debounced = debounce(fn, 300)

        debounced('a')
        debounced.cancel()
        vi.advanceTimersByTime(300)

        expect(fn).not.toHaveBeenCalled()
    })
})
