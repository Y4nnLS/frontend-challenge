import { expect, test, type Page } from '@playwright/test'

async function reset(page: Page) {
  await page.goto('/')
  await page.evaluate(() => fetch('/api/__mock/reset', { method: 'POST' }))
  await page.reload()
}

async function beginCheckout(page: Page) {
  await page.goto('/nft/jaguar')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByRole('status')).toContainText('adicionado ao carrinho')
  await page.goto('/cart')
  await page.getByLabel('Cupom').fill('JUNGLE10')
  await page.getByRole('button', { name: 'Aplicar cupom' }).click()
  await expect(page.getByRole('status')).toContainText('aplicado')
  await page.getByRole('link', { name: 'Ir para pagamento' }).click()
  await page.getByRole('link', { name: 'Entrar' }).click()
  await page.getByLabel('E-mail').fill('ana@jungle.test')
  await page.getByLabel('Senha').fill('Jungle#123')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { name: 'Pagamento' })).toBeVisible()
  await page.getByRole('button', { name: 'Revalidar cotação' }).click()
  await expect(page.getByRole('status')).toContainText('Cotação revalidada')
}

test('guest cart merges after login and produces an API-confirmed immutable receipt', async ({ page }) => {
  await reset(page)
  await beginCheckout(page)
  await page.getByRole('button', { name: 'Confirmar pedido' }).click()
  await expect(page.getByRole('heading', { name: 'Pedido confirmado' })).toBeVisible()
  await expect(page.getByText('Recibo imutável')).toBeVisible()
})

test('a declined simulated payment does not present a confirmed receipt', async ({ page }) => {
  await reset(page)
  await beginCheckout(page)
  await page.evaluate(() => fetch('/api/__mock/scenario', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orderOutcome: 'declined' }) }))
  await page.getByRole('button', { name: 'Confirmar pedido' }).click()
  await expect(page.getByRole('heading', { name: 'Pedido recusado' })).toBeVisible()
  await expect(page.getByText('Seus itens continuam no carrinho.')).toBeVisible()
})

test('timeout after order creation retries the same idempotent request', async ({ page }) => {
  await reset(page)
  await beginCheckout(page)
  await page.evaluate(() => fetch('/api/__mock/scenario', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ timeoutAfterCreate: true }) }))
  await page.getByRole('button', { name: 'Confirmar pedido' }).click()
  await expect(page.getByRole('heading', { name: 'Pedido confirmado' })).toBeVisible()
})
