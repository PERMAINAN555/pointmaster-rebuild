import { Link, Outlet, useLocation } from 'react-router-dom'

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/turnamen', label: 'Turnamen' },
  { to: '/planner', label: 'Planner' },
  { to: '/generator-pot', label: 'POT' },
  { to: '/panduan', label: 'Panduan' }
]

export default function Layout() {
  const { pathname } = useLocation()
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-6 h-14 overflow-x-auto">
          <Link to="/" className="font-bold text-brand whitespace-nowrap">PointMaster</Link>
          {NAV.map(n => (
            <Link
              key={n.to}
              to={n.to}
              className={`text-sm whitespace-nowrap ${pathname.startsWith(n.to) ? 'text-brand font-semibold' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
      <main className="max-w-6xl mx-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}
