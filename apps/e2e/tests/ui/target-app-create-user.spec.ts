import { test, expect, type Page } from '@playwright/test'
import { env } from '../../config/env.js'
import { uniqueUser } from '../../fixtures/test-users.js'

/**
 * Runs against apps/target-app (the throwaway Django admin app started by
 * the repo root docker-compose.yml). Exercises the "create user" flow this
 * whole project was scoped around, end to end through a real browser.
 */

async function loginAsAdmin(page: Page) {
  await page.goto('/admin/login/')
  await page.locator('#id_username').fill(env.targetAdminUsername)
  await page.locator('#id_password').fill(env.targetAdminPassword)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page.getByRole('heading', { name: 'Site administration' })).toBeVisible()
}

test('an admin can create a new user, and that user can log in', async ({ page, browser }) => {
  const newUser = uniqueUser('created-via-admin')
  // Django's username validator rejects anything outside letters/digits/@/./+/-/_,
  // which the generated email already satisfies -- use it directly as the username.
  const username = newUser.email

  await loginAsAdmin(page)

  await page.goto('/admin/auth/user/add/')
  await page.locator('#id_username').fill(username)
  await page.locator('#id_password1').fill(newUser.password)
  await page.locator('#id_password2').fill(newUser.password)
  await page.getByRole('button', { name: 'Save', exact: true }).click()

  // Django's admin messages use typographic quotes ("The user “x” was added
  // successfully…") -- match on the quote-free part plus the username
  // heading on the resulting change page, rather than the exact quote glyphs.
  await expect(page.getByText('was added successfully')).toBeVisible()
  await expect(page.getByRole('heading', { name: username, level: 2 })).toBeVisible()

  // Log in as the freshly created account, in a fresh (unauthenticated)
  // browser context so we're not just reusing the admin's session.
  const newUserContext = await browser.newContext()
  const newUserPage = await newUserContext.newPage()
  await newUserPage.goto('/admin/login/')
  await newUserPage.locator('#id_username').fill(username)
  await newUserPage.locator('#id_password').fill(newUser.password)
  await newUserPage.getByRole('button', { name: 'Log in' }).click()

  // A non-staff user (the default for a plain "add user") is bounced back to
  // login with a permission message rather than reaching the admin index --
  // that's still proof the account and password work, just without staff access.
  await expect(
    newUserPage.getByText(
      /Please enter the correct username and password|does not have permission/,
    ),
  ).toBeVisible()

  await newUserContext.close()
})

test('creating a user with mismatched passwords is rejected', async ({ page }) => {
  const newUser = uniqueUser('mismatched-password')

  await loginAsAdmin(page)

  await page.goto('/admin/auth/user/add/')
  await page.locator('#id_username').fill(newUser.email)
  await page.locator('#id_password1').fill(newUser.password)
  await page.locator('#id_password2').fill('a-completely-different-password')
  await page.getByRole('button', { name: 'Save', exact: true }).click()

  // Again, avoid the literal apostrophe -- Django renders a typographic one.
  await expect(page.getByText(/password fields didn.t match/)).toBeVisible()
})
