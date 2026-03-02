import { useParams } from 'react-router-dom'

function MovieDetail() {
  const { id } = useParams()

  return (
    <div>
      <h1 className="font-display text-5xl text-accent-400 mb-6">Film Details</h1>
      <p className="text-surface-300">Film ID: {id}</p>
    </div>
  )
}

export default MovieDetail
