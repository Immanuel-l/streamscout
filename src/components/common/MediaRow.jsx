import MediaCard from './MediaCard'

function MediaRowSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-36 sm:w-44">
          <div className="aspect-[2/3] rounded-xl bg-surface-800 animate-pulse" />
          <div className="mt-2 px-1 space-y-1.5">
            <div className="h-4 bg-surface-800 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-surface-800 rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

function MediaRow({ title, items, isLoading, error }) {
  return (
    <section className="space-y-4">
      <h2 className="font-display text-3xl sm:text-4xl tracking-wide text-white">{title}</h2>

      {error && (
        <p className="text-red-400 text-sm">Inhalte konnten nicht geladen werden. Bitte versuch es später nochmal.</p>
      )}

      {isLoading ? (
        <MediaRowSkeleton />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
          {items?.map((media, i) => (
            <div key={media.id} className="snap-start">
              <MediaCard media={media} index={i} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default MediaRow
