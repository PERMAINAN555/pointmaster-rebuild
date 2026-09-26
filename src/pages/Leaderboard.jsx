import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

export default function Leaderboard() {
  const { id } = useParams()
  const [rows, setRows] = useState([])
  const [teams, setTeams] = useState({})
  const [err, setErr] = useState(null)

  useEffect(() => {
    Promise.all([
      supabase.from('teams').select('id, team_name').eq('tournament_id', id),
      supabase.from('match_results')
        .select('team_id, match_id, kill_count, placement_rank, total_match_point, matches!inner(tournament_id)')
        .eq('matches.tournament_id', id)
    ]).then(([tr, rr]) => {
      if (tr.error) return setErr(tr.error.message)
      if (rr.error) return setErr(rr.error.message)
      const tmap = Object.fromEntries((tr.data || []).map(t => [t.id, t.team_name]))
      setTeams(tmap)
      const agg = {}
      for (const r of rr.data || []) {
        if (!agg[r.team_id]) agg[r.team_id] = { team_id: r.team_id, kills: 0, points: 0, matches: 0, best: null }
        agg[r.team_id].kills += r.kill_count || 0
        agg[r.team_id].points += r.total_match_point || 0
        agg[r.team_id].matches += 1
        const rank = r.placement_rank
        if (rank && (!agg[r.team_id].best || rank < agg[r.team_id].best)) agg[r.team_id].best = rank
      }
      const sorted = Object.values(agg).sort((a, b) => b.points - a.points || b.kills - a.kills)
      setRows(sorted)
    })
  }, [id])

  if (err) return <div className="text-red-600 p-4">{err}</div>

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Leaderboard</h2>
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Tim</th>
              <th className="p-3 text-right">Match</th>
              <th className="p-3 text-right">Kill</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r, i) => (
              <tr key={r.team_id} className={i < 3 ? 'bg-brand/5' : ''}>
                <td className="p-3 font-bold">{i + 1}</td>
                <td className="p-3">{teams[r.team_id] || r.team_id.slice(0, 8)}</td>
                <td className="p-3 text-right">{r.matches}</td>
                <td className="p-3 text-right">{r.kills}</td>
                <td className="p-3 text-right font-bold">{r.points}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan="5" className="p-6 text-center text-gray-500">Belum ada hasil.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
