// The seeded accounts of the e2e API: playwright.config.js gives these passwords to the seed, the tests sign in
// with them. Fixed test passwords, not secrets.
export const SEEDED = Object.freeze({
    admin: Object.freeze({ email: 'admin@bookstore.local', password: 'e2e-admin-pass' }),
    user: Object.freeze({ email: 'reader@bookstore.local', password: 'e2e-user-pass' }),
})
