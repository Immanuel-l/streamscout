import { useParams } from 'react-router-dom'

function TvDetail() {
  const { id } = useParams()

  return (
    <div>
      <h1 className="font-display text-5xl text-accent-400 mb-6">Serien Details</h1>
      <p className="text-surface-300">Serien ID: {id}</p>
    </div>
  )
}

export default TvDetail
