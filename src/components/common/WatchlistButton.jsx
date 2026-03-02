import { useWatchlist } from '../../hooks/useWatchlist'

function WatchlistButton({ media, size = 'sm' }) {
  const { toggle, isInWatchlist } = useWatchlist()
  const active = isInWatchlist(media.id, media.media_type)

  const sizeClasses = size === 'lg'
    ? 'w-10 h-10'
    : 'w-8 h-8'

  const iconSize = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(media)
      }}
      title={active ? 'Von Merkliste entfernen' : 'Auf Merkliste setzen'}
      className={`${sizeClasses} flex items-center justify-center rounded-full transition-all ${
        active
          ? 'bg-accent-500 text-black hover:bg-accent-400'
          : 'bg-black/50 text-white hover:bg-accent-500 hover:text-black'
      }`}
    >
      {active ? (
        <svg className={iconSize} viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      ) : (
        <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      )}
    </button>
  )
}

export default WatchlistButton
