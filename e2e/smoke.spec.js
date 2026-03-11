import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Intercept TMDB API calls and return mock data
function mockTmdbApi(page) {
  return page.route('https://api.themoviedb.org/3/**', (route) => {
    const url = route.request().url()

    // Trending / popular results
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

    // Search
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

    // Discover
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

    // Genres
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

    // Movie/TV providers (must come before generic /watch/providers match)
    if (url.match(/\/(movie|tv)\/\d+\/watch\/providers/)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: { DE: { flatrate: [] } } }),
      })
    }

    // Watch providers (list)
    if (url.includes('/watch/providers')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: [] }),
      })
    }

    // Movie/TV details
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

    // Now playing / on the air
    if (url.includes('/now_playing') || url.includes('/on_the_air') || url.includes('/airing_today')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: [] }),
      })
    }

    // Default: empty results
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
    // Multiple nav elements (desktop, mobile, footer) — use .first()
    await expect(page.locator('nav').first()).toBeVisible()
    await expect(page.locator('text=StreamScout').first()).toBeVisible()
  })

  test('Navigation zu Suche funktioniert', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href*="search"]')
    await expect(page).toHaveURL(/search/)
    await expect(page.locator('h1:text("Suche")')).toBeVisible()
  })

  test('Navigation zu Entdecken funktioniert', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href*="discover"]')
    await expect(page).toHaveURL(/discover/)
    await expect(page.locator('h1:text("Entdecken")')).toBeVisible()
  })

  test('Navigation zu Merkliste funktioniert', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href*="watchlist"]')
    await expect(page).toHaveURL(/watchlist/)
    await expect(page.locator('h1:text("Merkliste")')).toBeVisible()
  })

  test('Suche liefert Ergebnisse', async ({ page }) => {
    // Navigate via hash route
    await page.goto('/#/search')
    await page.waitForSelector('input[placeholder*="suchen"]')
    const input = page.locator('input[placeholder*="suchen"]')
    await input.fill('Matrix')
    await expect(page.locator('text=Matrix').first()).toBeVisible({ timeout: 5000 })
  })

  test('Entdecken zeigt Filter und Ergebnisse', async ({ page }) => {
    await page.goto('/#/discover')
    await page.waitForSelector('h1')
    await expect(page.locator('button:text("Filme")')).toBeVisible()
    await expect(page.locator('button:text("Serien")')).toBeVisible()
    await expect(page.locator('button:text("Beliebtheit")')).toBeVisible()
    await expect(page.locator('button:text("Bewertung")')).toBeVisible()
  })

  test('Merkliste zeigt leeren Zustand', async ({ page }) => {
    await page.goto('/#/watchlist')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/#/watchlist')
    await expect(page.locator('text=Deine Merkliste ist leer')).toBeVisible()
    // "Entdecken" link inside main content area (not nav/footer)
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

  test('Merkliste hat keine kritischen A11y-Verstöße', async ({ page }) => {
    await page.goto('/#/watchlist')
    await page.waitForSelector('h1')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expectNoCriticalViolations(results)
  })

  test('Entdecken hat keine kritischen A11y-Verstöße', async ({ page }) => {
    await page.goto('/#/discover')
    await page.waitForSelector('h1')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expectNoCriticalViolations(results)
  })
})
