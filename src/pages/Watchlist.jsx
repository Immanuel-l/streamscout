import { useState, useCallback, useEffect, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useWatchlist } from '../hooks/useWatchlist'
import { useWatchlistProviders } from '../hooks/useWatchlistProviders'
import { useToast } from '../components/common/useToast'
import MediaCard from '../components/common/MediaCard'
import { IMAGE_BASE } from '../api/tmdb'
import WatchlistRecommendations from '../components/home/WatchlistRecommendations'

const tabs = [
  { key: 'all', label: 'Alle' },
  { key: 'movie', label: 'Filme' },
  { key: 'tv', label: 'Serien' },
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
          className="absolute top-2 right-2 z-20 w-7 h-7 flex items-center justify-center rounded-full bg-black/60 text-white/70 hover:bg-red-500/90 hover:text-white transition-colors backdrop-blur-sm cursor-pointer"
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
          className={`absolute top-2 left-2 z-20 w-7 h-7 flex items-center justify-center rounded-full transition-all backdrop-blur-sm cursor-pointer border-2 ${
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
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [sortBy, setSortBy] = useState('added')

  // Determine what to render based on the view mode
  const displayedItems = isSharedView ? sharedItems : items

  const { isLoading: providersLoading, providerMap, availableProviders } = useWatchlistProviders(displayedItems)

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


  const filtered = (activeTab === 'all'
    ? displayedItems
    : displayedItems.filter((m) => m.media_type === activeTab)
  ).filter((m) => {
    if (!selectedProvider) return true
    const key = `${m.media_type}-${m.id}`
    return providerMap[key]?.has(selectedProvider)
  }).sort((a, b) => {
    if (sortBy === 'rating') return (b.vote_average || 0) - (a.vote_average || 0)
    if (sortBy === 'alpha') return (a.title || a.name || '').localeCompare(b.title || b.name || '', 'de')
    return 0 // 'added' — keep original order (localStorage order)
  })

  // Count matches the filtered results now, instead of all tab items
  const movieCount = displayedItems.filter((m) => {
    if (m.media_type !== 'movie') return false
    if (!selectedProvider) return true
    return providerMap[`movie-${m.id}`]?.has(selectedProvider)
  }).length
  
  const tvCount = displayedItems.filter((m) => {
    if (m.media_type !== 'tv') return false
    if (!selectedProvider) return true
    return providerMap[`tv-${m.id}`]?.has(selectedProvider)
  }).length

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
            <p className="text-surface-400 text-sm mt-2">
              {displayedItems.length} {displayedItems.length === 1 ? 'Eintrag' : 'Einträge'}
            </p>
          )}
          {isFetchingShared && (
            <p className="text-accent-500 text-sm mt-2 animate-pulse">Lade Filmdaten...</p>
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
            <p className="text-surface-300 text-sm mt-1">
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


      {/* Controls: Tabs, Sort & Provider Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-surface-800/20 p-2 sm:p-0 rounded-xl sm:bg-transparent">
        {/* Tabs + Sort */}
        {displayedItems.length > 0 && !isFetchingShared && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 bg-surface-800 rounded-xl p-1">
              {tabs.map(({ key, label }) => {
                const count = key === 'all' ? filtered.length : key === 'movie' ? movieCount : tvCount
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    aria-pressed={activeTab === key}
                    className={`px-4 sm:px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === key
                        ? 'bg-accent-500 text-black'
                        : 'text-surface-300 hover:text-surface-100'
                    }`}
                  >
                    {label} ({count})
                  </button>
                )
              })}
            </div>

            <div className="flex gap-1 bg-surface-800 rounded-xl p-1">
              {[
                { value: 'added', label: 'Zuletzt hinzugefügt' },
                { value: 'rating', label: 'Bewertung' },
                { value: 'alpha', label: 'A–Z' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSortBy(value)}
                  aria-pressed={sortBy === value}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    sortBy === value
                      ? 'bg-accent-500 text-black'
                      : 'text-surface-300 hover:text-surface-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Provider Filter */}
        {availableProviders.length > 0 && !isFetchingShared && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-surface-400 text-xs uppercase tracking-wider font-medium max-sm:hidden">
              Anbieter
            </span>
            <div className="flex flex-wrap gap-1.5">
              {availableProviders.map(p => (
                <button
                  key={p.provider_id}
                  onClick={() => setSelectedProvider(prev => prev === p.provider_id ? null : p.provider_id)}
                  title={p.provider_name}
                  className={`relative rounded-lg overflow-hidden transition-all duration-300 cursor-pointer ${
                    selectedProvider === p.provider_id
                      ? 'ring-2 ring-accent-400 scale-110 shadow-[0_0_12px_-3px_rgba(245,158,11,0.4)]'
                      : selectedProvider 
                        ? 'opacity-40 hover:opacity-100 hover:scale-105' 
                        : 'opacity-80 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <img
                    src={`${IMAGE_BASE}/w92${p.logo_path}`}
                    alt={p.provider_name}
                    className="w-10 h-10 sm:w-11 sm:h-11 object-cover"
                  />
                </button>
              ))}
            </div>
            {providersLoading && (
              <div className="text-surface-500">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}
          </div>
        )}
      </div>

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
          <p className="text-surface-400 text-lg">
            Keine {activeTab === 'movie' ? 'Filme' : 'Serien'} auf der Merkliste.
          </p>
        </div>
      ) : (
        <div className="text-center py-20">
          <svg className="w-16 h-16 mx-auto text-surface-600 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <p className="text-surface-400 text-lg">
            {isSharedView ? 'Diese geteilte Merkliste ist leer.' : 'Deine Merkliste ist leer'}
          </p>
          {!isSharedView && (
            <>
              <p className="text-surface-500 text-sm mt-1">
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


