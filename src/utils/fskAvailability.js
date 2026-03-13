import { getMovieReleaseDates } from '../api/movies'
import { getTvContentRatings } from '../api/tv'
import {
  getMovieFskCertificationFromReleaseDates,
  getTvFskCertificationFromContentRatings,
} from './fsk'

export const FSK_QUERY_KEY_PREFIX = 'fsk-availability'
export const FSK_QUEUE_CONCURRENCY = 4
export const FSK_RETRY_ATTEMPTS = 2
export const FSK_RETRY_BASE_DELAY_MS = 250
export const FSK_AVAILABILITY_STALE_TIME = 7 * 24 * 60 * 60 * 1000

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
      if (attempts >= FSK_RETRY_ATTEMPTS || !isRetryableError(error)) {
        throw error
      }

      const waitMs = FSK_RETRY_BASE_DELAY_MS * (attempts + 1)
      await sleep(waitMs)
      attempts += 1
    }
  }
}

function pumpQueue() {
  while (activeJobs < FSK_QUEUE_CONCURRENCY && pendingJobs.length > 0) {
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

function getFskFetcher(mediaType) {
  return mediaType === 'tv' ? getTvContentRatings : getMovieReleaseDates
}

function resolveCertification(mediaType, payload) {
  if (mediaType === 'tv') {
    return getTvFskCertificationFromContentRatings(payload)
  }
  return getMovieFskCertificationFromReleaseDates(payload)
}

export function getFskAvailabilityKey(mediaType, id) {
  return [FSK_QUERY_KEY_PREFIX, mediaType, Number(id)]
}

async function fetchFskAvailability(mediaType, id) {
  const fetchFsk = getFskFetcher(mediaType)
  if (!fetchFsk || !id) {
    return { state: 'unknown', certification: null }
  }

  try {
    const payload = await enqueue(() =>
      runWithRetry(() => fetchFsk(id))
    )

    const certification = resolveCertification(mediaType, payload)
    if (!certification) {
      return { state: 'unknown', certification: null }
    }

    return { state: 'known', certification }
  } catch {
    return { state: 'unknown', certification: null }
  }
}

export function getFskAvailabilityQueryOptions(mediaType, id, enabled = true) {
  return {
    queryKey: getFskAvailabilityKey(mediaType, id),
    queryFn: () => fetchFskAvailability(mediaType, id),
    staleTime: FSK_AVAILABILITY_STALE_TIME,
    retry: false,
    enabled: enabled && !!mediaType && id != null,
  }
}

export function resolveFskAvailability(queryClient, mediaType, id) {
  return queryClient.fetchQuery(getFskAvailabilityQueryOptions(mediaType, id))
}

// Test helper
export function __resetFskAvailabilityQueueForTests() {
  pendingJobs.length = 0
  activeJobs = 0
}
