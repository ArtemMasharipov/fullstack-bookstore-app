import { STATUS_COLORS } from '@/utils/orderStatus'

export const USERS_LIST = {
    sorts: ['-createdAt', 'createdAt', 'username', '-username', 'email', '-email', 'lastLogin', '-lastLogin'],
    defaultSort: '-createdAt',
    filters: {
        role: (value) => ['user', 'admin'].includes(value),
        isActive: (value) => ['true', 'false'].includes(value),
    },
}

export const ORDERS_LIST = {
    sorts: ['-createdAt', 'createdAt'],
    defaultSort: '-createdAt',
    search: false,
    filters: {
        status: (value) => Object.hasOwn(STATUS_COLORS, value),
        paymentStatus: (value) => ['unpaid', 'paid', 'failed', 'refunded'].includes(value),
    },
}
