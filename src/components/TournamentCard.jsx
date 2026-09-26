import { Link } from 'react-router-dom'

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  ongoing: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800'
}

export default function TournamentCard({ t }) {
  return (
    <Link to={`/tournament/${t.id}`}
      className="block bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{t.name}</div>
          <div className="text-xs text-gray-500 mt-1 flex gap-2 flex-wrap">
            <span>{t.format}</span>
            {t.type && <span>· {t.type}</span>}
            {t.location && <span>· {t.location}</span>}
            {t.start_date && <span>· {new Date(t.start_date).toLocaleDateString('id-ID')}</span>}
          </div>
        </div>
        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${STATUS_COLORS[t.status] || STATUS_COLORS.draft}`}>
          {t.status}
        </span>
      </div>
    </Link>
  )
}
