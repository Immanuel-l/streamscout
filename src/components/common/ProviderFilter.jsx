import { IMAGE_BASE } from '../../api/tmdb'

function ProviderFilter({ providers, selected, onToggle, label = 'Streaming-Anbieter' }) {
  if (!providers?.length) return null

  return (
    <div>
      <p className="text-xs font-medium text-surface-200 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {providers.map((p) => (
          <button
            key={p.provider_id}
            onClick={() => onToggle(p.provider_id)}
            aria-label={`${p.provider_name} ${selected.includes(p.provider_id) ? 'deaktivieren' : 'aktivieren'}`}
            aria-pressed={selected.includes(p.provider_id)}
            className={`rounded-xl overflow-hidden transition-all duration-300 ${
              selected.includes(p.provider_id)
                ? 'ring-2 ring-accent-400 scale-110 shadow-[0_0_16px_-4px_rgba(245,158,11,0.35)]'
                : 'opacity-60 hover:opacity-100 hover:scale-105'
            }`}
          >
            <img
              src={`${IMAGE_BASE}/w92${p.logo_path}`}
              alt={p.provider_name}
              className="w-11 h-11 object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export default ProviderFilter

