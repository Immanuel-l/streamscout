import { Link } from 'react-router-dom'
import MediaRow from '../components/common/MediaRow'
import { useTrendingAll, usePopularMovies, useTopRatedMovies, useNewMovies } from '../hooks/useMovies'
import { usePopularTv, useTopRatedTv, useNewTv } from '../hooks/useTv'
import { moods } from '../utils/moods'

function MoodSection() {
  return (
    <section className="space-y-4">
      <h2 className="font-display text-3xl sm:text-4xl tracking-wide text-white">Worauf hast du Lust?</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {moods.map((mood) => (
          <Link
            key={mood.slug}
            to={`/mood/${mood.slug}`}
            className={`group relative rounded-xl border bg-gradient-to-br ${mood.gradient} ${mood.border} p-4 sm:p-5 transition-all hover:scale-[1.03] hover:shadow-lg`}
          >
            <span className="text-3xl block mb-2">{mood.icon}</span>
            <p className="text-white font-medium text-sm sm:text-base leading-tight">{mood.title}</p>
            <p className="text-surface-400 text-xs mt-1 leading-snug">{mood.subtitle}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

function Home() {
  const trending = useTrendingAll()
  const movies = usePopularMovies()
  const tv = usePopularTv()
  const topMovies = useTopRatedMovies()
  const topTv = useTopRatedTv()
  const newMovies = useNewMovies()
  const newTv = useNewTv()

  return (
    <div className="space-y-10">
      <MediaRow
        title="Gerade im Trend"
        items={trending.data}
        isLoading={trending.isLoading}
        error={trending.error}
      />

      <MediaRow
        title="Beliebte Filme"
        items={movies.data}
        isLoading={movies.isLoading}
        error={movies.error}
      />

      <MoodSection />

      <MediaRow
        title="Beliebte Serien"
        items={tv.data}
        isLoading={tv.isLoading}
        error={tv.error}
      />

      <MediaRow
        title="Bestbewertete Filme"
        items={topMovies.data}
        isLoading={topMovies.isLoading}
        error={topMovies.error}
      />

      <MediaRow
        title="Bestbewertete Serien"
        items={topTv.data}
        isLoading={topTv.isLoading}
        error={topTv.error}
      />

      <MediaRow
        title="Neu erschienen"
        items={newMovies.data}
        isLoading={newMovies.isLoading}
        error={newMovies.error}
      />

      <MediaRow
        title="Neue Serien"
        items={newTv.data}
        isLoading={newTv.isLoading}
        error={newTv.error}
      />
    </div>
  )
}

export default Home
