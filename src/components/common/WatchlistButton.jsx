import { useWatchlist } from '../../hooks/useWatchlist'
import { useToast } from './useToast'

function WatchlistButton({ media, size = 'sm' }) {
  const { toggle, isInWatchlist } = useWatchlist()
  const toast = useToast()
  const active = isInWatchlist(media.id, media.media_type)

  const sizeClasses = size === 'lg'
    ? 'w-10 h-10'
    : 'w-8 h-8'

  const iconSize = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'

  const title = media.title || media.name

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        const wasActive = active
        toggle(media)
        if (wasActive) {
          toast(`${title} von Merkliste entfernt`, 'removed')
        } else {
          toast(`${title} zur Merkliste hinzugefügt`, 'added')
        }
      }}
      aria-label={active ? `${title} von Merkliste entfernen` : `${title} auf Merkliste setzen`}
      aria-pressed={active}
      className={`${sizeClasses} flex items-center justify-center rounded-full transition-all duration-300 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 ${
        active
          ? 'bg-accent-500 text-black hover:bg-accent-400 shadow-[0_0_12px_-2px_rgba(245,158,11,0.4)]'
          : 'bg-black/50 text-white hover:bg-accent-500 hover:text-black backdrop-blur-sm'
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
