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
  if (!providers) return null

  // Filter each section to only allowed providers
  const filtered = {}
  for (const key of sectionOrder) {
    if (providers[key]) {
      filtered[key] = providers[key].filter((p) => ALLOWED_PROVIDER_SET.has(p.provider_id))
    }
  }

  const sections = sectionOrder.filter((key) => filtered[key]?.length > 0)

  if (sections.length === 0) {
    return (
      <p className="text-surface-400 text-sm">
        Keine Streaming-Infos für Deutschland verfügbar.
      </p>
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
                className="transition-transform hover:scale-110"
              >
                <img
                  src={providerLogoUrl(p.logo_path)}
                  alt={p.provider_name}
                  className="w-10 h-10 rounded-full object-cover"
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
