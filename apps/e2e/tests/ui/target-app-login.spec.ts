import { test, expect } from '@playwright/test'
import { env } from '../../config/env.js'

/**
 * Runs against apps/target-app (the throwaway Django admin app started by
 * the repo root docker-compose.yml) -- a real login flow, not a placeholder.
 * Point BASE_URL at it (default local port 8000) to exercise this file.
 */

test('logging in with valid credentials reaches the admin index', async ({ page }) => {
  await page.goto('/admin/login/')

  await page.locator('#id_username').fill(env.targetAdminUsername)
  await page.locator('#id_password').fill(env.targetAdminPassword)
  await page.getByRole('button', { name: 'Log in' }).click()

  await expect(page.getByRole('heading', { name: 'Site administration' })).toBeVisible()
  await expect(page.getByText(env.targetAdminUsername)).toBeVisible()
})

test('logging in with a wrong password is rejected', async ({ page }) => {
  await page.goto('/admin/login/')

  await page.locator('#id_username').fill(env.targetAdminUsername)
  await page.locator('#id_password').fill('definitely-the-wrong-password')
  await page.getByRole('button', { name: 'Log in' }).click()

  await expect(
    page.getByText('Please enter the correct username and password'),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Site administration' })).not.toBeVisible()
})

test('the admin index redirects an anonymous visitor to login', async ({ page }) => {
  await page.goto('/admin/')

  await expect(page).toHaveURL(/\/admin\/login\/\?next=/)
})
