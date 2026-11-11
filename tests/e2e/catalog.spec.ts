import { expect, test, type Page } from '@playwright/test'

const catalogSearch = (page: Page) => page.locator('.desktop-catalog-search input:visible, .mobile-search-field input:visible')
const catalogSort = (page: Page, isMobile: boolean) => page.getByLabel(isMobile ? 'Ordenar catálogo no celular' : 'Ordenar catálogo', { exact: true })

async function openFilters(page: Page, isMobile: boolean) {
  if (isMobile) await page.getByRole('button', { name: 'Alternar filtros' }).click()
}

async function resetMock(page: Page) {
  await page.goto('/')
  await page.evaluate(() => fetch('/api/__mock/reset', { method: 'POST' }))
  await page.reload()
  await expect(page.getByRole('button', { name: 'Todos os NFTs' })).toBeVisible()
  await expect(page.locator('.nft-card')).toHaveCount(9)
}

async function setScenario(page: Page, patch: Record<string, unknown>) {
  const status = await page.evaluate(async (scenario) => {
    const response = await fetch('/api/__mock/scenario', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(scenario),
    })
    return response.status
  }, patch)
  expect(status).toBe(200)
}

test.beforeEach(async ({ page }) => {
  await resetMock(page)
})

test('catalog renders data from the mock API and opens a detail', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Todos os NFTs' })).toBeVisible()
  await expect(page.locator('.nft-card')).toHaveCount(9)
  await page.getByRole('link', { name: /Ver Emerald Ape #042/ }).click()
  await expect(page).toHaveURL(/\/nft\/jaguar/)
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
})

test('search, category, sorting and browser history follow URL state', async ({ page, isMobile }) => {
  if (!isMobile) await page.getByRole('button', { name: 'Buscar NFTs' }).click()
  const search = catalogSearch(page)
  await expect(search).toBeVisible()
  await search.fill('Emerald')
  await expect(page).toHaveURL(/query=Emerald/)
  await expect(page.locator('.nft-card')).toHaveCount(1)
  await search.fill('')
  await expect(page.locator('.nft-card')).toHaveCount(9)
  await openFilters(page, isMobile)
  await page.getByLabel('Colecionáveis').check()
  await expect(page).toHaveURL(/category=animals/)
  await expect(page.locator('.nft-card')).toHaveCount(9)
  await catalogSort(page, isMobile).selectOption('price-asc')
  await expect(page).toHaveURL(/sort=price-asc/)
  await expect(page.locator('.nft-card').first()).toContainText('Golden Signal #160')
  await page.reload()
  await expect(page.locator('.nft-card')).toHaveCount(9)
})

test('empty results and reset remain functional', async ({ page }) => {
  if (await page.getByRole('button', { name: 'Buscar NFTs' }).isVisible()) await page.getByRole('button', { name: 'Buscar NFTs' }).click()
  const search = catalogSearch(page)
  await expect(search).toBeVisible()
  await search.fill('no-result-example')
  await expect(page.getByText('Nenhum NFT encontrado.')).toBeVisible()
  await page.getByRole('button', { name: 'Limpar busca e filtros' }).click()
  await expect(page.locator('.nft-card')).toHaveCount(9)
})

test('browser back and forward restore the catalog URL state', async ({ page, isMobile }) => {
  await openFilters(page, isMobile)
  await page.getByLabel('Colecionáveis').check()
  await expect(page).toHaveURL(/category=animals/)
  await expect(page.locator('.nft-card')).toHaveCount(9)

  await page.goBack()
  await expect(page).not.toHaveURL(/category=animals/)
  await expect(page.locator('.nft-card')).toHaveCount(9)

  await page.goForward()
  await expect(page).toHaveURL(/category=animals/)
  await expect(page.locator('.nft-card')).toHaveCount(9)
})

test('direct NFT detail and an unknown NFT resolve to their expected states', async ({ page }) => {
  await page.goto('/nft/jaguar')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  await expect(page.getByText('Kurio Editions')).toBeVisible()

  await page.goto('/nft/not-a-real-nft')
  await expect(page.getByRole('alert')).toContainText('NFT não encontrado')
  await expect(page.getByRole('link', { name: 'Voltar ao catálogo' })).toBeVisible()
})

test('a delayed catalog request shows skeletons before its data', async ({ page }) => {
  await setScenario(page, { latencyMs: 350 })
  await page.reload()

  await expect(page.getByLabel('Carregando NFTs')).toBeVisible()
  await expect(page.locator('.nft-card')).toHaveCount(9)
})

test('a network failure presents retry and recovers through the API', async ({ page }) => {
  await setScenario(page, { failNext: 'network' })
  await page.reload()

  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar os NFTs.')
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.locator('.nft-card')).toHaveCount(9)
})

test('filters remain applied after refresh', async ({ page, isMobile }) => {
  await openFilters(page, isMobile)
  await page.getByLabel('Colecionáveis').check()
  await catalogSort(page, isMobile).selectOption('price-asc')
  await expect(page).toHaveURL(/category=animals/)
  await expect(page).toHaveURL(/sort=price-asc/)

  await page.reload()
  await expect(page.getByLabel('Colecionáveis')).toBeChecked()
  await expect(catalogSort(page, isMobile)).toHaveValue('price-asc')
  await expect(page.locator('.nft-card')).toHaveCount(9)
})

test('pagination supports direct URLs, refresh and browser history', async ({ page }) => {
  const pagination = page.locator('.catalog-pagination')
  await expect(pagination).toBeVisible()
  await pagination.getByRole('button', { name: '2', exact: true }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(page.locator('.nft-card')).toHaveCount(9)
  await expect(page.locator('.nft-card').first()).toContainText('Amber Canopy #021')

  await page.goBack()
  await expect(page).not.toHaveURL(/page=2/)
  await expect(page.locator('.nft-card').first()).toContainText('Emerald Ape #042')

  await page.goForward()
  await expect(page).toHaveURL(/page=2/)
  await page.reload()
  await expect(page.locator('.nft-card').first()).toContainText('Amber Canopy #021')

  await page.goto('/?page=3')
  await expect(page).toHaveURL(/page=3/)
  await expect(page.locator('.nft-card')).toHaveCount(9)
  await expect(page.locator('.nft-card').first()).toContainText('Solar Bloom #014')
  await page.reload()
  await expect(page.locator('.nft-card').first()).toContainText('Solar Bloom #014')
})

test('catalog and NFT detail have no horizontal overflow at required viewports', async ({ page }) => {
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/?page=2')
    await expect(page.locator('.nft-card')).toHaveCount(9)
    await expect(page.locator('.catalog-pagination')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

    if (width === 390) {
      await expect(page.locator('.mobile-bottom-nav')).toBeVisible()
      await page.getByRole('button', { name: 'Alternar filtros' }).click()
      await expect(page.locator('.catalog-sidebar-mobile-open')).toBeVisible()
    } else {
      await expect(page.locator('.store-header')).toBeVisible()
      await expect(page.locator('.catalog-sidebar')).toBeVisible()
    }

    await page.goto('/nft/jaguar')
    await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }
})
