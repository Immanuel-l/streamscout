import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Search from './pages/Search'
import Discover from './pages/Discover'
import MovieDetail from './pages/MovieDetail'
import TvDetail from './pages/TvDetail'
import Watchlist from './pages/Watchlist'
import Random from './pages/Random'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="search" element={<Search />} />
        <Route path="discover" element={<Discover />} />
        <Route path="movie/:id" element={<MovieDetail />} />
        <Route path="tv/:id" element={<TvDetail />} />
        <Route path="watchlist" element={<Watchlist />} />
        <Route path="random" element={<Random />} />
      </Route>
    </Routes>
  )
}

export default App
