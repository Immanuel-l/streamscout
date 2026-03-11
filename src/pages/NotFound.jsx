import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

function NotFound() {
  useDocumentTitle('Seite nicht gefunden')
  return (
    <div className="flex items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
      <div className="text-center max-w-md space-y-5">
        <div className="relative">
          <span className="text-[8rem] sm:text-[10rem] font-display font-bold leading-none text-surface-800 select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-16 h-16 text-accent-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375v0c0-.621-.504-1.125-1.125-1.125H3.375m0 2.25v-2.25m0 0V5.625m0 12.75h17.25m0 0v-12.75M20.625 19.5a1.125 1.125 0 001.125-1.125M3.375 5.625a1.125 1.125 0 011.125-1.125h15a1.125 1.125 0 011.125 1.125m-17.25 0v12.75m17.25-12.75v12.75M6 9.75h.008v.008H6V9.75zm0 3h.008v.008H6v-.008zm0 3h.008v.008H6v-.008zm6-6h.008v.008H12V9.75zm0 3h.008v.008H12v-.008zm0 3h.008v.008H12v-.008zm6-6h.008v.008H18V9.75zm0 3h.008v.008H18v-.008z" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-display text-surface-100">Seite nicht gefunden</h1>
        <p className="text-surface-400 text-sm leading-relaxed">
          Diese Seite existiert nicht oder wurde verschoben.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            to="/"
            className="px-5 py-2.5 rounded-lg bg-accent-500 text-black text-sm font-medium hover:bg-accent-400 transition-colors"
          >
            Zur Startseite
          </Link>
          <Link
            to="/discover"
            className="px-5 py-2.5 rounded-lg bg-surface-800 text-surface-200 text-sm font-medium hover:bg-surface-700 transition-colors"
          >
            Entdecken
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFound
