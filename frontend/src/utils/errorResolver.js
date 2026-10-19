export const ERROR_CODES = Object.freeze([
    'VALIDATION_FAILED',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'NOT_FOUND',
    'CONFLICT',
    'PRICE_CHANGED',
    'UNPROCESSABLE',
    'RATE_LIMITED',
    'INTERNAL',
    'BOOK_UNAVAILABLE',
    'CART_ITEM_NOT_FOUND',
    'CART_EMPTY',
    'CART_HAS_UNAVAILABLE_ITEMS',
    'INVALID_TRANSITION',
    'IDEMPOTENCY_CONFLICT',
    'ADMIN_SELF_CHANGE',
    'LAST_ADMIN',
    'AUTHOR_HAS_BOOKS',
])

export function resolveErrorKey(error) {
    const code = [error?.code, error?.response?.data?.error?.code, error?.data?.error?.code].find(
        (candidate) => typeof candidate === 'string' && ERROR_CODES.includes(candidate)
    )
    return code ? `errors.${code}` : 'errors.UNKNOWN'
}
