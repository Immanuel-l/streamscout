import { IMAGE_BASE } from '../../api/tmdb'
import { ALLOWED_PROVIDER_SET } from '../../utils/providers'

const providerLogoUrl = (path) => `${IMAGE_BASE}/w92${path}`

const sectionLabels = {
  flatrate: 'Streaming-Abo',
  rent: 'Leihen',
  buy: 'Kaufen',
}

const sectionOrder = ['flatrate', 'rent', 'buy']

function ProviderList({ providers }) {
  // Filter each section to only allowed providers
  const filtered = {}
  if (providers) {
    for (const key of sectionOrder) {
      if (providers[key]) {
        filtered[key] = providers[key].filter((p) => ALLOWED_PROVIDER_SET.has(p.provider_id))
      }
    }
  }

  const sections = sectionOrder.filter((key) => filtered[key]?.length > 0)

  if (sections.length === 0) {
    return (
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-surface-800/60 border border-surface-700/40 max-w-md">
        <svg className="w-5 h-5 text-surface-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        <div>
          <p className="text-surface-300 text-sm font-medium">Bei unseren Anbietern nicht verfügbar</p>
          <p className="text-surface-500 text-xs mt-0.5">Aktuell bei keinem unserer Streaming-Dienste im Abo enthalten.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sections.map((key) => (
        <div key={key}>
          <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-2">
            {sectionLabels[key]}
          </p>
          <div className="flex flex-wrap gap-2">
            {filtered[key].map((p) => (
              <a
                key={p.provider_id}
                href={providers.link}
                target="_blank"
                rel="noopener noreferrer"
                title={`${p.provider_name} – Verfügbarkeit anzeigen`}
                aria-label={`${p.provider_name} – Verfügbarkeit auf JustWatch anzeigen`}
                className="transition-all duration-300 hover:scale-110"
              >
                <img
                  src={providerLogoUrl(p.logo_path)}
                  alt={p.provider_name}
                  className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10 hover:ring-accent-500/40 transition-all duration-300 hover:shadow-[0_0_12px_-2px_rgba(245,158,11,0.25)]"
                />
              </a>
            ))}
          </div>
        </div>
      ))}
      <p className="text-[11px] text-surface-500">
        Daten von{' '}
        <a
          href="https://www.justwatch.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-surface-400 hover:text-accent-400 transition-colors"
        >
          JustWatch
        </a>
      </p>
    </div>
  )
}

export default ProviderList
