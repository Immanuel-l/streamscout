import { useQuery } from '@tanstack/react-query'
import { getPersonDetails, getPersonCombinedCredits } from '../api/common'

export function usePersonDetails(id) {
  return useQuery({
    queryKey: ['person', id],
    queryFn: () => getPersonDetails(id),
    enabled: !!id,
  })
}

export function usePersonCredits(id) {
  return useQuery({
    queryKey: ['person', id, 'credits'],
    queryFn: () => getPersonCombinedCredits(id),
    enabled: !!id,
    select: (data) => {
      const cast = [...(data.cast || [])]
        .filter((c) => c.poster_path)
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .map((c) => ({
          ...c,
          media_type: c.media_type || 'movie',
        }))

      const crew = [...(data.crew || [])]
        .filter((c) => c.poster_path)
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .map((c) => ({
          ...c,
          media_type: c.media_type || 'movie',
        }))

      // Deduplicate (same person can appear multiple times as crew)
      const seen = new Set()
      const uniqueCrew = crew.filter((c) => {
        const key = `${c.id}-${c.media_type}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      return { cast, crew: uniqueCrew }
    },
  })
}
