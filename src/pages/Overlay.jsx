import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

export default function Overlay() {
  const { id } = useParams()
  const [t, setT] = useState(null)
  const [teams, setTeams] = useState({})
  const [rows, setRows] = useState([])
  const [err, setErr] = useState('')

  async function load() {
    if (!id) return
    const { data: tr } = await supabase.from('tournaments').select('name, format, status').eq('id', id).single()
    if (!tr) return setErr('Turnamen tidak ditemukan.')
    setT(tr)
    const { data: te } = await supabase.from('teams').select('id, team_name').eq('tournament_id', id)
    setTeams(Object.fromEntries((te || []).map(x => [x.id, x.team_name])))
    const { data: re } = await supabase.from('match_results')
      .select('team_id, kill_count, total_match_point, matches!inner(tournament_id)')
      .eq('matches.tournament_id', id)
    const agg = {}
    for (const r of re || []) {
      if (!agg[r.team_id]) agg[r.team_id] = { team_id: r.team_id, kills: 0, points: 0 }
      agg[r.team_id].kills += r.kill_count || 0
      agg[r.team_id].points += r.total_match_point || 0
    }
    setRows(Object.values(agg).sort((a, b) => b.points - a.points || b.kills - a.kills).slice(0, 12))
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [id])

  if (err) return <div className="p-4 text-red-500">{err}</div>
  if (!t) return <div className="p-4 text-gray-500">Memuat…</div>

  return (
    <div className="bg-transparent p-4 inline-block" style={{ minWidth: 380 }}>
      <div className="bg-black/85 text-white rounded-lg overflow-hidden shadow-lg">
        <div className="bg-[#E04E27] px-4 py-2 flex items-center justify-between">
          <span className="font-black text-sm uppercase tracking-wide">{t.name}</span>
          <span className="text-[10px] opacity-80">{t.status}</span>
        </div>
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase text-white/50">
            <tr>
              <th className="px-3 py-1 text-left">#</th>
              <th className="px-3 py-1 text-left">Tim</th>
              <th className="px-3 py-1 text-right">Kill</th>
              <th className="px-3 py-1 text-right">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.team_id} className={i < 3 ? 'bg-white/10' : ''}>
                <td className="px-3 py-1 font-bold">{i + 1}</td>
                <td className="px-3 py-1 truncate max-w-[140px]">{teams[r.team_id] || '—'}</td>
                <td className="px-3 py-1 text-right">{r.kills}</td>
                <td className="px-3 py-1 text-right font-bold text-[#E04E27]">{r.points}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan="4" className="px-3 py-4 text-center text-white/40">Belum ada hasil</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
