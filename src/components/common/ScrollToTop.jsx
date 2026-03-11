import { useState, useEffect } from 'react'

function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 500)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full bg-surface-800/90 border border-surface-700/50 backdrop-blur-sm text-surface-300 hover:text-surface-100 hover:bg-surface-700 transition-all duration-300 flex items-center justify-center shadow-lg shadow-black/30 animate-fade-in"
      aria-label="Nach oben scrollen"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  )
}

export default ScrollToTop
