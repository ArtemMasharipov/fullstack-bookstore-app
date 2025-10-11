/**
 * Native debounce implementation
 * Replaces lodash debounce functionality
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {Object} options - Options object
 * @returns {Function} Debounced function
 */
export function debounce(func, wait, options = {}) {
    let timeoutId
    let lastCallTime
    let lastInvokeTime = 0
    let leading = false
    let maxing = false
    let trailing = true

    if (typeof func !== 'function') {
        throw new TypeError('Expected a function')
    }

    wait = Number(wait) || 0
    if (typeof options === 'object') {
        leading = !!options.leading
        maxing = 'maxWait' in options
        trailing = 'trailing' in options ? !!options.trailing : trailing
    }

    function invokeFunc(time) {
        const args = lastArgs
        const thisArg = lastThis

        lastArgs = lastThis = undefined
        lastInvokeTime = time
        result = func.apply(thisArg, args)
        return result
    }

    function leadingEdge(time) {
        lastInvokeTime = time
        timeoutId = setTimeout(timerExpired, wait)
        return leading ? invokeFunc(time) : result
    }

    function remainingWait(time) {
        const timeSinceLastCall = time - lastCallTime
        const timeSinceLastInvoke = time - lastInvokeTime
        const timeWaiting = wait - timeSinceLastCall

        return maxing
            ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
            : timeWaiting
    }

    function shouldInvoke(time) {
        const timeSinceLastCall = time - lastCallTime
        const timeSinceLastInvoke = time - lastInvokeTime

        return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
            (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait))
    }

    function timerExpired() {
        const time = Date.now()
        if (shouldInvoke(time)) {
            return trailingEdge(time)
        }
        timeoutId = setTimeout(timerExpired, remainingWait(time))
    }

    function trailingEdge(time) {
        timeoutId = undefined

        if (trailing && lastArgs) {
            return invokeFunc(time)
        }
        lastArgs = lastThis = undefined
        return result
    }

    function cancel() {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId)
        }
        lastInvokeTime = 0
        lastArgs = lastCallTime = lastThis = timeoutId = undefined
    }

    function flush() {
        return timeoutId === undefined ? result : trailingEdge(Date.now())
    }

    function pending() {
        return timeoutId !== undefined
    }

    let lastArgs
    let lastThis
    let result
    let timeoutId

    const debounced = function (...args) {
        const time = Date.now()
        const isInvoking = shouldInvoke(time)

        lastArgs = args
        lastThis = this
        lastCallTime = time

        if (isInvoking) {
            if (timeoutId === undefined) {
                return leadingEdge(lastCallTime)
            }
            if (maxing) {
                timeoutId = setTimeout(timerExpired, wait)
                return invokeFunc(lastCallTime)
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
