import { expect, test } from '@playwright/test'

test('the REST and realtime foundation paths are live', async ({ page }) => {
  await page.goto('/validation')
  await expect(page.getByTestId('health-status')).toHaveText('REST Axios/MSW: ok (mock-api)')
  await expect(page.getByTestId('socket-status')).toHaveText('Socket.IO/MSW: event received')
  await page.getByRole('link', { name: 'Início' }).click()
  await expect(page).toHaveURL('/')
  await page.goto('/validation')
  await expect(page).toHaveURL('/validation')
  await expect(page.getByRole('button', { name: 'Componente shadcn' })).toBeVisible()
})

test('a catalog mutation travels through MSW Socket.IO as nft.updated', async ({ page }) => {
  await page.goto('/validation')
  await expect(page.getByTestId('socket-status')).toHaveText('Socket.IO/MSW: event received')
  const response = await page.evaluate(async () => {
    await fetch('/api/__mock/reset', { method: 'POST' })
    const update = await fetch('/api/__mock/nfts/nft-jaguar', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ available: 7 }) })
    return update.status
  })
  expect(response).toBe(200)
  await expect(page.getByTestId('socket-nft-event')).toHaveText('NFT event: nft-jaguar@2')
})

test('a fixture session can be created through the MSW mock control', async ({ page }) => {
  await page.goto('/validation')
  await expect(page.getByTestId('socket-status')).toHaveText('Socket.IO/MSW: event received')
  const response = await page.evaluate(async () => {
    const session = await fetch('/api/__mock/reset?session=user-ana', { method: 'POST' })
    return { status: session.status, body: await session.json() as { token?: string } }
  })
  expect(response.status).toBe(200)
  expect(response.body.token).toMatch(/^session-/)
})

test('order.updated is delivered only to its authenticated Socket.IO subscriber', async ({ page }) => {
  await page.goto('/validation')
  await expect(page.getByTestId('socket-status')).toHaveText('Socket.IO/MSW: event received')
  const anaToken = await page.evaluate(async () => {
    const response = await fetch('/api/__mock/reset?session=user-ana', { method: 'POST' })
    return (await response.json() as { token: string }).token
  })
  await page.evaluate((token) => {
    localStorage.setItem('jungle-session-token', token)
    window.dispatchEvent(new Event('jungle-session-changed'))
  }, anaToken)
  await expect(page.getByTestId('socket-session')).toHaveText('Socket session: user-ana')

  const brunoStatus = await page.evaluate(async () => {
    const bruno = await (await fetch('/api/__mock/sessions/user-bruno', { method: 'POST' })).json() as { token: string }
    const headers = { 'content-type': 'application/json', 'x-session-token': bruno.token }
    await fetch('/api/cart/items', { method: 'PUT', headers, body: JSON.stringify({ nftId: 'nft-toucan', editionId: 'nft-toucan-standard', quantity: 1 }) })
    const quote = await (await fetch('/api/quotes', { method: 'POST', headers, body: '{}' })).json() as { id: string }
    return (await fetch('/api/orders', { method: 'POST', headers: { ...headers, 'idempotency-key': 'bruno-private' }, body: JSON.stringify({ quoteId: quote.id, walletId: 'wallet-bruno-main' }) })).status
  })
  expect(brunoStatus).toBe(200)
  await page.waitForTimeout(100)
  await expect(page.getByTestId('socket-order-event')).toHaveText('Order event: waiting')

  const anaStatus = await page.evaluate(async (token) => {
    const headers = (sessionToken: string) => ({ 'content-type': 'application/json', 'x-session-token': sessionToken })
    await fetch('/api/cart/items', { method: 'PUT', headers: headers(token), body: JSON.stringify({ nftId: 'nft-jaguar', editionId: 'nft-jaguar-standard', quantity: 1 }) })
    const quote = await (await fetch('/api/quotes', { method: 'POST', headers: headers(token), body: '{}' })).json() as { id: string }
    return (await fetch('/api/orders', { method: 'POST', headers: { ...headers(token), 'idempotency-key': 'ana-private' }, body: JSON.stringify({ quoteId: quote.id, walletId: 'wallet-ana-main' }) })).status
  }, anaToken)
  expect(anaStatus).toBe(200)
  await expect(page.getByTestId('socket-order-event')).toHaveText(/Order event: order-\d+@1/)
})
