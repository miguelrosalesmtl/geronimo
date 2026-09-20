import { test, expect } from '@playwright/test'

/**
 * PLACEHOLDER — replace once a real target application is chosen.
 *
 * This only proves the pipeline works end to end: the browser can reach
 * BASE_URL, and a passing/failing result here flows through to the JSON
 * report and on into reports-backend. Real UI flows (create user, log in,
 * manage a test account, ...) belong in sibling files in this directory.
 */
test('the target application is reachable and renders something', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.ok(), `expected BASE_URL to respond with a 2xx status`).toBeTruthy()
  await expect(page.locator('body')).not.toBeEmpty()
})
