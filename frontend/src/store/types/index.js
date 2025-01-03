export const AUTH = {
    LOGIN: 'auth/LOGIN',
    LOGOUT: 'auth/LOGOUT',
    SET_USER: 'auth/SET_USER',
    SET_TOKEN: 'auth/SET_TOKEN',
    SET_PERMISSIONS: 'auth/SET_PERMISSIONS'
}

export const BOOKS = {
    FETCH_ALL: 'books/FETCH_ALL',
    FETCH_ONE: 'books/FETCH_ONE',
    SET_LIST: 'books/SET_LIST',
    SET_CURRENT: 'books/SET_CURRENT',
    UPDATE_FILTERS: 'books/UPDATE_FILTERS',
    UPDATE_PAGINATION: 'books/UPDATE_PAGINATION'
}

export const AUTHORS = {
    SET_LIST: 'authors/SET_LIST',
    SET_CURRENT: 'authors/SET_CURRENT',
    ADD_AUTHOR: 'authors/ADD_AUTHOR',
    UPDATE_AUTHOR: 'authors/UPDATE_AUTHOR',
    DELETE_AUTHOR: 'authors/DELETE_AUTHOR'
}

export const CART = {
    ADD_ITEM: 'cart/ADD_ITEM',
    REMOVE_ITEM: 'cart/REMOVE_ITEM',
    UPDATE_QUANTITY: 'cart/UPDATE_QUANTITY',
    CLEAR: 'cart/CLEAR'
}

export const USERS = {
    FETCH_ALL: 'users/FETCH_ALL',
    FETCH_ONE: 'users/FETCH_ONE',
    SET_LIST: 'users/SET_LIST',
    SET_CURRENT: 'users/SET_CURRENT'
}

export const UI = {
    SET_LOADING: 'SET_LOADING',
    SET_ERROR: 'SET_ERROR',
    CLEAR_ERROR: 'CLEAR_ERROR'
}