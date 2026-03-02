import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWatchlist } from '../hooks/useWatchlist'
import { posterUrl } from '../api/tmdb'

const tabs = [
  { key: 'all', label: 'Alle' },
  { key: 'movie', label: 'Filme' },
  { key: 'tv', label: 'Serien' },
]

function WatchlistCard({ item, index = 0, onRemove }) {
  const title = item.title || item.name
  const poster = posterUrl(item.poster_path, 'w342')
  const linkPath = item.media_type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`

  return (
    <div
      className="group relative animate-fade-in"
      style={{ animationDelay: `${(index % 20) * 50}ms` }}
    >
      <Link to={linkPath}>
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface-800">
          {poster ? (
            <img
              src={poster}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-surface-500">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
            </div>
          )}

          <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-900/80 text-accent-400 backdrop-blur-sm">
            {item.media_type === 'tv' ? 'Serie' : 'Film'}
          </span>
        </div>
      </Link>

      {/* Remove button */}
      <button
        onClick={() => onRemove(item.id, item.media_type)}
        title="Von Merkliste entfernen"
        className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="mt-2 px-1">
        <p className="text-surface-200 text-sm font-medium leading-tight line-clamp-1">{title}</p>
      </div>
    </div>
  )
}

function Watchlist() {
  const [activeTab, setActiveTab] = useState('all')
  const { items, remove } = useWatchlist()

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
              onRemove={remove}
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
