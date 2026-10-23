import { test, expect } from '@playwright/test'

test('homepage hero text visible', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Personalize. Generate. Send.')).toBeVisible()
})

test('docs index loads', async ({ page }) => {
  await page.goto('/docs')
  await expect(page.getByText('Getting Started')).toBeVisible()
})

test('pricing page mentions credits', async ({ page }) => {
  await page.goto('/pricing')
  await expect(page.getByText(/credits/i)).toBeVisible()
})

test('login page shows Continue with Google', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByText('Continue with Google')).toBeVisible()
})
