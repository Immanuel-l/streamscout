import { t } from '../../utils/i18n'

function ArrowButton({ direction, onClick, groupHoverClass = 'group-hover/row' }) {
  const isLeft = direction === 'left'
  return (
    <button
      onClick={onClick}
      aria-label={isLeft ? t('common.scrollLeft') : t('common.scrollRight')}
      className={`absolute top-0 ${isLeft ? 'left-0' : 'right-0'} z-10 h-full w-12 sm:w-14 flex items-center ${isLeft ? 'justify-start' : 'justify-end'} opacity-0 ${groupHoverClass}:opacity-100 transition-opacity duration-300 cursor-pointer`}
    >
      <span className="w-10 h-10 rounded-full bg-surface-950/80 backdrop-blur-sm border border-surface-700/50 flex items-center justify-center text-surface-100 hover:bg-surface-800 hover:border-surface-600 transition-colors">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          {isLeft ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          )}
        </svg>
      </span>
    </button>
  )
}

export default ArrowButton
