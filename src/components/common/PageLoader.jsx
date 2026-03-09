function PageLoader() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-accent-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-accent-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-accent-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

export default PageLoader
