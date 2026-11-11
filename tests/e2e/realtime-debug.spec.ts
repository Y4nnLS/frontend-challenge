import { expect, test } from '@playwright/test'

test('reports whether the MSW websocket handler observes a Socket.IO connection', async ({ page }) => {
  await page.goto('/validation')
  await expect(page.getByTestId('socket-status')).toHaveText('Socket.IO/MSW: event received')
  await expect.poll(async () => page.evaluate(async () => {
    const connection = await (await fetch('/api/__mock/realtime-connections')).json() as { count: number }
    return connection.count
  })).toBeGreaterThanOrEqual(1)
})
