// The seeded accounts of the e2e API: playwright.config.js gives these passwords to the seed, the tests sign in
// with them. Fixed test passwords, not secrets.
export const SEEDED = Object.freeze({
    admin: Object.freeze({ email: 'admin@bookstore.local', password: 'Cedar lantern 47!' }),
    user: Object.freeze({ email: 'reader@bookstore.local', password: 'Velvet compass 92!' }),
})
