import { test, expect } from '@playwright/test'

async function mockClipboard(page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: () => Promise.resolve(),
      },
    })
  })
}

function pagedResponse(results = []) {
  return {
    page: 1,
    total_pages: 1,
    total_results: results.length,
    results,
  }
}

async function mockTmdbApi(page) {
  await page.route('https://api.themoviedb.org/3/**', (route) => {
    const reqUrl = new URL(route.request().url())
    const path = reqUrl.pathname

    if (path.endsWith('/search/multi')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          pagedResponse([
            {
              id: 10,
              media_type: 'movie',
              title: 'Matrix',
              poster_path: '/matrix.jpg',
              overview: 'Neo wacht auf.',
              vote_average: 8.7,
              vote_count: 100,
              release_date: '1999-03-31',
            },
          ])
        ),
      })
    }

    if (path.endsWith('/discover/tv')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          pagedResponse([
            {
              id: 55,
              name: 'Mood Serie',
              poster_path: '/mood-tv.jpg',
              overview: 'Eine passende Serie für die Stimmung.',
              vote_average: 7.9,
              vote_count: 120,
              first_air_date: '2020-01-01',
            },
          ])
        ),
      })
    }

    if (path.endsWith('/discover/movie')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          pagedResponse([
            {
              id: 10,
              title: 'Matrix',
              poster_path: '/matrix.jpg',
              overview: 'Neo wacht auf.',
              vote_average: 8.7,
              vote_count: 100,
              release_date: '1999-03-31',
            },
          ])
        ),
      })
    }

    if (path.endsWith('/movie/10/watch/providers')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: {
            DE: {
              flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/netflix.png' }],
              link: 'https://www.justwatch.com/de',
            },
          },
        }),
      })
    }

    if (path.endsWith('/tv/55/watch/providers') || path.endsWith('/tv/55/season/1/watch/providers')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: {
            DE: {
              flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/netflix.png' }],
              link: 'https://www.justwatch.com/de',
            },
          },
        }),
      })
    }

    if (path.endsWith('/movie/10')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 10,
          title: 'Matrix',
          poster_path: '/matrix.jpg',
          backdrop_path: '/matrix-bg.jpg',
          overview: 'Neo wacht auf.',
          vote_average: 8.7,
          vote_count: 100,
          release_date: '1999-03-31',
          runtime: 136,
          genres: [{ id: 878, name: 'Science Fiction' }],
          keywords: { keywords: [] },
          credits: { cast: [] },
          videos: { results: [] },
          release_dates: { results: [] },
        }),
      })
    }

    if (path.endsWith('/tv/55')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 55,
          name: 'Mood Serie',
          poster_path: '/mood-tv.jpg',
          backdrop_path: '/mood-bg.jpg',
          overview: 'Eine passende Serie für die Stimmung.',
          vote_average: 7.9,
          vote_count: 120,
          first_air_date: '2020-01-01',
          last_air_date: '2021-01-01',
          status: 'Returning Series',
          number_of_seasons: 1,
          number_of_episodes: 8,
          genres: [{ id: 18, name: 'Drama' }],
          credits: { cast: [] },
          videos: { results: [] },
          keywords: { results: [] },
          seasons: [{ id: 501, season_number: 1, name: 'Staffel 1', episode_count: 8 }],
          networks: [],
        }),
      })
    }

    if (
      path.endsWith('/movie/10/similar') ||
      path.endsWith('/movie/10/recommendations') ||
      path.endsWith('/tv/55/similar') ||
      path.endsWith('/tv/55/recommendations') ||
      path.endsWith('/movie/now_playing') ||
      path.endsWith('/trending/all/week') ||
      path.endsWith('/trending/movie/week') ||
      path.endsWith('/trending/tv/week') ||
      path.endsWith('/movie/popular') ||
      path.endsWith('/tv/popular')
    ) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(pagedResponse([])),
      })
    }

    if (path.endsWith('/genre/movie/list')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ genres: [{ id: 35, name: 'Komödie' }] }),
      })
    }

    if (path.endsWith('/genre/tv/list')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ genres: [{ id: 18, name: 'Drama' }] }),
      })
    }

    if (path.endsWith('/watch/providers/movie') || path.endsWith('/watch/providers/tv')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/netflix.png' }],
        }),
      })
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(pagedResponse([])),
    })
  })
}

test.describe('Functional Flows', () => {
  test.beforeEach(async ({ page }) => {
    await mockClipboard(page)
    await mockTmdbApi(page)
    await page.goto('/#/watchlist')
    await page.evaluate(() => localStorage.clear())
  })

  test('Search -> Detail -> Watchlist', async ({ page }) => {
    await page.goto('/#/search')

    const input = page.getByRole('combobox')
    await input.fill('Matrix')

    const matrixOption = page.getByRole('option', { name: /Matrix/ }).first()
    await expect(matrixOption).toBeVisible()
    await matrixOption.click()

    await expect(page).toHaveURL(/#\/movie\/10/)

    await page.getByLabel('Matrix auf Merkliste setzen').click()
    await expect(page.getByText('Matrix zur Merkliste hinzugefügt')).toBeVisible()

    await page.getByRole('link', { name: 'Merkliste' }).first().click()
    await expect(page).toHaveURL(/#\/watchlist/)
    await expect(page.getByText('Matrix').first()).toBeVisible()
  })

  test('Mood -> Filter -> Share', async ({ page }) => {
    await page.goto('/#/mood/leichte-kost')
    await expect(page.getByRole('heading', { name: 'Leichte Kost' })).toBeVisible()

    await page.getByRole('button', { name: 'Serien' }).click()
    await page.getByRole('button', { name: 'Bewertung' }).click()

    await expect(page).toHaveURL(/type=tv/)
    await expect(page).toHaveURL(/sort=rating/)

    await page.locator('a[href*="/tv/55"]').first().click()
    await expect(page).toHaveURL(/#\/tv\/55/)

    await page.getByLabel('Mood Serie auf Merkliste setzen').click()

    await page.getByRole('link', { name: 'Merkliste' }).first().click()
    await expect(page).toHaveURL(/#\/watchlist/)

    await page.getByRole('button', { name: 'Link teilen' }).click()
    await expect(page.getByText('Link kopiert! Du kannst ihn jetzt teilen.')).toBeVisible()
  })
})
