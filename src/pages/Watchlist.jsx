import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useWatchlist, SHARE_ITEM_LIMIT } from '../hooks/useWatchlist'
import { useWatchlistProviders } from '../hooks/useWatchlistProviders'
import { useGenres } from '../hooks/useProviders'
import { useToast } from '../components/common/useToast'
import MediaCard from '../components/common/MediaCard'
import FilterPanel from '../components/common/FilterPanel'
import SegmentedControl from '../components/common/SegmentedControl'
import FilterField from '../components/common/FilterField'
import Select from '../components/common/Select'
import ProviderFilter from '../components/common/ProviderFilter'
import WatchlistRecommendations from '../components/home/WatchlistRecommendations'
import { getFskAvailabilityQueryOptions } from '../utils/fskAvailability'
import {
  FSK_VALUES,
  FSK_FILTER_MODE_OPTIONS,
  matchesFskFilter,
} from '../utils/fsk'

const tabs = [
  { key: 'all', label: 'Alle' },
  { key: 'movie', label: 'Filme' },
  { key: 'tv', label: 'Serien' },
]

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 50 }, (_, i) => currentYear - i)

const ratingOptions = [
  { value: '', label: 'Alle' },
  { value: '9', label: '9+' },
  { value: '8', label: '8+' },
  { value: '7', label: '7+' },
  { value: '6', label: '6+' },
  { value: '5', label: '5+' },
]

const fskOptions = [
  { value: '', label: 'Alle' },
  ...FSK_VALUES.map((value) => ({ value, label: `FSK ${value}` })),
]

