import { Link } from 'react-router-dom'
import MediaRow from '../components/common/MediaRow'
import { useTrendingMovies } from '../hooks/useMovies'
import { useTrendingTv } from '../hooks/useTv'
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
  const movies = useTrendingMovies()
  const tv = useTrendingTv()

  return (
    <div className="space-y-10">
      <MediaRow
        title="Trending Filme"
        items={movies.data}
        isLoading={movies.isLoading}
        error={movies.error}
      />

      <MoodSection />

      <MediaRow
        title="Trending Serien"
        items={tv.data}
        isLoading={tv.isLoading}
        error={tv.error}
      />
    </div>
  )
}

export default Home
