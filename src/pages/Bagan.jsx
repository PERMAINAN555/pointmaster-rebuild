import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { GitBranch, Trophy } from 'lucide-react'

export default function Bagan() {
  const { id } = useParams()
  const [t, setT] = useState(null)
  const [teams, setTeams] = useState({})
  const [matches, setMatches] = useState([])
  const [results, setResults] = useState([])
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('tournaments').select('*').eq('id', id).single(),
      supabase.from('teams').select('id, team_name').eq('tournament_id', id),
      supabase.from('matches').select('id, match_number').eq('tournament_id', id).order('match_number', { ascending: true }),
      supabase.from('match_results').select('*, matches!inner(tournament_id)').eq('matches.tournament_id', id)
    ]).then(([tr, te, ma, re]) => {
      if (tr.error) return setErr(tr.error.message)
      setT(tr.data)
      setTeams(Object.fromEntries((te.data || []).map(x => [x.id, x.team_name])))
      setMatches(ma.data || [])
      setResults(re.data || [])
    })
  }, [id])

  if (err) return <div className="text-red-600 p-4">{err}</div>
  if (!t) return <div className="text-gray-500 p-4">Memuat…</div>

  // kelompokkan results per match
  const byMatch = {}
  for (const r of results) {
    if (!byMatch[r.match_id]) byMatch[r.match_id] = []
    byMatch[r.match_id].push(r)
  }

  const isBracket = t.format === 'BRACKET'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <GitBranch className="w-6 h-6 text-[#E04E27]" /> Bagan
        </h2>
        <div className="text-sm text-gray-500">{t.name} · {matches.length} match</div>
      </div>

      {matches.length === 0 && (
        <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
          Belum ada match. Tambah match dari halaman turnamen.
        </div>
      )}

      {!isBracket && matches.map(m => {
        const rows = (byMatch[m.id] || []).slice().sort((a, b) => a.placement_rank - b.placement_rank)
        return (
          <div key={m.id} className="bg-white border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
              <span className="font-bold text-sm">Match #{m.match_number}</span>
              <span className="text-xs text-gray-500">{rows.length} tim</span>
            </div>
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-gray-500">
                <tr>
                  <th className="p-2 text-right w-14">Rank</th>
                  <th className="p-2 text-left">Tim</th>
                  <th className="p-2 text-right">Kill</th>
                  <th className="p-2 text-right">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map(r => (
                  <tr key={r.id} className={r.placement_rank <= 3 ? 'bg-yellow-50' : ''}>
                    <td className="p-2 text-right font-bold">#{r.placement_rank}</td>
                    <td className="p-2">{teams[r.team_id] || '—'}</td>
                    <td className="p-2 text-right">{r.kill_count}</td>
                    <td className="p-2 text-right font-bold">{r.total_match_point}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}

      {isBracket && (
        <BracketView matches={matches} byMatch={byMatch} teams={teams} />
      )}

      <div className="text-center">
        <Link to={`/leaderboard/${id}`}
          className="inline-flex items-center gap-2 px-5 py-2 bg-[#E04E27] text-white rounded-lg text-sm font-semibold">
          <Trophy size={16} /> Lihat Leaderboard
        </Link>
      </div>
    </div>
  )
}

function BracketView({ matches, byMatch, teams }) {
  // sederhana: 1 kolom per match, winner di puncak
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max">
        {matches.map(m => {
          const rows = (byMatch[m.id] || []).slice().sort((a, b) => a.placement_rank - b.placement_rank)
          return (
            <div key={m.id} className="w-64">
              <div className="text-xs font-bold uppercase text-gray-500 mb-2">Match #{m.match_number}</div>
              <div className="space-y-2">
                {rows.map(r => (
                  <div key={r.id} className={`p-2 border rounded text-sm ${r.placement_rank === 1 ? 'bg-yellow-100 border-yellow-400 font-bold' : 'bg-white'}`}>
                    <div className="flex items-center justify-between">
                      <span className="truncate">{teams[r.team_id] || '—'}</span>
                      <span className="text-xs text-gray-500 ml-2">{r.total_match_point}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
