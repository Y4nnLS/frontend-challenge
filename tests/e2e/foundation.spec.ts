import { expect, test } from '@playwright/test'

test('the REST and realtime foundation paths are live', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('health-status')).toHaveText(
    'REST Axios/MSW: ok (mock-api)',
  )
  await expect(page.getByTestId('socket-status')).toHaveText(
    'Socket.IO/MSW: event received',
  )

  await page.getByRole('link', { name: 'Validação' }).click()
  await expect(page).toHaveURL('/validation')
  await expect(page.getByRole('button', { name: 'Componente shadcn' })).toBeVisible()
})
