import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-4xl font-bold mb-4">PointMaster</h1>
      <p className="text-gray-600 mb-8">Tournament manager untuk komunitas PUBGM.</p>
      <div className="flex gap-3 justify-center">
        <Link to="/dashboard" className="px-6 py-2 bg-brand text-white rounded-lg">Dashboard</Link>
        <Link to="/login" className="px-6 py-2 border rounded-lg">Login</Link>
      </div>
    </div>
  )
}
