function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 h-[50vh] bg-surface-800" />
      <div className="mt-8 space-y-4 max-w-3xl">
        <div className="h-10 bg-surface-800 rounded w-2/3" />
        <div className="h-5 bg-surface-800 rounded w-1/3" />
        <div className="h-24 bg-surface-800 rounded w-full" />
      </div>
    </div>
  )
}

export default DetailSkeleton
