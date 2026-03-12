import { useId, useState } from 'react'

function hasRenderableChildren(children) {
  return children !== null && children !== undefined && children !== false
}

function FilterPanel({
  title = 'Filter',
  quickLabel = 'Wichtige Filter',
  quickContent,
  children,
  defaultOpen = false,
  activeCount = 0,
  onReset,
  resetLabel = 'Filter zurücksetzen',
  className = '',
}) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()
  const hasAdvanced = hasRenderableChildren(children)
  const showReset = typeof onReset === 'function' && activeCount > 0

  return (
    <section className={`rounded-2xl border border-surface-700 bg-surface-900/40 p-4 sm:p-5 space-y-4 ${className}`.trim()}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-surface-200 uppercase tracking-wider">{title}</p>
          <p className="text-sm text-surface-300 mt-1">
            {activeCount > 0 ? `${activeCount} aktive Filter` : 'Keine aktiven Filter'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showReset && (
            <button
              type="button"
              onClick={onReset}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-surface-800 text-surface-200 border border-surface-600 hover:text-surface-100 hover:border-surface-500 transition-colors"
            >
              {resetLabel}
            </button>
          )}

          {hasAdvanced && (
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              aria-expanded={open}
              aria-controls={panelId}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-surface-800 text-surface-200 hover:text-surface-100 hover:bg-surface-700 transition-colors"
            >
              <span>{open ? 'Weitere Filter ausblenden' : 'Weitere Filter anzeigen'}</span>
              <svg
                className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {quickContent && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-surface-200 uppercase tracking-wider">{quickLabel}</p>
          {quickContent}
        </div>
      )}

      {hasAdvanced && (
        <div id={panelId} className={`${open ? 'block' : 'hidden'} border-t border-surface-700/70 pt-4 space-y-3`}>
          <p className="text-xs font-medium text-surface-200 uppercase tracking-wider">Weitere Filter</p>
          <div className="space-y-4">{children}</div>
        </div>
      )}
    </section>
  )
}

export default FilterPanel
