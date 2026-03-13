import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

function mockTmdbApi(page) {
  return page.route('https://api.themoviedb.org/3/**', (route) => {
    const url = route.request().url()

    if (url.includes('/trending') || url.includes('/movie/popular') || url.includes('/tv/popular')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          page: 1,
          total_pages: 1,
          total_results: 2,
          results: [
            { id: 1, title: 'Testfilm', media_type: 'movie', poster_path: '/test.jpg', overview: 'Ein Testfilm', vote_average: 8.5, release_date: '2024-01-01' },
            { id: 2, name: 'Testserie', media_type: 'tv', poster_path: '/test2.jpg', overview: 'Eine Testserie', vote_average: 7.0, first_air_date: '2024-06-01' },
          ],
        }),
      })
    }

    if (url.includes('/search')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          page: 1,
          total_pages: 1,
          total_results: 1,
          results: [
            { id: 10, title: 'Matrix', media_type: 'movie', poster_path: '/matrix.jpg', overview: 'Neo wacht auf', vote_average: 8.7, release_date: '1999-03-31' },
          ],
        }),
      })
    }

    if (url.includes('/discover')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          page: 1,
          total_pages: 1,
          total_results: 1,
          results: [
            { id: 20, title: 'Discover Film', poster_path: '/disc.jpg', overview: 'Ein entdeckter Film', vote_average: 7.5, release_date: '2024-03-01' },
          ],
        }),
      })
    }

    if (url.includes('/genre')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          genres: [
            { id: 28, name: 'Action' },
            { id: 35, name: 'Komödie' },
            { id: 18, name: 'Drama' },
          ],
        }),
      })
    }

    if (url.match(/\/(movie|tv)\/\d+\/watch\/providers/)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: { DE: { flatrate: [] } } }),
      })
    }

    if (url.includes('/watch/providers')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: [] }),
      })
    }

    if (url.match(/\/(movie|tv)\/\d+/)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          title: 'Testfilm',
          name: 'Testfilm',
          poster_path: '/test.jpg',
          backdrop_path: '/bg.jpg',
          overview: 'Beschreibung',
          vote_average: 8.0,
          release_date: '2024-01-01',
          runtime: 120,
          genres: [{ id: 28, name: 'Action' }],
        }),
      })
    }

    if (url.includes('/now_playing') || url.includes('/on_the_air') || url.includes('/airing_today')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: [] }),
      })
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: [], page: 1, total_pages: 0, total_results: 0 }),
    })
  })
}

function expectNoCriticalViolations(results) {
  const criticalViolations = results.violations.filter((violation) => violation.impact === 'critical')
  expect(criticalViolations).toEqual([])
}

test.describe('Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await mockTmdbApi(page)
  })

  test('Startseite lädt und zeigt Navigation', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('nav').first()).toBeVisible()
    await expect(page.locator('text=StreamScout').first()).toBeVisible()
  })

  test('Suche liefert Ergebnisse', async ({ page }) => {
    await page.goto('/#/search')
    await page.waitForSelector('input[placeholder*="suchen"]')
    await page.locator('input[placeholder*="suchen"]').fill('Matrix')

    await expect(page.locator('text=Matrix').first()).toBeVisible({ timeout: 5000 })
  })

  test('Entdecken zeigt zentrale Filter', async ({ page }) => {
    await page.goto('/#/discover')

    await expect(page.locator('h1:text("Entdecken")')).toBeVisible()
    await expect(page.locator('button:text("Filme")')).toBeVisible()
    await expect(page.locator('button:text("Bewertung")')).toBeVisible()
  })

  test('Merkliste zeigt leeren Zustand', async ({ page }) => {
    await page.goto('/#/watchlist')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/#/watchlist')

    await expect(page.locator('text=Deine Merkliste ist leer')).toBeVisible()
    await expect(page.locator('#main-content a:text("Entdecken")')).toBeVisible()
  })

  test('404-Seite wird bei unbekannter Route angezeigt', async ({ page }) => {
    await page.goto('/#/gibts-nicht-12345')
    await expect(page.locator('text=Seite nicht gefunden')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Accessibility Tests (WCAG 2.1 AA)', () => {
  test.beforeEach(async ({ page }) => {
    await mockTmdbApi(page)
  })

  test('Startseite hat keine kritischen A11y-Verstöße', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('nav')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    expectNoCriticalViolations(results)
  })

  test('Suche hat keine kritischen A11y-Verstöße', async ({ page }) => {
    await page.goto('/#/search')
    await page.waitForSelector('h1')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    expectNoCriticalViolations(results)
  })
})
