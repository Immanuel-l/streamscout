function GridSkeleton({ count = 18 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
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

export default GridSkeleton
