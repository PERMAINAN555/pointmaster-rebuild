import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

export default function MatchEdit() {
  const { id, matchId } = useParams()
  const [teams, setTeams] = useState([])
  const [results, setResults] = useState({})
  const [placement, setPlacement] = useState({})
  const [rules, setRules] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    Promise.all([
      supabase.from('teams').select('id, team_name').eq('tournament_id', id),
      supabase.from('match_results').select('*').eq('match_id', matchId),
      supabase.from('tournaments').select('point_per_kill, placement_points, point_rules').eq('id', id).single()
    ]).then(([tr, rr, tn]) => {
      setTeams(tr.data || [])
      setRules(tn.data || null)
      const m = {}; const p = {}
      for (const r of rr.data || []) { m[r.team_id] = r.kill_count || 0; p[r.team_id] = r.placement_rank || '' }
      setResults(m); setPlacement(p)
    })
  }, [id, matchId])

  function calc(teamId) {
    const kills = Number(results[teamId]) || 0
    const rank = Number(placement[teamId]) || 0
    const ppk = rules?.point_per_kill || 1
    const pp = rules?.placement_points
    let placePts = 0
    if (Array.isArray(pp)) placePts = pp[rank - 1] || 0
    else if (pp && typeof pp === 'object') placePts = pp[String(rank)] || 0
    return kills * ppk + placePts
  }

  async function save() {
    setBusy(true); setMsg('')
    const rows = teams
      .filter(t => results[t.id] !== undefined || placement[t.id])
      .map(t => ({
        match_id: matchId,
        team_id: t.id,
        kill_count: Number(results[t.id]) || 0,
        placement_rank: Number(placement[t.id]) || null,
        total_match_point: calc(t.id)
      }))
    // hapus lama, insert baru
    await supabase.from('match_results').delete().eq('match_id', matchId)
    const { error } = await supabase.from('match_results').insert(rows)
    setBusy(false)
    setMsg(error ? error.message : 'Tersimpan.')
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Edit Match</h2>
      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="p-3 text-left">Tim</th>
              <th className="p-3 text-right w-24">Placement</th>
              <th className="p-3 text-right w-24">Kills</th>
              <th className="p-3 text-right w-20">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {teams.map(t => (
              <tr key={t.id}>
                <td className="p-3">{t.team_name}</td>
                <td className="p-2">
                  <input type="number" min="1" value={placement[t.id] || ''}
                    onChange={e => setPlacement({ ...placement, [t.id]: e.target.value })}
                    className="w-full border rounded px-2 py-1 text-right" />
                </td>
                <td className="p-2">
                  <input type="number" min="0" value={results[t.id] || ''}
                    onChange={e => setResults({ ...results, [t.id]: e.target.value })}
                    className="w-full border rounded px-2 py-1 text-right" />
                </td>
                <td className="p-3 text-right font-bold">{calc(t.id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={busy}
          className="px-5 py-2 bg-brand text-white rounded font-medium disabled:opacity-50">
          {busy ? 'Menyimpan…' : 'Simpan'}
        </button>
        {msg && <span className="text-sm text-gray-600">{msg}</span>}
      </div>
    </div>
  )
}
