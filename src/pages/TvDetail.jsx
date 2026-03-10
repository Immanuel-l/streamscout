import { useParams } from 'react-router-dom'
import { useTvDetails, useTvProviders, useTvSimilar, useTvSeasonProviders } from '../hooks/useTv'
import { backdropUrl, posterUrl, IMAGE_BASE } from '../api/tmdb'
import { ALLOWED_PROVIDER_SET } from '../utils/providers'
import DetailSkeleton from '../components/detail/DetailSkeleton'
import RatingRing from '../components/detail/RatingRing'
import ProviderList from '../components/detail/ProviderList'
import MediaRow from '../components/common/MediaRow'
import WatchlistButton from '../components/common/WatchlistButton'
import CastList from '../components/detail/CastList'
import TrailerSection from '../components/detail/TrailerSection'
import ErrorBox from '../components/common/ErrorBox'

const statusMap = {
  'Returning Series': 'Laufend',
  'Ended': 'Abgeschlossen',
  'Canceled': 'Abgesetzt',
  'In Production': 'In Produktion',
  'Planned': 'Geplant',
  'Pilot': 'Pilot',
}

function formatSeasonRange(seasonNumbers, totalSeasons) {
  if (seasonNumbers.length === totalSeasons) return null
  const sorted = [...seasonNumbers].sort((a, b) => a - b)
  const ranges = []
  let start = sorted[0]
  let end = sorted[0]
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i]
    } else {
      ranges.push(start === end ? `${start}` : `${start}–${end}`)
      start = sorted[i]
      end = sorted[i]
    }
  }
  ranges.push(start === end ? `${start}` : `${start}–${end}`)
  return `Staffel ${ranges.join(', ')}`
}

