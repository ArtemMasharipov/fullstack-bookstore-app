import { createStore } from 'vuex'
import auth from './modules/auth'
import books from './modules/books'
import authors from './modules/authors'
import cart from './modules/cart'
import users from './modules/users'

export default createStore({
    modules: {
        auth,
        books,
        authors,
        cart,
        users
    },
    strict: process.env.NODE_ENV !== 'production'
})