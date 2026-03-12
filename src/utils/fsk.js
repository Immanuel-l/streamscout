export const FSK_VALUES = ['0', '6', '12', '16', '18']

const ALLOWED_FSK_VALUES = new Set(FSK_VALUES)

export const FSK_FILTER_MODE_OPTIONS = [
  { value: 'lte', label: 'Bis FSK' },
  { value: 'eq', label: 'Genau FSK' },
  { value: 'gte', label: 'Ab FSK' },
]

const ALLOWED_FSK_FILTER_MODES = new Set(FSK_FILTER_MODE_OPTIONS.map((mode) => mode.value))

const MOVIE_RELEASE_TYPE_PRIORITY = {
  3: 1, // Theatrical
  2: 2, // Theatrical (limited)
  1: 3, // Premiere
  4: 4, // Digital
  5: 5, // Physical
  6: 6, // TV
}

export function normalizeFskCertification(value) {
  if (value == null) return null
  const numericPart = String(value).match(/\d+/)?.[0]
  if (!numericPart) return null
  const normalized = String(Number(numericPart))
  return ALLOWED_FSK_VALUES.has(normalized) ? normalized : null
}

export function normalizeFskFilterMode(value) {
  return ALLOWED_FSK_FILTER_MODES.has(value) ? value : 'lte'
}

export function formatFskLabel(certification) {
  const normalized = normalizeFskCertification(certification)
  return normalized ? `FSK ${normalized}` : null
}

export function setMovieFskFilterParams(params, certification, mode = 'lte') {
  const normalizedCertification = normalizeFskCertification(certification)
  if (!normalizedCertification) return params

  const normalizedMode = normalizeFskFilterMode(mode)
  params.certification_country = 'DE'

  if (normalizedMode === 'eq') {
    params.certification = normalizedCertification
  } else if (normalizedMode === 'gte') {
    params['certification.gte'] = normalizedCertification
  } else {
    params['certification.lte'] = normalizedCertification
  }

  return params
}

export function matchesFskFilter(mediaCertification, selectedCertification, mode = 'lte') {
  const normalizedMediaCertification = normalizeFskCertification(mediaCertification)
  const normalizedSelectedCertification = normalizeFskCertification(selectedCertification)

  if (!normalizedSelectedCertification) return true
  if (!normalizedMediaCertification) return false

  const mediaValue = Number(normalizedMediaCertification)
  const selectedValue = Number(normalizedSelectedCertification)
  const normalizedMode = normalizeFskFilterMode(mode)

  if (normalizedMode === 'eq') return mediaValue === selectedValue
  if (normalizedMode === 'gte') return mediaValue >= selectedValue
  return mediaValue <= selectedValue
}

export function getMovieFskCertificationFromReleaseDates(results) {
  const deRelease = results?.find((entry) => entry?.iso_3166_1 === 'DE')
  const releaseDates = deRelease?.release_dates
  if (!Array.isArray(releaseDates)) return null

  const sortedByPriority = [...releaseDates].sort(
    (a, b) =>
      (MOVIE_RELEASE_TYPE_PRIORITY[a?.type] ?? 99) -
      (MOVIE_RELEASE_TYPE_PRIORITY[b?.type] ?? 99)
  )

  for (const release of sortedByPriority) {
    const normalized = normalizeFskCertification(release?.certification)
    if (normalized) return normalized
  }

  return null
}

export function getMovieFskLabelFromReleaseDates(results) {
  return formatFskLabel(getMovieFskCertificationFromReleaseDates(results))
}

export function getTvFskCertificationFromContentRatings(results) {
  const deRating = results?.find((entry) => entry?.iso_3166_1 === 'DE')?.rating
  return normalizeFskCertification(deRating)
}

export function getTvFskLabelFromContentRatings(results) {
  return formatFskLabel(getTvFskCertificationFromContentRatings(results))
}