function SeasonList({ seasons, tvId }) {
  const filtered = seasons?.filter((s) => s.season_number > 0) ?? []
  const seasonNumbers = filtered.map((s) => s.season_number)
  const seasonProviders = useTvSeasonProviders(tvId, seasonNumbers)

  if (filtered.length === 0) return null

  const providerBySeasonNum = {}
  for (const sp of seasonProviders) {
    providerBySeasonNum[sp.seasonNumber] = sp
  }

  // Build per-provider season coverage (flatrate only, filtered)
  const providerCoverage = {}
  const allLoaded = seasonProviders.every((sp) => !sp.isLoading)
  if (allLoaded) {
    for (const sp of seasonProviders) {
      const flatrate = sp.data?.flatrate?.filter((p) => ALLOWED_PROVIDER_SET.has(p.provider_id)) ?? []
      for (const p of flatrate) {
        if (!providerCoverage[p.provider_id]) {
          providerCoverage[p.provider_id] = { provider: p, seasons: [] }
        }
        providerCoverage[p.provider_id].seasons.push(sp.seasonNumber)
      }
    }
  }

  const totalSeasons = filtered.length
  const allSeasonProviders = Object.values(providerCoverage)
    .filter((c) => c.seasons.length === totalSeasons)
  const partialProviders = Object.values(providerCoverage)
    .filter((c) => c.seasons.length < totalSeasons)
    .sort((a, b) => b.seasons.length - a.seasons.length)

  return (
    <div>
      <h2 className="font-display text-2xl tracking-wide text-white mb-3">
        Staffeln ({filtered.length})
      </h2>

      {/* Provider summary */}
      {allLoaded && Object.keys(providerCoverage).length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
          {allSeasonProviders.map(({ provider }) => (
            <span key={provider.provider_id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
              <img
                src={`${IMAGE_BASE}/w45${provider.logo_path}`}
                alt={provider.provider_name}
                className="w-5 h-5 rounded-full object-cover"
              />
              <span className="text-emerald-400 text-xs font-medium">Alle Staffeln</span>
            </span>
          ))}
          {partialProviders.map(({ provider, seasons: coveredSeasons }) => (
            <span key={provider.provider_id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-800 border border-surface-700/50">
              <img
                src={`${IMAGE_BASE}/w45${provider.logo_path}`}
                alt={provider.provider_name}
                className="w-5 h-5 rounded-full object-cover"
              />
              <span className="text-surface-300 text-xs">
                {formatSeasonRange(coveredSeasons, totalSeasons)}
              </span>
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((season) => {
          const sp = providerBySeasonNum[season.season_number]
          const flatrate = sp?.data?.flatrate?.filter((p) => ALLOWED_PROVIDER_SET.has(p.provider_id)) ?? []

          return (
            <div
              key={season.id}
              className="flex gap-3 p-3 rounded-xl bg-surface-800/60 border border-surface-700/50"
            >
              {season.poster_path ? (
                <img
                  src={`${IMAGE_BASE}/w185${season.poster_path}`}
                  alt={season.name}
                  className="w-16 h-24 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-24 rounded-lg bg-surface-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-surface-500 text-xs">S{season.season_number}</span>
                </div>
              )}
              <div className="min-w-0 flex flex-col justify-center">
                <p className="text-white text-sm font-medium truncate">{season.name}</p>
                <p className="text-surface-400 text-xs mt-0.5">
                  {season.episode_count} Episoden
                </p>
                {season.air_date && (
                  <p className="text-surface-500 text-xs mt-0.5">
                    {new Date(season.air_date).getFullYear()}
                  </p>
                )}
                {sp?.isLoading ? (
                  <div className="flex gap-1 mt-1.5">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-surface-700 animate-pulse" />
                    ))}
                  </div>
                ) : flatrate.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {flatrate.map((p) => (
                      <img
                        key={p.provider_id}
                        src={`${IMAGE_BASE}/w45${p.logo_path}`}
                        alt={p.provider_name}
                        title={p.provider_name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TvDetail() {
  const { id } = useParams()
  const { data: show, isLoading, error } = useTvDetails(id)
  const providers = useTvProviders(id)
  const genreIds = show?.genres?.map((g) => g.id)
  const keywordIds = show?.keywords?.results?.map((k) => k.id)
  const similar = useTvSimilar(id, genreIds, keywordIds)

  if (isLoading) return <DetailSkeleton />
  if (error) return <ErrorBox message="Serie konnte nicht geladen werden. Bitte versuch es später nochmal." />
  if (!show) return null

  const year = show.first_air_date ? new Date(show.first_air_date).getFullYear() : null
  const endYear = show.last_air_date ? new Date(show.last_air_date).getFullYear() : null
  const yearRange = year && endYear && year !== endYear ? `${year}–${endYear}` : year
  const status = statusMap[show.status] || show.status
  const network = show.networks?.[0]
  const backdrop = backdropUrl(show.backdrop_path)
  const poster = posterUrl(show.poster_path)
  const totalEpisodes = show.number_of_episodes

  return (
    <div>
      {/* Hero — cinematic multi-layer gradient */}
      <section className="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
        <div className="relative h-[30vh] sm:h-[45vh] md:h-[55vh]">
          {backdrop ? (
            <img
              src={backdrop}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
          ) : (
            <div className="absolute inset-0 bg-surface-800" />
          )}
          {/* Three-layer gradient: bottom fade, left fade, vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/70 via-60% to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-950/90 via-surface-950/30 via-50% to-transparent" />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(5,5,5,0.4) 100%)' }} />
        </div>
      </section>

      {/* Content */}
      <div className="relative -mt-20 sm:-mt-40 md:-mt-52 z-10 flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-10">
        {poster && (
          <div className="flex-shrink-0 self-center sm:self-start">
            <img
              src={poster}
              alt={show.name}
              className="w-36 sm:w-44 md:w-56 lg:w-64 rounded-xl shadow-2xl shadow-black/60 ring-1 ring-white/5"
            />
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-5">
          <div>
            <div className="flex items-start gap-4">
              <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl tracking-wide text-white leading-tight">
                {show.name}
              </h1>
              <WatchlistButton
                media={{ id: show.id, media_type: 'tv', name: show.name, poster_path: show.poster_path, vote_average: show.vote_average, first_air_date: show.first_air_date }}
                size="lg"
              />
            </div>
            {show.tagline && (
              <p className="text-accent-400 text-sm mt-2 italic">{show.tagline}</p>
            )}
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-surface-300">
            {yearRange && <span>{yearRange}</span>}
            <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
              show.status === 'Returning Series'
                ? 'bg-emerald-500/20 text-emerald-400'
                : show.status === 'Ended'
                  ? 'bg-surface-600 text-surface-200'
                  : 'bg-amber-500/20 text-amber-400'
            }`}>
              {status}
            </span>
            {show.number_of_seasons && (
              <span>{show.number_of_seasons} Staffeln</span>
            )}
            {totalEpisodes && (
              <span>{totalEpisodes} Episoden</span>
            )}
            {show.genres?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {show.genres.map((g) => (
                  <span key={g.id} className="px-2.5 py-0.5 rounded-full bg-surface-800 text-surface-200 text-xs">
                    {g.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Network */}
          {network && (
            <div className="flex items-center gap-2">
              {network.logo_path ? (
                <img
                  src={`${IMAGE_BASE}/w92${network.logo_path}`}
                  alt={network.name}
                  className="h-6 object-contain brightness-0 invert opacity-70"
                />
              ) : (
                <span className="text-surface-300 text-sm">{network.name}</span>
              )}
            </div>
          )}

          {/* Rating */}
          {show.vote_average > 0 && (
            <div className="flex items-center gap-3">
              <RatingRing rating={show.vote_average} />
              <span className="text-sm text-surface-400">
                {show.vote_count?.toLocaleString('de-DE')} Bewertungen
              </span>
            </div>
          )}

          {/* Description */}
          {show.overview && (
            <p className="text-surface-200 leading-relaxed max-w-3xl">{show.overview}</p>
          )}

          {/* Providers */}
          <div>
            <h2 className="font-display text-2xl tracking-wide text-white mb-3">Wo streamen?</h2>
            {providers.isLoading ? (
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-surface-800 animate-pulse" />
                ))}
              </div>
            ) : (
              <ProviderList providers={providers.data} />
            )}
          </div>
        </div>
      </div>

      {/* Cast */}
      {show.credits?.cast?.length > 0 && (
        <div className="mt-14">
          <CastList cast={show.credits.cast} />
        </div>
      )}

      {/* Trailer */}
      {show.videos?.results?.length > 0 && (
        <div className="mt-14">
          <TrailerSection videos={show.videos.results} />
        </div>
      )}

      {/* Seasons */}
      <div className="mt-14">
        <SeasonList seasons={show.seasons} tvId={id} />
      </div>

      {/* Similar */}
      {(similar.isLoading || similar.data?.length > 0) && (
        <div className="mt-14">
          <MediaRow
            title="Ähnliche Serien"
            items={similar.data}
            isLoading={similar.isLoading}
            error={similar.error}
          />
        </div>
      )}
    </div>
  )
}

export default TvDetail
