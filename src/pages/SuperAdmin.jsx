import { useParams } from 'react-router-dom'

export default function SuperAdmin() {
  const params = useParams()
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-2">SuperAdmin</h2>
      {Object.keys(params).length > 0 && (
        <pre className="text-xs bg-gray-100 p-3 rounded">
          {JSON.stringify(params, null, 2)}
        </pre>
      )}
      <p className="text-gray-500 mt-4">Stub — isi dari bundle setelah di-reconstruct.</p>
    </div>
  )
}
