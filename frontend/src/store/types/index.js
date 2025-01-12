export const AUTH = {
    LOGIN: 'auth/LOGIN',
    LOGOUT: 'auth/LOGOUT',
    SET_USER: 'auth/SET_USER',
    SET_TOKEN: 'auth/SET_TOKEN',
    SET_PERMISSIONS: 'auth/SET_PERMISSIONS',
}

export const BOOKS = {
    SET_LIST: 'books/SET_LIST',
    SET_CURRENT: 'books/SET_CURRENT',
    ADD_BOOK: 'books/ADD_BOOK',
    UPDATE_BOOK: 'books/UPDATE_BOOK',
    DELETE_BOOK: 'books/DELETE_BOOK',
    UPDATE_FILTERS: 'books/UPDATE_FILTERS',
    UPDATE_PAGINATION: 'books/UPDATE_PAGINATION',
}

export const AUTHORS = {
    SET_LIST: 'authors/SET_LIST',
    SET_CURRENT: 'authors/SET_CURRENT',
    ADD_AUTHOR: 'authors/ADD_AUTHOR',
    UPDATE_AUTHOR: 'authors/UPDATE_AUTHOR',
    DELETE_AUTHOR: 'authors/DELETE_AUTHOR',
}

export const CART = {
    SET_ITEMS: 'cart/SET_ITEMS',
    ADD_ITEM: 'cart/ADD_ITEM', 
    REMOVE_ITEM: 'cart/REMOVE_ITEM',
    UPDATE_QUANTITY: 'cart/UPDATE_QUANTITY',
    CLEAR: 'cart/CLEAR',
    SET_TOTAL: 'cart/SET_TOTAL',
    SYNC_CART: 'cart/SYNC_CART',
    FETCH_CART: 'cart/FETCH_CART',
    SET_PENDING: 'cart/SET_PENDING',
    SET_TIMESTAMP: 'cart/SET_TIMESTAMP'
}

export const USERS = {
    FETCH_ALL: 'users/FETCH_ALL',
    FETCH_ONE: 'users/FETCH_ONE',
    SET_LIST: 'users/SET_LIST',
    SET_CURRENT: 'users/SET_CURRENT',
}

export const UI = {
    SET_LOADING: 'ui/SET_LOADING',
    SET_ERROR: 'ui/SET_ERROR',
    CLEAR_ERROR: 'ui/CLEAR_ERROR',
}

export const ORDER = {
    SET_ORDERS: 'order/SET_ORDERS',
    SET_CURRENT: 'order/SET_CURRENT',
    ADD_ORDER: 'order/ADD_ORDER',
    UPDATE_STATUS: 'order/UPDATE_STATUS'
}
