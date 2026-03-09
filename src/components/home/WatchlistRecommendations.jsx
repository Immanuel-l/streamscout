import MediaRow from '../common/MediaRow'
import { useWatchlistRecommendations } from '../../hooks/useWatchlistRecommendations'

function WatchlistRecommendations({ count = 2 }) {
  const { data, isLoading, error } = useWatchlistRecommendations(count)

  if (!isLoading && (!data || data.length === 0)) {
    return null
  }

  // If loading and we have no data yet, maybe show a skeleton row, but MediaRow handles isLoading well enough
  if (isLoading && data.length === 0) {
     return (
        <div className="space-y-10">
          <MediaRow
            title="Empfehlungen für dich"
            items={[]}
            isLoading={true}
          />
        </div>
     );
  }

  return (
    <div className="space-y-10">
      {data.map(({ sourceItem, recommendations }) => (
        <MediaRow
          key={`rec-${sourceItem.media_type}-${sourceItem.id}`}
          title={`Weil du "${sourceItem.title || sourceItem.name}" auf deiner Merkliste hast`}
          items={recommendations}
          isLoading={false}
          error={error}
        />
      ))}
    </div>
  )
}

export default WatchlistRecommendations
