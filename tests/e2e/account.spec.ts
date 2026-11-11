import { expect, test, type Page } from '@playwright/test'

async function reset(page: Page) {
  await page.goto('/')
  await page.evaluate(() => fetch('/api/__mock/reset', { method: 'POST' }))
}

async function login(page: Page, email: string, password: string, returnTo = '/profile') {
  await page.goto(`/login?returnTo=${encodeURIComponent(returnTo)}`)
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

test('login returns to the requested private page and the session survives refresh', async ({ page }) => {
  await reset(page)
  await login(page, 'ana@jungle.test', 'Jungle#123')
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
  await expect(page.locator('input').first()).toHaveValue('Ana Collector')
})

test('favorites are private to the authenticated collector and logout clears the account', async ({ page }) => {
  await reset(page)
  await login(page, 'ana@jungle.test', 'Jungle#123', '/nft/jaguar')
  await expect(page.getByRole('button', { name: 'Remover favorito' })).toBeVisible()
  await page.getByRole('button', { name: 'Remover favorito' }).click()
  await expect(page.getByRole('button', { name: 'Favoritar' })).toBeVisible()
  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
  await login(page, 'bruno@jungle.test', 'Jungle#456', '/nft/jaguar')
  await expect(page.getByRole('button', { name: 'Favoritar' })).toBeVisible()
})