function WatchlistCard({ item, index, onRemove, readOnly = false, isSelected = false, onToggleSelect }) {
  return (
    <div className="group/wl relative">
      <MediaCard
        media={{ ...item, media_type: item.media_type || 'movie' }}
        index={index}
        eager={index < 12}
        hideWatchlistButton={true}
      />
      {/* Remove button — only visible if not readOnly */}
      {!readOnly && (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRemove(item.id, item.media_type)
          }}
          title="Von Merkliste entfernen"
          className="absolute top-2 right-2 z-20 w-7 h-7 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-black/60 text-white/70 hover:bg-red-500/90 hover:text-white transition-colors backdrop-blur-sm cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Selection Checkbox — only visible in readOnly (Shared View) */}
      {readOnly && (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (onToggleSelect) onToggleSelect(item)
          }}
          title={isSelected ? 'Abwählen' : 'Auswählen'}
          className={`absolute top-2 left-2 z-20 w-7 h-7 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-all backdrop-blur-sm cursor-pointer border-2 ${
            isSelected
              ? 'bg-accent-500 border-accent-500 text-black shadow-lg shadow-accent-500/20 scale-110'
              : 'bg-black/40 border-white/40 text-transparent hover:bg-black/60 hover:border-white/60'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      )}
    </div>
  )
}

function Watchlist() {
  useDocumentTitle('Merkliste')
  const [activeTab, setActiveTab] = useState('all')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { items, remove, mergeItems, generateShareLink, fetchSharedList } = useWatchlist()
  const toast = useToast()

  // Shared List State
  const [sharedItems, setSharedItems] = useState([])
  const [isFetchingShared, setIsFetchingShared] = useState(false)
  const isSharedView = searchParams.has('share')
  const shareString = searchParams.get('share') || ''
  const initializedShare = useRef('')

  const [selectedItems, setSelectedItems] = useState(new Set())
  const [sortBy, setSortBy] = useState('added')
  const [selectedGenres, setSelectedGenres] = useState([])
  const [year, setYear] = useState('')
  const [rating, setRating] = useState('')
  const [fsk, setFsk] = useState('')
  const [fskMode, setFskMode] = useState('lte')
  const [selectedProviders, setSelectedProviders] = useState([])
  const [onlyStreamable, setOnlyStreamable] = useState(false)

  // Determine what to render based on the view mode
  const displayedItems = isSharedView ? sharedItems : items

  const { isLoading: providersLoading, providerMap, availableProviders } = useWatchlistProviders(displayedItems)
  const movieGenres = useGenres('movie')
  const tvGenres = useGenres('tv')

  // Handle URL share link (fetching the preview)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isSharedView && shareString && initializedShare.current !== shareString) {
      initializedShare.current = shareString
      setIsFetchingShared(true)

      fetchSharedList(shareString).then((res) => {
        if (res.success) {
          setSharedItems(res.items)
          // Pre-select all items by default
          setSelectedItems(new Set(res.items.map((m) => `${m.media_type}-${m.id}`)))

          const warnings = []
          if (res.failedCount > 0) {
            warnings.push(`${res.items.length} von ${res.items.length + res.failedCount} Einträgen geladen. Einige konnten nicht abgerufen werden.`)
          }
          if (res.invalidCount > 0) {
            warnings.push(`${res.invalidCount} Link-Einträge waren ungültig und wurden übersprungen.`)
          }
          if (res.truncatedCount > 0) {
            warnings.push(`${res.truncatedCount} Einträge wurden wegen des Limits von ${SHARE_ITEM_LIMIT} nicht importiert.`)
          }

          if (warnings.length > 0) {
            toast(warnings.join(' '), 'warning')
          }
        } else {
          toast(res.error || 'Fehler beim Laden der geteilten Liste', 'error')
        }
        setIsFetchingShared(false)
      })
    }
  }, [isSharedView, shareString, fetchSharedList, toast])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleShare = () => {
    const link = generateShareLink()
    navigator.clipboard.writeText(link).then(() => {
      toast('Link kopiert! Du kannst ihn jetzt teilen.', 'success')
      if (items.length > SHARE_ITEM_LIMIT) {
        toast(`Hinweis: Im Link wurden nur die ersten ${SHARE_ITEM_LIMIT} Einträge berücksichtigt.`, 'warning')
      }
    }).catch(() => {
      toast('Fehler beim Kopieren des Links', 'error')
    })
  }

  const handleRemoveLocal = useCallback((id, mediaType) => {
    const item = items.find((m) => m.id === id && m.media_type === mediaType)
    remove(id, mediaType)
    toast(`${item?.title || item?.name || 'Eintrag'} von Merkliste entfernt`, 'removed')
  }, [items, remove, toast])

  const handleToggleSelect = useCallback((item) => {
    const key = `${item.media_type}-${item.id}`
    setSelectedItems((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const handleSelectAll = () => {
    if (selectedItems.size === sharedItems.length) {
      setSelectedItems(new Set()) // deselect all
    } else {
      setSelectedItems(new Set(sharedItems.map((m) => `${m.media_type}-${m.id}`))) // select all
    }
  }

  const handleImportShared = () => {
    const itemsToImport = sharedItems.filter((m) => selectedItems.has(`${m.media_type}-${m.id}`))

    if (itemsToImport.length === 0) {
      toast('Bitte wähle mindestens einen Eintrag aus.', 'error')
      return
    }

    const res = mergeItems(itemsToImport)
    if (res.success) {
      toast(res.count > 0 ? `${res.count} neue Einträge hinzugefügt!` : 'Alle Einträge waren schon auf deiner Liste.', 'success')
      navigate('/watchlist', { replace: true }) // leave shared view
    } else {
      toast('Import fehlgeschlagen.', 'error')
    }
  }

  const handleCancelShared = () => {
    navigate('/watchlist', { replace: true })
  }

  const availableGenres = useMemo(() => {
    if (activeTab === 'movie') return movieGenres.data || []
    if (activeTab === 'tv') return tvGenres.data || []

    const map = new Map()
    for (const item of movieGenres.data || []) {
      map.set(item.id, item)
    }
    for (const item of tvGenres.data || []) {
      if (!map.has(item.id)) map.set(item.id, item)
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'de'))
  }, [activeTab, movieGenres.data, tvGenres.data])

  const hasProviderFilter = selectedProviders.length > 0
  const hasFskFilter = Boolean(fsk)

  function toggleGenre(id) {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((genreId) => genreId !== id) : [...prev, id]
    )
  }

  function toggleProvider(id) {
    setSelectedProviders((prev) =>
      prev.includes(id) ? prev.filter((providerId) => providerId !== id) : [...prev, id]
    )
  }

  const filteredWithoutFsk = useMemo(() => {
    let next = [...displayedItems]

    if (selectedGenres.length > 0) {
      next = next.filter((item) =>
        Array.isArray(item.genre_ids) && selectedGenres.some((genreId) => item.genre_ids.includes(genreId))
      )
    }

    if (year) {
      next = next.filter((item) => {
        const date = item.release_date || item.first_air_date || ''
        return date.startsWith(year)
      })
    }

    if (rating) {
      const minRating = Number(rating)
      next = next.filter((item) => (Number(item.vote_average) || 0) >= minRating)
    }

    if (onlyStreamable && !providersLoading) {
      next = next.filter((item) => {
        const key = `${item.media_type}-${item.id}`
        return Boolean(providerMap[key] && providerMap[key].size > 0)
      })
    }

    if (hasProviderFilter && !providersLoading) {
      next = next.filter((item) => {
        const key = `${item.media_type}-${item.id}`
        const providersForItem = providerMap[key]
        if (!providersForItem) return false
        return selectedProviders.some((providerId) => providersForItem.has(providerId))
      })
    }

    return next
  }, [displayedItems, selectedGenres, year, rating, onlyStreamable, providersLoading, providerMap, hasProviderFilter, selectedProviders])

  const fskQueries = useQueries({
    queries: (hasFskFilter ? filteredWithoutFsk : []).map((item) =>
      getFskAvailabilityQueryOptions(item.media_type, item.id, true)
    ),
  })

  const fskStateByKey = useMemo(() => {
    const map = new Map()
    if (!hasFskFilter) return map

    filteredWithoutFsk.forEach((item, index) => {
      map.set(`${item.media_type}-${item.id}`, fskQueries[index]?.data)
    })

    return map
  }, [filteredWithoutFsk, fskQueries, hasFskFilter])

  const fskChecking = hasFskFilter && filteredWithoutFsk.length > 0 && fskQueries.some((query) => query.isLoading)

  const fskUnknownCount = hasFskFilter
    ? filteredWithoutFsk.filter((item) => fskStateByKey.get(`${item.media_type}-${item.id}`)?.state === 'unknown').length
    : 0

  const filteredAll = useMemo(() => {
    let next = [...filteredWithoutFsk]

    if (hasFskFilter && !fskChecking) {
      next = next.filter((item) => {
        const state = fskStateByKey.get(`${item.media_type}-${item.id}`)
        return matchesFskFilter(state?.certification, fsk, fskMode)
      })
    }

    next.sort((a, b) => {
      if (sortBy === 'rating') return (b.vote_average || 0) - (a.vote_average || 0)
      if (sortBy === 'alpha') return (a.title || a.name || '').localeCompare(b.title || b.name || '', 'de')
      return 0
    })

    return next
  }, [filteredWithoutFsk, hasFskFilter, fskChecking, fskStateByKey, fsk, fskMode, sortBy])

  const filtered = activeTab === 'all'
    ? filteredAll
    : filteredAll.filter((item) => item.media_type === activeTab)

  const movieCount = filteredAll.filter((item) => item.media_type === 'movie').length
  const tvCount = filteredAll.filter((item) => item.media_type === 'tv').length

  const hasAdvancedFilters =
    selectedGenres.length > 0 ||
    year ||
    rating ||
    fsk ||
    selectedProviders.length > 0 ||
    onlyStreamable

  const emptyFilteredMessage = hasProviderFilter
    ? 'Keine Einträge für die gewählten Anbieter.'
    : onlyStreamable
      ? 'Keine streambaren Einträge für diese Auswahl.'
      : hasFskFilter
        ? 'Keine Einträge für den gewählten FSK-Filter.'
        : hasAdvancedFilters
          ? 'Keine Einträge für die aktiven Filter.'
          : activeTab === 'movie'
            ? 'Keine Filme auf der Merkliste.'
            : activeTab === 'tv'
              ? 'Keine Serien auf der Merkliste.'
              : 'Keine Einträge auf der Merkliste.'

  function resetFilters() {
    setActiveTab('all')
    setSortBy('added')
    setSelectedGenres([])
    setYear('')
    setRating('')
    setFsk('')
    setFskMode('lte')
    setSelectedProviders([])
    setOnlyStreamable(false)
  }

  const hasControlFilters =
    activeTab !== 'all' ||
    sortBy !== 'added' ||
    selectedGenres.length > 0 ||
    year ||
    rating ||
    fsk ||
    selectedProviders.length > 0 ||
    onlyStreamable

  const activeFilterCount =
    (activeTab !== 'all' ? 1 : 0) +
    (sortBy !== 'added' ? 1 : 0) +
    selectedGenres.length +
    (year ? 1 : 0) +
    (rating ? 1 : 0) +
    (fsk ? 1 : 0) +
    selectedProviders.length +
    (onlyStreamable ? 1 : 0)

  const tabOptions = tabs.map(({ key, label }) => {
    const count = key === 'all' ? filteredAll.length : key === 'movie' ? movieCount : tvCount
    return { value: key, label: `${label} (${count})` }
  })

  const watchlistSortOptions = [
    { value: 'added', label: 'Zuletzt hinzugefügt' },
    { value: 'rating', label: 'Bewertung' },
    { value: 'alpha', label: 'A–Z' },
  ]

  const quickFilters = (
    <div className="flex flex-wrap items-center gap-3">
      <SegmentedControl
        options={tabOptions}
        value={activeTab}
        onChange={setActiveTab}
        buttonClassName="sm:px-5"
      />

      <SegmentedControl
        size="sm"
        options={watchlistSortOptions}
        value={sortBy}
        onChange={setSortBy}
        buttonClassName="sm:text-sm sm:px-4"
      />
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          {isSharedView ? (
            <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-surface-100">
              Geteilte Merkliste
            </h1>
          ) : (
            <h1 className="font-display text-5xl tracking-wide text-surface-100">Merkliste</h1>
          )}

          {displayedItems.length > 0 && !isFetchingShared && (
            <p className="text-surface-200 text-sm mt-2">
              {displayedItems.length} {displayedItems.length === 1 ? 'Eintrag' : 'Einträge'}
            </p>
          )}
          {isFetchingShared && (
            <p role="status" aria-live="polite" className="text-accent-500 text-sm mt-2 animate-pulse">Lade Filmdaten...</p>
          )}
        </div>

        {/* Actions Menu (only visible if NOT in shared view) */}
        {!isSharedView && displayedItems.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleShare}
              className="px-3 py-2 bg-surface-800 text-surface-200 text-sm font-medium rounded-lg hover:bg-accent-500/20 hover:text-accent-400 transition-colors flex items-center gap-2"
              title="Als Link kopieren"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Link teilen
            </button>
          </div>
        )}
      </div>

      {/* Shared View Warning Banner */}
      {isSharedView && !isFetchingShared && sharedItems.length > 0 && (
        <div className="bg-accent-500/10 border border-accent-500/20 rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-surface-100 font-medium text-lg">Ein Freund hat diese Liste mit dir geteilt!</h3>
            <p className="text-surface-200 text-sm mt-1">
              Wähle aus, welche Filme und Serien du in deine eigene Merkliste übernehmen möchtest.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0 w-full lg:w-auto">
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 bg-surface-800 text-surface-200 text-sm font-medium rounded-lg hover:bg-surface-700 hover:text-surface-100 transition-colors flex-1 sm:flex-none"
            >
              {selectedItems.size === sharedItems.length ? 'Alle abwählen' : 'Alle auswählen'}
            </button>
            <button
              onClick={handleCancelShared}
              className="px-4 py-2 bg-red-500/10 text-red-500 text-sm font-medium rounded-lg hover:bg-red-500/20 transition-colors flex-1 sm:flex-none"
            >
              Abbrechen
            </button>
            <button
              onClick={handleImportShared}
              disabled={selectedItems.size === 0}
              className="px-4 py-2 bg-accent-500 text-black text-sm font-medium rounded-lg hover:bg-accent-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
            >
              Ausgewählte ({selectedItems.size}) übernehmen
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      {displayedItems.length > 0 && !isFetchingShared && (
        <FilterPanel
          title="Listenfilter"
          quickLabel="Schnellfilter"
          quickContent={quickFilters}
          defaultOpen={hasControlFilters}
          activeCount={activeFilterCount}
          onReset={hasControlFilters ? resetFilters : undefined}
          className="bg-surface-800/20"
        >
          <div className="space-y-4">
            {availableGenres.length > 0 ? (
              <FilterField label="Genre">
                <div className="flex flex-wrap gap-2">
                  {availableGenres.map((genreOption) => (
                    <button
                      key={genreOption.id}
                      onClick={() => toggleGenre(genreOption.id)}
                      aria-pressed={selectedGenres.includes(genreOption.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                        selectedGenres.includes(genreOption.id)
                          ? 'bg-accent-500 text-black shadow-[0_0_12px_-3px_rgba(245,158,11,0.4)]'
                          : 'bg-surface-800 text-surface-200 hover:bg-surface-700'
                      }`}
                    >
                      {genreOption.name}
                    </button>
                  ))}
                </div>
              </FilterField>
            ) : (
              <p className="text-sm text-surface-300">Genre-Filter sind für diese Auswahl gerade nicht verfügbar.</p>
            )}

            <div className="flex flex-wrap gap-4">
              <FilterField label="Jahr">
                <Select
                  value={year}
                  onChange={setYear}
                  options={[{ value: '', label: 'Alle Jahre' }, ...years.map((itemYear) => ({ value: String(itemYear), label: String(itemYear) }))]}
                  placeholder="Alle Jahre"
                  ariaLabel="Jahr"
                />
              </FilterField>

              <FilterField label="Bewertung">
                <Select
                  value={rating}
                  onChange={setRating}
                  options={ratingOptions}
                  placeholder="Alle"
                  ariaLabel="Bewertung"
                />
              </FilterField>
            </div>

            <div className="space-y-3">
              <FilterField label="FSK">
                <Select
                  value={fsk}
                  onChange={setFsk}
                  options={fskOptions}
                  placeholder="Alle"
                  ariaLabel="FSK"
                />
              </FilterField>

              {fsk && (
                <SegmentedControl
                  size="sm"
                  className="w-fit"
                  options={FSK_FILTER_MODE_OPTIONS}
                  value={fskMode}
                  onChange={setFskMode}
                />
              )}
            </div>

            {availableProviders.length > 0 ? (
              <ProviderFilter
                providers={availableProviders}
                selected={selectedProviders}
                onToggle={toggleProvider}
                label="Anbieter"
              />
            ) : (
              <p className="text-sm text-surface-300">Noch keine Anbieter-Filter für die aktuelle Auswahl verfügbar.</p>
            )}

            <FilterField label="Streaming" className="space-y-2">
              <button
                onClick={() => setOnlyStreamable((prev) => !prev)}
                aria-pressed={onlyStreamable}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  onlyStreamable
                    ? 'bg-accent-500/15 text-accent-400 border border-accent-500/30'
                    : 'bg-surface-800 text-surface-200 hover:text-surface-100'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                </svg>
                Nur streambar
              </button>
            </FilterField>

            {(providersLoading && (hasProviderFilter || onlyStreamable)) && (
              <p role="status" aria-live="polite" className="text-surface-200 text-sm animate-pulse">
                Streaming-Verfügbarkeit wird geprüft…
              </p>
            )}

            {fskChecking && (
              <p role="status" aria-live="polite" className="text-surface-200 text-sm animate-pulse">
                FSK-Freigaben werden geprüft…
              </p>
            )}

            {fskUnknownCount > 0 && (
              <p role="status" aria-live="polite" className="text-amber-300 text-sm">
                Bei {fskUnknownCount} Einträgen konnte die FSK-Freigabe nicht geprüft werden.
              </p>
            )}
          </div>
        </FilterPanel>
      )}

      {/* Grid */}
      {isFetchingShared ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-surface-800 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {filtered.map((item, i) => {
            const isSelected = selectedItems.has(`${item.media_type}-${item.id}`)
            return (
              <WatchlistCard
                key={`${item.media_type}-${item.id}`}
                item={item}
                index={i}
                onRemove={handleRemoveLocal}
                readOnly={isSharedView}
                isSelected={isSelected}
                onToggleSelect={handleToggleSelect}
              />
            )
          })}

        </div>
      ) : displayedItems.length > 0 ? (
        <div className="text-center py-20">
          <p className="text-surface-200 text-lg">{emptyFilteredMessage}</p>
        </div>
      ) : (
        <div className="text-center py-20">
          <svg className="w-16 h-16 mx-auto text-surface-600 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <p className="text-surface-200 text-lg">
            {isSharedView ? 'Diese geteilte Merkliste ist leer.' : 'Deine Merkliste ist leer'}
          </p>
          {!isSharedView && (
            <>
              <p className="text-surface-200 text-sm mt-1">
                Klicke auf das Lesezeichen-Symbol bei Filmen oder Serien, um sie hier zu speichern.
              </p>
              <Link
                to="/discover"
                className="inline-block mt-6 px-6 py-2.5 rounded-lg bg-accent-500 text-black text-sm font-medium hover:bg-accent-400 transition-colors"
              >
                Entdecken
              </Link>
            </>
          )}
        </div>
      )}

      {/* Recommendations */}
      {!isSharedView && displayedItems.length > 0 && (
        <div className="mt-16 pt-16 border-t border-surface-800/50">
          <WatchlistRecommendations count={3} />
        </div>
      )}
    </div>
  )
}

export default Watchlist
