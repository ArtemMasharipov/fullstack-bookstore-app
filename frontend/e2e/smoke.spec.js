import { expect, test } from '@playwright/test'
import { SMOKE_BOOK_TITLE } from '../../backend/scripts/seed-data.js'

test('catalog shows a seeded book and opens its page', async ({ page }) => {
    // The catalogue must come from the e2e API through the /api proxy of the preview, not from another API
    const booksResponse = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/v1/books')
    await page.goto('/books')
    expect((await booksResponse).url()).toMatch(/^http:\/\/localhost:4173\/api\//)
    const card = page.locator('.book-card').filter({ hasText: SMOKE_BOOK_TITLE })
    await expect(card).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'cs')
    await expect(page).toHaveTitle('Knihy | Bookstore')
    await card.click()
    await expect(page).toHaveURL(/\/books\/[a-f0-9]{24}$/)
    await expect(page.getByRole('heading', { level: 1, name: SMOKE_BOOK_TITLE })).toBeVisible()
})
