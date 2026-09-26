import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { session, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <div className="p-8 text-gray-500">Memuat…</div>
  if (!session) return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  if (adminOnly) {
    // gate admin real: panggil /api/admin/verify di page-nya sendiri
  }
  return children
}
