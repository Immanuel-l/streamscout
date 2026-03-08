function RatingRing({ rating }) {
  const score = Math.round(rating * 10)
  const radius = 20
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color =
    score >= 70 ? 'stroke-emerald-500' : score >= 50 ? 'stroke-amber-500' : 'stroke-red-500'
  const glowColor =
    score >= 70 ? 'rgba(16,185,129,0.3)' : score >= 50 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'

  return (
    <div className="relative w-14 h-14 flex-shrink-0" style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={radius} fill="none" className="stroke-surface-700" strokeWidth="3" />
        <circle
          cx="24" cy="24" r={radius} fill="none"
          className={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
        {score}<span className="text-[9px] text-surface-300">%</span>
      </span>
    </div>
  )
}

export default RatingRing
