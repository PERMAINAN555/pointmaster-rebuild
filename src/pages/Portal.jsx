import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { Search, Radio } from 'lucide-react'
import TournamentCard from '../components/TournamentCard.jsx'

export default function Portal() {
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('tournaments').select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (!error) setRows(data || [])
        setLoading(false)
      })
  }, [])

  const filtered = q.trim()
    ? rows.filter(t => t.name.toLowerCase().includes(q.toLowerCase()))
    : rows

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="text-center py-6">
        <h1 className="text-3xl font-black mb-2">Portal Turnamen</h1>
        <p className="text-gray-500 text-sm">Semua turnamen publik yang berjalan di PointMaster.</p>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={q} onChange={e => setQ(e.target.value)}
          placeholder="Cari turnamen…"
          className="w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm" />
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm text-center py-8">Memuat…</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-500 text-sm text-center py-8 bg-white border rounded-lg">Tidak ada hasil.</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map(t => (
            <div key={t.id} className="relative">
              <TournamentCard t={t} />
              {t.status === 'ongoing' && (
                <span className="absolute top-2 right-2 flex items-center gap-1 text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full">
                  <Radio size={10} /> LIVE
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
