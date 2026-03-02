function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Hero backdrop */}
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 h-[30vh] sm:h-[45vh] md:h-[55vh] bg-surface-800" />

      {/* Content area matching real layout */}
      <div className="relative -mt-32 sm:-mt-40 md:-mt-52 z-10 flex flex-col md:flex-row gap-6 md:gap-10">
        {/* Poster placeholder — desktop only */}
        <div className="hidden md:block flex-shrink-0 w-56 lg:w-64 aspect-[2/3] rounded-xl bg-surface-700" />

        {/* Text content */}
        <div className="flex-1 min-w-0 space-y-5">
          <div className="h-12 bg-surface-700 rounded-lg w-3/4" />
          <div className="flex gap-3">
            <div className="h-5 bg-surface-800 rounded w-16" />
            <div className="h-5 bg-surface-800 rounded w-20" />
            <div className="h-5 bg-surface-800 rounded w-24" />
          </div>
          <div className="w-14 h-14 rounded-full bg-surface-800" />
          <div className="space-y-2 max-w-3xl">
            <div className="h-4 bg-surface-800 rounded w-full" />
            <div className="h-4 bg-surface-800 rounded w-full" />
            <div className="h-4 bg-surface-800 rounded w-2/3" />
          </div>
          <div>
            <div className="h-7 bg-surface-800 rounded w-40 mb-3" />
            <div className="flex gap-2">
              <div className="w-10 h-10 rounded-full bg-surface-800" />
              <div className="w-10 h-10 rounded-full bg-surface-800" />
              <div className="w-10 h-10 rounded-full bg-surface-800" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DetailSkeleton
