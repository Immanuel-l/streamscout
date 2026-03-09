import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import MediaRow from '../components/common/MediaRow'
import { useNowPlaying, usePopularMovies, useTopRatedMovies, useNewMovies, usePopularAnime } from '../hooks/useMovies'
import { usePopularTv, useTopRatedTv, useNewTv } from '../hooks/useTv'
import { usePersistedState } from '../hooks/usePersistedState'
import { moods } from '../utils/moods'

function MoodSection() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-display text-4xl sm:text-5xl tracking-wide text-white">Worauf hast du Lust?</h2>
        <p className="text-surface-400 text-sm mt-1">Wähle deine Stimmung und lass dich überraschen.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {moods.map((mood) => (
          <Link
            key={mood.slug}
            to={`/mood/${mood.slug}`}
            className={`group relative rounded-xl border bg-gradient-to-br ${mood.gradient} ${mood.border} p-4 sm:p-5 transition-all duration-300 hover:scale-[1.04] hover:shadow-xl hover:shadow-black/30`}
          >
            <span className="text-3xl block mb-2 transition-transform duration-300 group-hover:scale-110">{mood.icon}</span>
            <p className="text-white font-medium text-sm sm:text-base leading-tight">{mood.title}</p>
            <p className="text-white/50 text-xs mt-1 leading-snug">{mood.subtitle}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

const kinoSortOptions = [
  { value: 'recommended', label: 'Empfohlen' },
  { value: 'date', label: 'Kinostart' },
  { value: 'popularity', label: 'Beliebtheit' },
]

function sortKinoMovies(movies, sortBy) {
  if (sortBy === 'popularity') {
    return [...movies].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
  }
  if (sortBy === 'date') return movies
  // 'recommended' — Rang-basierter Mix aus Kinostart + Beliebtheit
  const dateRank = new Map(movies.map((m, i) => [m.id, i]))
  const popSorted = [...movies].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
  const popRank = new Map(popSorted.map((m, i) => [m.id, i]))
  return [...movies].sort((a, b) =>
    (dateRank.get(a.id) + popRank.get(a.id)) - (dateRank.get(b.id) + popRank.get(b.id))
  )
}

function Home() {
  const nowPlaying = useNowPlaying()
  const [kinoSort, setKinoSort] = usePersistedState('kino.sortBy', 'recommended')
  const kinoMovies = useMemo(() =>
    sortKinoMovies(nowPlaying.data?.movies || [], kinoSort)
  , [nowPlaying.data?.movies, kinoSort])
  const movies = usePopularMovies()
  const tv = usePopularTv()
  const topMovies = useTopRatedMovies()
  const topTv = useTopRatedTv()
  const newMovies = useNewMovies()
  const newTv = useNewTv()
  const anime = usePopularAnime()

  return (
    <div className="space-y-10">

      <MoodSection />

      <MediaRow
        title="Aktuell im Kino"
        items={kinoMovies}
        isLoading={nowPlaying.isLoading}
        error={nowPlaying.error}
        linkTo="/kino"
        sortOptions={kinoSortOptions}
        sortBy={kinoSort}
        onSortChange={setKinoSort}
      />

      <MediaRow
        title="Beliebte Filme"
        items={movies.data}
        isLoading={movies.isLoading}
        error={movies.error}
        linkTo="/discover?type=movie"
      />

      <MediaRow
        title="Beliebte Serien"
        items={tv.data}
        isLoading={tv.isLoading}
        error={tv.error}
        linkTo="/discover?type=tv"
      />

      <MediaRow
        title="Beliebte Anime"
        items={anime.data}
        isLoading={anime.isLoading}
        error={anime.error}
        linkTo="/anime"
      />

      <MediaRow
        title="Bestbewertete Filme"
        items={topMovies.data}
        isLoading={topMovies.isLoading}
        error={topMovies.error}
        linkTo="/discover?type=movie&sort=rating"
      />

      <MediaRow
        title="Bestbewertete Serien"
        items={topTv.data}
        isLoading={topTv.isLoading}
        error={topTv.error}
        linkTo="/discover?type=tv&sort=rating"
      />

      <MediaRow
        title="Neu erschienen"
        items={newMovies.data}
        isLoading={newMovies.isLoading}
        error={newMovies.error}
        linkTo="/discover?type=movie&sort=date"
      />

      <MediaRow
        title="Neue Serien"
        items={newTv.data}
        isLoading={newTv.isLoading}
        error={newTv.error}
        linkTo="/discover?type=tv&sort=date"
      />
    </div>
  )
}

export default Home
