function FilterField({ label, description, children, className = '' }) {
  return (
    <div className={className}>
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-surface-200">{label}</p>
      {description && <p className="mb-2 text-xs text-surface-400">{description}</p>}
      {children}
    </div>
  )
}

export default FilterField
