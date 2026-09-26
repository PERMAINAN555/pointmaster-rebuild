import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import TournamentCard from '../components/TournamentCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Turnamen() {
  const { session } = useAuth()
  const [rows, setRows] = useState([])
  const [mine, setMine] = useState(false)
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let q = supabase.from('tournaments').select('*').order('created_at', { ascending: false })
    if (mine && session) q = q.eq('admin_id', session.user.id)
    q.then(({ data, error }) => {
      if (error) setErr(error.message)
      else setRows(data || [])
      setLoading(false)
    })
  }, [mine, session])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Turnamen</h2>
        {session && (
          <div className="flex gap-2">
            <button onClick={() => setMine(!mine)}
              className={`px-3 py-1.5 rounded text-sm border ${mine ? 'bg-brand text-white border-brand' : 'border-gray-300'}`}>
              {mine ? 'Milik Saya' : 'Semua'}
            </button>
            <Link to="/dashboard" className="px-3 py-1.5 bg-brand text-white rounded text-sm">
              + Turnamen
            </Link>
          </div>
        )}
      </div>

      {err && <div className="text-red-600 text-sm">{err}</div>}
      {loading && <div className="text-gray-500 text-sm">Memuat…</div>}

      <div className="grid gap-3 md:grid-cols-2">
        {rows.map(t => <TournamentCard key={t.id} t={t} />)}
        {!loading && rows.length === 0 && (
          <div className="text-gray-500 text-sm md:col-span-2">Belum ada turnamen.</div>
        )}
      </div>
    </div>
  )
}
