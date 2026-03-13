import { getMovieProviders } from '../api/movies'
import { getTvProviders } from '../api/tv'
import { ALLOWED_PROVIDER_SET } from './providers'

export const PROVIDER_QUERY_KEY_PREFIX = 'provider-availability'
export const PROVIDER_QUEUE_CONCURRENCY = 4
export const PROVIDER_RETRY_ATTEMPTS = 2
export const PROVIDER_RETRY_BASE_DELAY_MS = 250
export const PROVIDER_AVAILABILITY_STALE_TIME = 24 * 60 * 60 * 1000
export const STREAMABLE_CHECK_STEP = 60

const pendingJobs = []
let activeJobs = 0

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableError(error) {
  const status = error?.response?.status
  return status === 429 || !error?.response
}

async function runWithRetry(task) {
  let attempts = 0

  while (true) {
    try {
      return await task()
    } catch (error) {
      if (attempts >= PROVIDER_RETRY_ATTEMPTS || !isRetryableError(error)) {
        throw error
      }

      const waitMs = PROVIDER_RETRY_BASE_DELAY_MS * (attempts + 1)
      await sleep(waitMs)
      attempts += 1
    }
  }
}

function pumpQueue() {
  while (activeJobs < PROVIDER_QUEUE_CONCURRENCY && pendingJobs.length > 0) {
    const run = pendingJobs.shift()
    activeJobs += 1

    run().finally(() => {
      activeJobs -= 1
      pumpQueue()
    })
  }
}

function enqueue(task) {
  return new Promise((resolve, reject) => {
    pendingJobs.push(() =>
      Promise.resolve()
        .then(task)
        .then(resolve, reject)
    )
    pumpQueue()
  })
}

function getProviderFetcher(mediaType) {
  return mediaType === 'tv' ? getTvProviders : getMovieProviders
}

export function getProviderAvailabilityKey(mediaType, id) {
  return [PROVIDER_QUERY_KEY_PREFIX, mediaType, Number(id)]
}

function getAvailableProviderIds(providerData) {
  if (!Array.isArray(providerData?.flatrate)) return []

  return Array.from(new Set(
    providerData.flatrate
      .map((provider) => provider?.provider_id)
      .filter((providerId) => Number.isInteger(providerId) && ALLOWED_PROVIDER_SET.has(providerId))
  ))
}

function getAvailabilityState(providerData) {
  const availableProviderIds = getAvailableProviderIds(providerData)
  const isStreamable = availableProviderIds.length > 0

  return {
    state: isStreamable ? 'streamable' : 'not_streamable',
    isStreamable,
    availableProviderIds,
  }
}

async function fetchProviderAvailability(mediaType, id) {
  const fetchProviders = getProviderFetcher(mediaType)
  if (!fetchProviders || !id) {
    return { state: 'unknown', isStreamable: null, availableProviderIds: [] }
  }

  try {
    const providerData = await enqueue(() =>
      runWithRetry(() => fetchProviders(id))
    )
    return getAvailabilityState(providerData)
  } catch {
    return { state: 'unknown', isStreamable: null, availableProviderIds: [] }
  }
}

export function getProviderAvailabilityQueryOptions(mediaType, id, enabled = true) {
  return {
    queryKey: getProviderAvailabilityKey(mediaType, id),
    queryFn: () => fetchProviderAvailability(mediaType, id),
    staleTime: PROVIDER_AVAILABILITY_STALE_TIME,
    retry: false,
    enabled: enabled && !!mediaType && id != null,
  }
}

export function resolveProviderAvailability(queryClient, mediaType, id) {
  return queryClient.fetchQuery(getProviderAvailabilityQueryOptions(mediaType, id))
}

// Test helper
export function __resetProviderAvailabilityQueueForTests() {
  pendingJobs.length = 0
  activeJobs = 0
}