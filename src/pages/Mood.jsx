import { useState, useMemo, useEffect } from 'react'
import { useParams, useSearchParams, Navigate, useNavigate } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { discoverMovies } from '../api/movies'
import { discoverTv } from '../api/tv'
import { getMoodBySlug } from '../utils/moods'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { useFilterPresets } from '../hooks/useFilterPresets'
import MediaCard from '../components/common/MediaCard'
import GridSkeleton from '../components/common/GridSkeleton'
import ErrorBox from '../components/common/ErrorBox'
import ScrollToTop from '../components/common/ScrollToTop'
import Select from '../components/common/Select'
import FilterPresets from '../components/common/FilterPresets'
import {
  FSK_VALUES,
  FSK_FILTER_MODE_OPTIONS,
  normalizeFskCertification,
  normalizeFskFilterMode,
  setMovieFskFilterParams,
} from '../utils/fsk'

const sortOptions = [
  { value: 'popularity', label: 'Beliebtheit', sortBy: 'popularity.desc' },
  { value: 'date', label: 'Neueste zuerst', sortByMovie: 'primary_release_date.desc', sortByTv: 'first_air_date.desc' },
  { value: 'rating', label: 'Bewertung', sortBy: 'vote_average.desc' },
]

const fskOptions = [
  { value: '', label: 'Alle' },
  ...FSK_VALUES.map((value) => ({ value, label: `FSK ${value}` })),
]

function normalizeSortValue(value) {
  return sortOptions.some((option) => option.value === value) ? value : 'popularity'
}

function normalizeMoodPresetValues(values) {
  const mediaType = values?.mediaType === 'tv' ? 'tv' : 'movie'
  const sortValue = normalizeSortValue(values?.sortValue)

  if (mediaType === 'movie') {
    return {
      mediaType,
      sortValue,
      fsk: normalizeFskCertification(values?.fsk) || '',
      fskMode: normalizeFskFilterMode(values?.fskMode),
    }
  }

  return {
    mediaType,
    sortValue,
    fsk: '',
    fskMode: 'lte',
  }
}

function buildMoodSearchParams(values) {
  const normalized = normalizeMoodPresetValues(values)
  const params = {}

  if (normalized.mediaType !== 'movie') params.type = normalized.mediaType
  if (normalized.sortValue !== 'popularity') params.sort = normalized.sortValue
  if (normalized.fsk) {
    params.fsk = normalized.fsk
    if (normalized.fskMode !== 'lte') params.fskMode = normalized.fskMode
  }

  return params
}

