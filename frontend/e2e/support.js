import { expect } from '@playwright/test'

// A new account, registered through the API; answers its credentials
export async function signUp(page) {
    const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`
    const user = { username: `buyer${stamp}`, email: `buyer-${stamp}@example.com`, password: 'secret123' }
    const registered = await page.request.post('/api/v1/auth/register', { data: user })
    expect(registered.status()).toBe(201)
    return user
}

// Signs in through the form: on the sign-in page already open, or on the one of this language; answers the token
export async function signIn(page, user, prefix = '') {
    if (!new URL(page.url()).pathname.endsWith('/login')) await page.goto(`${prefix}/login`)
    await page.locator('input[autocomplete="username"]').fill(user.email)
    await page.locator('input[autocomplete="current-password"]').fill(user.password)
    await page.locator('form button[type="submit"]').click()
    await expect(page).not.toHaveURL((url) => url.pathname.endsWith('/login'))
    return page.evaluate(() => localStorage.getItem('token'))
}

// The same token with a forged signature: it still reads as unexpired, but the API refuses it
export function brokenToken(token) {
    const [header, payload] = token.split('.')
    return `${header}.${payload}.${'A'.repeat(43)}`
}
