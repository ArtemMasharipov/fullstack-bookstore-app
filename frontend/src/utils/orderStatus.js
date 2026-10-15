/** Chip colors of order statuses, shared by the order screens */
export const STATUS_COLORS = Object.freeze({
    pending: 'warning',
    processing: 'info',
    shipped: 'primary',
    delivered: 'success',
    cancelled: 'error',
})

/** A pending order that is not paid can still be cancelled by the customer */
export const isCancellable = (order) => order.status === 'pending' && ['unpaid', 'failed'].includes(order.paymentStatus)
