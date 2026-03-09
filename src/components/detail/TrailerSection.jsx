import { useState } from 'react'

function TrailerSection({ videos }) {
  const [playing, setPlaying] = useState(false)

  if (!videos || videos.length === 0) return null

  // Prefer German trailer, then English trailer, then any trailer, then teaser
  const trailer =
    videos.find((v) => v.type === 'Trailer' && v.site === 'YouTube' && v.iso_639_1 === 'de') ||
    videos.find((v) => v.type === 'Trailer' && v.site === 'YouTube') ||
    videos.find((v) => v.type === 'Teaser' && v.site === 'YouTube')

  if (!trailer) return null

  return (
    <div>
      <h2 className="font-display text-2xl tracking-wide text-white mb-3">Trailer</h2>
      {playing ? (
        <div className="relative w-full max-w-3xl aspect-video rounded-xl overflow-hidden ring-1 ring-white/10">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0`}
            title={trailer.name}
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      ) : (
        <button
          onClick={() => setPlaying(true)}
          className="relative w-full max-w-3xl aspect-video rounded-xl overflow-hidden ring-1 ring-white/10 group cursor-pointer"
        >
          <img
            src={`https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg`}
            alt={trailer.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-accent-500/90 flex items-center justify-center group-hover:scale-110 group-hover:bg-accent-400 transition-all duration-300 shadow-lg shadow-accent-500/30">
              <svg className="w-7 h-7 sm:w-9 sm:h-9 text-surface-950 ml-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          <p className="absolute bottom-3 left-3 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {trailer.name}
          </p>
        </button>
      )}
    </div>
  )
}

export default TrailerSection
