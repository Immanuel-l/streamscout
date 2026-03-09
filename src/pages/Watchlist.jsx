import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useWatchlist } from '../hooks/useWatchlist'
import { useToast } from '../components/common/useToast'
import MediaCard from '../components/common/MediaCard'

const tabs = [
  { key: 'all', label: 'Alle' },
  { key: 'movie', label: 'Filme' },
  { key: 'tv', label: 'Serien' },
]

function WatchlistCard({ item, index, onRemove }) {
  return (
    <div className="group/wl relative">
      <MediaCard
        media={{ ...item, media_type: item.media_type || 'movie' }}
        index={index}
        eager={index < 12}
        hideWatchlistButton={true}
      />
      {/* Remove button — always visible, top-right */}
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
    </div>
  )
}

function Watchlist() {
  const [activeTab, setActiveTab] = useState('all')
  const { items, remove } = useWatchlist()
  const toast = useToast()

  const handleRemove = useCallback((id, mediaType) => {
    const item = items.find((m) => m.id === id && m.media_type === mediaType)
    remove(id, mediaType)
    toast(`${item?.title || item?.name || 'Eintrag'} von Merkliste entfernt`, 'removed')
  }, [items, remove, toast])

  const filtered = activeTab === 'all'
    ? items
    : items.filter((m) => m.media_type === activeTab)

  const movieCount = items.filter((m) => m.media_type === 'movie').length
  const tvCount = items.filter((m) => m.media_type === 'tv').length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-5xl tracking-wide text-white">Merkliste</h1>
        {items.length > 0 && (
          <p className="text-surface-400 text-sm mt-2">
            {items.length} {items.length === 1 ? 'Eintrag' : 'Einträge'} gespeichert
          </p>
        )}
      </div>

      {/* Tabs */}
      {items.length > 0 && (
        <div className="flex gap-1 bg-surface-800 rounded-xl p-1 w-fit">
          {tabs.map(({ key, label }) => {
            const count = key === 'all' ? items.length : key === 'movie' ? movieCount : tvCount
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === key
                    ? 'bg-accent-500 text-black'
                    : 'text-surface-300 hover:text-white'
                }`}
              >
                {label} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {filtered.map((item, i) => (
            <WatchlistCard
              key={`${item.media_type}-${item.id}`}
              item={item}
              index={i}
              onRemove={handleRemove}
            />
          ))}
        </div>
      ) : items.length > 0 ? (
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
          <p className="text-surface-400 text-lg">Deine Merkliste ist leer</p>
          <p className="text-surface-500 text-sm mt-1">
            Klicke auf das Lesezeichen-Symbol bei Filmen oder Serien, um sie hier zu speichern.
          </p>
          <Link
            to="/discover"
            className="inline-block mt-6 px-6 py-2.5 rounded-lg bg-accent-500 text-black text-sm font-medium hover:bg-accent-400 transition-colors"
          >
            Entdecken
          </Link>
        </div>
      )}
    </div>
  )
}

export default Watchlist
