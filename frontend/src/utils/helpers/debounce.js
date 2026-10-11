/**
 * Derived from the debounce function of lodash (https://lodash.com).
 *
 * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
 *
 * Based on Underscore.js, copyright Jeremy Ashkenas,
 * DocumentCloud and Investigative Reporters & Editors <http://underscorejs.org/>
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * Simple native debounce implementation
 * Replaces lodash debounce functionality
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {Object} options - Options object
 * @returns {Function} Debounced function
 */
export function debounce(func, wait, options = {}) {
    if (typeof func !== 'function') {
        throw new TypeError('Expected a function')
    }

    wait = Number(wait) || 0
    const leading = !!options.leading
    const trailing = 'trailing' in options ? !!options.trailing : true

    let timeoutId
    let lastArgs
    let lastThis
    let result
    let lastCallTime

    function invokeFunc() {
        const args = lastArgs
        const thisArg = lastThis

        lastArgs = lastThis = undefined
        result = func.apply(thisArg, args)
        return result
    }

    function shouldInvoke(time) {
        const timeSinceLastCall = time - lastCallTime
        return lastCallTime === undefined || timeSinceLastCall >= wait || timeSinceLastCall < 0
    }

    function timerExpired() {
        const time = Date.now()
        if (shouldInvoke(time)) {
            return trailingEdge()
        }
        timeoutId = setTimeout(timerExpired, wait - (time - lastCallTime))
    }

    function trailingEdge() {
        timeoutId = undefined
        if (trailing && lastArgs) {
            return invokeFunc()
        }
        lastArgs = lastThis = undefined
        return result
    }

    function cancel() {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId)
        }
        lastArgs = lastThis = timeoutId = undefined
    }

    function flush() {
        return timeoutId === undefined ? result : trailingEdge()
    }

    function pending() {
        return timeoutId !== undefined
    }

    const debounced = function (...args) {
        const time = Date.now()
        const isInvoking = shouldInvoke(time)

        lastArgs = args
        lastThis = this
        lastCallTime = time

        if (isInvoking) {
            if (timeoutId === undefined) {
                if (leading) {
                    return invokeFunc()
                }
            }
        }
        if (timeoutId === undefined) {
            timeoutId = setTimeout(timerExpired, wait)
        }
        return result
    }

    debounced.cancel = cancel
    debounced.flush = flush
    debounced.pending = pending

    return debounced
}
