import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import GridSkeleton from './components/common/GridSkeleton'

// Lazy-loaded pages — each becomes a separate chunk
const Home = lazy(() => import('./pages/Home'))
const Search = lazy(() => import('./pages/Search'))
const Discover = lazy(() => import('./pages/Discover'))
const MovieDetail = lazy(() => import('./pages/MovieDetail'))
const TvDetail = lazy(() => import('./pages/TvDetail'))
const Watchlist = lazy(() => import('./pages/Watchlist'))
const Random = lazy(() => import('./pages/Random'))
const Mood = lazy(() => import('./pages/Mood'))
const Anime = lazy(() => import('./pages/Anime'))
const Kino = lazy(() => import('./pages/Kino'))
const PersonDetail = lazy(() => import('./pages/PersonDetail'))

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Suspense fallback={<GridSkeleton />}><Home /></Suspense>} />
        <Route path="search" element={<Suspense fallback={<GridSkeleton count={12} />}><Search /></Suspense>} />
        <Route path="discover" element={<Suspense fallback={<GridSkeleton />}><Discover /></Suspense>} />
        <Route path="movie/:id" element={<Suspense fallback={null}><MovieDetail /></Suspense>} />
        <Route path="tv/:id" element={<Suspense fallback={null}><TvDetail /></Suspense>} />
        <Route path="person/:id" element={<Suspense fallback={null}><PersonDetail /></Suspense>} />
        <Route path="watchlist" element={<Suspense fallback={null}><Watchlist /></Suspense>} />
        <Route path="random" element={<Suspense fallback={null}><Random /></Suspense>} />
        <Route path="mood/:slug" element={<Suspense fallback={<GridSkeleton />}><Mood /></Suspense>} />
        <Route path="anime" element={<Suspense fallback={<GridSkeleton />}><Anime /></Suspense>} />
        <Route path="kino" element={<Suspense fallback={<GridSkeleton />}><Kino /></Suspense>} />
      </Route>
    </Routes>
  )
}

export default App
