import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

export default function Dashboard() {
  const [rows, setRows] = useState([])
  const [err, setErr] = useState(null)

  useEffect(() => {
    supabase
      .from('tournaments')
      .select('id, name, format, status, created_at')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (error) setErr(error.message)
        else setRows(data || [])
      })
  }, [])

  if (err) return <div className="text-red-600 p-4">Error: {err}</div>

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <p className="text-sm text-gray-500 mb-4">20 turnamen terbaru</p>
      <div className="bg-white rounded-lg border divide-y">
        {rows.map(t => (
          <div key={t.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-gray-500">{t.format} · {t.status}</div>
            </div>
            <Link to={`/tournament/${t.id}`} className="text-brand text-sm">Buka →</Link>
          </div>
        ))}
        {rows.length === 0 && <div className="p-4 text-gray-500">Belum ada data.</div>}
      </div>
    </div>
  )
}
