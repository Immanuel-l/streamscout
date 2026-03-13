function SegmentedControl({
  options = [],
  value,
  onChange,
  size = 'md',
  className = '',
  buttonClassName = '',
  activeClassName = 'bg-accent-500 text-black',
  inactiveClassName = 'text-surface-200 hover:text-surface-100',
}) {
  if (!Array.isArray(options) || options.length === 0) return null

  const sizeClass =
    size === 'lg'
      ? 'px-5 py-2 text-sm'
      : size === 'sm'
        ? 'px-3 py-1.5 text-xs'
        : 'px-4 py-2 text-sm'

  return (
    <div className={`flex flex-wrap gap-1 rounded-xl bg-surface-800 p-1 ${className}`.trim()}>
      {options.map((option) => {
        const isActive = String(option.value) === String(value)

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            aria-label={option.ariaLabel || undefined}
            disabled={option.disabled}
            className={`${sizeClass} rounded-lg font-medium transition-colors ${
              isActive ? activeClassName : inactiveClassName
            } ${buttonClassName}`.trim()}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default SegmentedControl
