import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import MediaRow from '../components/common/MediaRow'
import WatchlistButton from '../components/common/WatchlistButton'
import { useNowPlaying, usePopularMovies, useTopRatedMovies, useNewMovies, usePopularAnime, useTrendingAll } from '../hooks/useMovies'
import { usePopularTv, useTopRatedTv, useNewTv } from '../hooks/useTv'
import { usePersistedState } from '../hooks/usePersistedState'
import { backdropUrl } from '../api/tmdb'
import { moods } from '../utils/moods'
import WatchlistRecommendations from '../components/home/WatchlistRecommendations'

function HeroSection({ items }) {
  const heroItems = useMemo(
    () => (items || []).filter((m) => m.backdrop_path && m.overview),
    [items]
  )
  const [index, setIndex] = useState(0)
  const [fade, setFade] = useState(true)
  const touchRef = useRef(null)

  const goTo = useCallback((newIndex) => {
    setFade(false)
    setTimeout(() => {
      setIndex(newIndex)
      setFade(true)
    }, 300)
  }, [])

  const next = useCallback(() => {
    if (heroItems.length <= 1) return
    goTo((index + 1) % heroItems.length)
  }, [heroItems.length, index, goTo])

  const prev = useCallback(() => {
    if (heroItems.length <= 1) return
    goTo((index - 1 + heroItems.length) % heroItems.length)
  }, [heroItems.length, index, goTo])

  useEffect(() => {
    if (heroItems.length <= 1) return
    const timer = setInterval(next, 8000)
    return () => clearInterval(timer)
  }, [next, heroItems.length])

  // Swipe gestures
  function handleTouchStart(e) {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  function handleTouchEnd(e) {
    if (!touchRef.current) return
    const dx = e.changedTouches[0].clientX - touchRef.current.x
    const dy = e.changedTouches[0].clientY - touchRef.current.y
    touchRef.current = null
    // Only trigger if horizontal swipe is dominant and > 50px
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) next()
      else prev()
    }
  }

  if (heroItems.length === 0) return null

  const item = heroItems[index]
  const title = item.title || item.name
  const date = item.release_date || item.first_air_date
  const year = date ? new Date(date).getFullYear() : null
  const type = item.media_type === 'tv' ? 'tv' : 'movie'
  const linkPath = type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`
  const score = item.vote_average > 0 ? Math.round(item.vote_average * 10) : null

  return (
    <section className="group/hero relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 mb-4">
      <div
        className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] overflow-hidden touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={backdropUrl(item.backdrop_path, 'original')}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}
        />
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/60 via-55% to-surface-950/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-950/80 via-transparent to-transparent" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(5,5,5,0.5) 100%)' }} />

        {/* Arrow Buttons */}
        {heroItems.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Vorheriger Slide"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface-950/60 backdrop-blur-sm border border-surface-700/40 flex items-center justify-center text-white/70 hover:text-white hover:bg-surface-800/80 transition-all duration-300 opacity-0 group-hover/hero:opacity-100"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={next}
              aria-label="Nächster Slide"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface-950/60 backdrop-blur-sm border border-surface-700/40 flex items-center justify-center text-white/70 hover:text-white hover:bg-surface-800/80 transition-all duration-300 opacity-0 group-hover/hero:opacity-100"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Content */}
        <div className={`absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 max-w-7xl mx-auto transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}>
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-md bg-accent-500/90 text-black text-xs font-bold uppercase tracking-wider">
                Trending
              </span>
              {score && (
                <span className="text-accent-400 text-sm font-bold">{score}%</span>
              )}
              {year && <span className="text-surface-300 text-sm">{year}</span>}
            </div>

            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-wide text-white leading-tight">
              {title}
            </h2>

            <p className="text-surface-200 text-sm sm:text-base leading-relaxed line-clamp-2 sm:line-clamp-3">
              {item.overview}
            </p>

            <div className="flex items-center gap-3 pt-1">
              <Link
                to={linkPath}
                className="px-6 py-2.5 rounded-lg bg-accent-500 text-black text-sm font-bold hover:bg-accent-400 transition-colors"
              >
                Details ansehen
              </Link>
              <WatchlistButton media={{ ...item, media_type: type }} size="lg" />
            </div>
          </div>

          {/* Dots indicator */}
          {heroItems.length > 1 && (
            <div className="flex gap-1.5 mt-6">
              {heroItems.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`h-1 rounded-full transition-all duration-300 ${i === index ? 'w-6 bg-accent-500' : 'w-1.5 bg-surface-500/50 hover:bg-surface-400/50'}`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

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
  const trending = useTrendingAll()
  const movies = usePopularMovies()
  const tv = usePopularTv()
  const topMovies = useTopRatedMovies()
  const topTv = useTopRatedTv()
  const newMovies = useNewMovies()
  const newTv = useNewTv()
  const anime = usePopularAnime()

  return (
    <div className="space-y-12">

      <HeroSection items={trending.data} />

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

      <WatchlistRecommendations />

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