function Mood() {
  const { slug } = useParams()
  const mood = getMoodBySlug(slug)
  useDocumentTitle(mood?.title)
  const [searchParams, setSearchParams] = useSearchParams()
  const [mediaType, setMediaType] = useState(() => searchParams.get('type') || 'movie')
  const [sortValue, setSortValue] = useState(() => searchParams.get('sort') || 'popularity')
  const [fsk, setFsk] = useState(() => normalizeFskCertification(searchParams.get('fsk')) || '')
  const [fskMode, setFskMode] = useState(() => normalizeFskFilterMode(searchParams.get('fskMode')))
  const [startPage, setStartPage] = useState(1)

  const presetStorageKey = `streamscout-mood-presets:${slug || 'unknown'}`
  const {
    presets,
    savePreset,
    renamePreset,
    getPresetById,
    deletePreset,
    exportPresets,
    importPresets,
  } = useFilterPresets(presetStorageKey)
  const [presetName, setPresetName] = useState('')
  const [selectedPresetId, setSelectedPresetId] = useState('')
  const [presetStatus, setPresetStatus] = useState('')
  const [presetTransfer, setPresetTransfer] = useState('')
  const activePresetId = presets.some((preset) => preset.id === selectedPresetId) ? selectedPresetId : ''

  const currentPresetValues = useMemo(
    () => ({
      mediaType,
      sortValue,
      fsk,
      fskMode,
    }),
    [mediaType, sortValue, fsk, fskMode]
  )

  function applyPresetValues(values) {
    const normalized = normalizeMoodPresetValues(values)

    setMediaType(normalized.mediaType)
    setSortValue(normalized.sortValue)
    setFsk(normalized.fsk)
    setFskMode(normalized.fskMode)
  }

  function handleSavePreset() {
    const result = savePreset(presetName, currentPresetValues)
    if (!result.success) {
      setPresetStatus(result.error)
      return
    }

    setSelectedPresetId(result.id)
    setPresetName('')
    setPresetStatus(result.replaced ? 'Preset aktualisiert.' : 'Preset gespeichert.')
  }

  function handleRenamePreset() {
    if (!activePresetId) {
      setPresetStatus('Bitte wähle ein Preset aus.')
      return
    }

    const result = renamePreset(activePresetId, presetName)
    if (!result.success) {
      setPresetStatus(result.error)
      return
    }

    setPresetName('')
    setPresetStatus('Preset umbenannt.')
  }

  function handleExportPresets() {
    setPresetTransfer(exportPresets())
    setPresetStatus('Preset-Daten exportiert.')
  }

  function handleImportPresets() {
    const result = importPresets(presetTransfer)
    if (!result.success) {
      setPresetStatus(result.error)
      return
    }

    setPresetStatus(`${result.importedCount} Presets importiert, ${result.replacedCount} aktualisiert.`)
  }

  async function handleCopyPresetLink() {
    if (!activePresetId) {
      setPresetStatus('Bitte wähle ein Preset aus.')
      return
    }

    const preset = getPresetById(activePresetId)
    if (!preset) {
      setPresetStatus('Preset nicht gefunden.')
      return
    }

    const hashPath = window.location.hash.split('?')[0] || `#/mood/${slug || ''}`
    const params = new URLSearchParams(buildMoodSearchParams(preset.values))
    const targetUrl = new URL(window.location.href)
    targetUrl.hash = params.size > 0 ? `${hashPath}?${params.toString()}` : hashPath

    if (!navigator.clipboard?.writeText) {
      setPresetStatus('Clipboard ist nicht verfügbar.')
      return
    }

    try {
      await navigator.clipboard.writeText(targetUrl.toString())
      setPresetStatus('Preset-Link kopiert.')
    } catch {
      setPresetStatus('Preset-Link konnte nicht kopiert werden.')
    }
  }

  function handleLoadPreset() {
    if (!activePresetId) return
    const preset = getPresetById(activePresetId)
    if (!preset) {
      setPresetStatus('Preset nicht gefunden.')
      return
    }

    applyPresetValues(preset.values)
    setPresetStatus('Preset geladen.')
  }

  function handleDeletePreset() {
    if (!activePresetId) return
    const deleted = deletePreset(activePresetId)
    if (!deleted) {
      setPresetStatus('Preset nicht gefunden.')
      return
    }

    setSelectedPresetId('')
    setPresetStatus('Preset gelöscht.')
  }

  // Sync state to URL params
  useEffect(() => {
    const params = {}
    if (mediaType !== 'movie') params.type = mediaType
    if (sortValue !== 'popularity') params.sort = sortValue
    if (fsk) {
      params.fsk = fsk
      if (fskMode !== 'lte') params.fskMode = fskMode
    }
    setSearchParams(params, { replace: true })
  }, [mediaType, sortValue, fsk, fskMode, setSearchParams])

  const moodParams = mood?.[mediaType] || {}
  const sortOption = sortOptions.find((o) => o.value === sortValue) || sortOptions[0]
  const apiSortBy = sortOption.sortBy || (mediaType === 'tv' ? sortOption.sortByTv : sortOption.sortByMovie)

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['mood', slug, mediaType, sortValue, fsk, fskMode, startPage],
    queryFn: ({ pageParam }) => {
      const discoverParams = { ...moodParams, sort_by: apiSortBy, page: pageParam }
      if (fsk && mediaType === 'movie') setMovieFskFilterParams(discoverParams, fsk, fskMode)
      return mediaType === 'tv' ? discoverTv(discoverParams) : discoverMovies(discoverParams)
    },
    initialPageParam: startPage,
    getNextPageParam: (lastPage) => {
      const next = lastPage.page + 1
      return next <= Math.min(lastPage.total_pages, 500) ? next : undefined
    },
    enabled: !!mood,
    retry: 1,
  })

  const firstPageCount = data?.pages[0]?.results.filter((m) => m.poster_path && m.overview).length || 0

  const allResults = useMemo(
    () =>
      data?.pages.flatMap((page) =>
        page.results
          .filter((m) => m.poster_path && m.overview)
          .map((m) => ({ ...m, media_type: mediaType }))
      ) || [],
    [data, mediaType]
  )

  const sentinelRef = useInfiniteScroll({ fetchNextPage, hasNextPage, isFetchingNextPage })

  function shuffle() {
    setStartPage(Math.floor(Math.random() * 5) + 1)
  }

  function switchMediaType(type) {
    setMediaType(type)
    setFsk('')
    setFskMode('lte')
  }

  const navigate = useNavigate()

  if (!mood) return <Navigate to="/" replace />

  return (
    <div className="space-y-8">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-surface-400 hover:text-surface-100 transition-colors inline-flex items-center gap-1 mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Zurück
        </button>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{mood.icon}</span>
          <div>
            <h1 className="font-display text-5xl tracking-wide text-surface-100">{mood.title}</h1>
            <p className="text-surface-300 text-sm mt-1.5 max-w-2xl">{mood.description}</p>
            {mood.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {mood.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 rounded-full bg-surface-800 text-surface-300 text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls: Media Type Toggle + Sort + Shuffle */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-surface-800 rounded-xl p-1">
            {[
              { type: 'movie', label: 'Filme' },
              { type: 'tv', label: 'Serien' },
            ].map(({ type, label }) => (
              <button
                key={type}
                onClick={() => switchMediaType(type)}
                aria-pressed={mediaType === type}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mediaType === type
                    ? 'bg-accent-500 text-black'
                    : 'text-surface-300 hover:text-surface-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-1 bg-surface-800 rounded-xl p-1">
            {sortOptions.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSortValue(value)}
                aria-pressed={sortValue === value}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortValue === value
                    ? 'bg-accent-500 text-black'
                    : 'text-surface-300 hover:text-surface-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {mediaType === 'movie' && (
            <div className="space-y-2">
              <Select
                value={fsk}
                onChange={setFsk}
                options={fskOptions}
                placeholder="FSK"
              />

              {fsk && (
                <div className="flex gap-1 bg-surface-800 rounded-xl p-1 w-fit">
                  {FSK_FILTER_MODE_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setFskMode(value)}
                      aria-pressed={fskMode === value}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        fskMode === value
                          ? 'bg-accent-500 text-black'
                          : 'text-surface-300 hover:text-surface-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={shuffle}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-800 text-surface-300 hover:text-surface-100 hover:bg-surface-700 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
            </svg>
            Mischen
          </button>
        </div>

        <FilterPresets
          presets={presets}
          presetName={presetName}
          selectedPresetId={activePresetId}
          transferValue={presetTransfer}
          onPresetNameChange={setPresetName}
          onSelectedPresetChange={setSelectedPresetId}
          onTransferChange={setPresetTransfer}
          onSave={handleSavePreset}
          onRename={handleRenamePreset}
          onLoad={handleLoadPreset}
          onDelete={handleDeletePreset}
          onCopyShareLink={handleCopyPresetLink}
          onExport={handleExportPresets}
          onImport={handleImportPresets}
          statusMessage={presetStatus}
          emptyMessage="Noch keine Presets für diese Stimmung gespeichert."
        />
      </div>

      {/* Results */}
      {error && <ErrorBox message="Ergebnisse konnten nicht geladen werden. Bitte versuch es später nochmal." />}

      {isLoading ? (
        <GridSkeleton />
      ) : allResults.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {allResults.map((media, i) => (
              <MediaCard key={`${media.id}-${i}`} media={media} index={i} eager animate={i < firstPageCount} />
            ))}

            {/* Sentinel inside grid, before skeletons - prevents oscillation */}
            {hasNextPage && (
              <div ref={sentinelRef} className="col-span-full h-px" />
            )}

            {/* Inline skeleton placeholders while fetching */}
            {isFetchingNextPage && Array.from({ length: 6 }).map((_, i) => (
              <div key={`skel-${i}`}>
                <div className="aspect-[2/3] rounded-xl bg-surface-800 animate-pulse" />
                <div className="mt-2 px-1 space-y-1.5">
                  <div className="h-4 bg-surface-800 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-surface-800 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>

          {/* Error on page load - show retry */}
          {error && allResults.length > 0 && !isFetchingNextPage && (
            <div className="py-8 max-w-md mx-auto">
              <ErrorBox message="Fehler beim Laden weiterer Ergebnisse." onRetry={() => fetchNextPage()} />
            </div>
          )}

          {!hasNextPage && allResults.length > 20 && (
            <p className="text-surface-500 text-sm text-center py-8">Keine weiteren Ergebnisse.</p>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <svg className="w-16 h-16 mx-auto text-surface-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
          </svg>
          <p className="text-surface-400 text-lg">Keine Ergebnisse gefunden</p>
          <p className="text-surface-500 text-sm mt-1">Versuch es mit {mediaType === 'movie' ? 'Serien' : 'Filmen'} statt {mediaType === 'movie' ? 'Filmen' : 'Serien'}.</p>
        </div>
      )}

      <ScrollToTop />
    </div>
  )
}

export default Mood
