import MediaRow from '../components/common/MediaRow'
import { useTrendingMovies } from '../hooks/useMovies'
import { useTrendingTv } from '../hooks/useTv'

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
