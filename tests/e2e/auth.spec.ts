import { test, expect } from '@playwright/test'

test('login page shows Continue with Google', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByText('Continue with Google')).toBeVisible()
})

test('unauthenticated /dashboard redirects to /login', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login/)
})

test('unauthenticated /admin redirects to /login', async ({ page }) => {
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/login/)
})
