import baseApi from './baseApi'

/**
 * Orders API
 * Unwraps the envelope: single orders come back as the order, lists as
 * { items, pagination }.
 */
const unwrap = (response) => response.data.data
const page = (response) => ({ items: response.data.data, pagination: response.data.pagination })

export const orderApi = {
    /**
     * Places an order from the cart. The same key repeats the same request:
     * the server answers 200 with the order it placed before.
     */
    create: (body, idempotencyKey) =>
        baseApi
            .post('/orders', body, { headers: { 'Idempotency-Key': idempotencyKey } })
            .then((response) => ({ order: unwrap(response), replayed: response.status === 200 })),

    list: (params) => baseApi.get('/orders', { params }).then(page),

    get: (id) => baseApi.get(`/orders/${id}`).then(unwrap),

    cancel: (id) => baseApi.patch(`/orders/${id}/cancel`).then(unwrap),

    adminList: (params) => baseApi.get('/orders/admin/all', { params }).then(page),

    adminStats: () => baseApi.get('/orders/admin/stats').then(unwrap),

    adminSetStatus: (id, status, expectedState) =>
        baseApi.patch(`/orders/${id}/status`, { status, ...(expectedState && { expectedState }) }).then(unwrap),

    adminSetPayment: (id, paymentStatus, expectedState) =>
        baseApi.patch(`/orders/${id}/payment`, { paymentStatus, ...(expectedState && { expectedState }) }).then(unwrap),
}
