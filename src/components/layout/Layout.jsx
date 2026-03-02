import { Outlet } from 'react-router-dom'
import Header from './Header'

function Layout() {
  return (
    <div className="min-h-screen bg-surface-950">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
