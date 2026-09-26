import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Trophy, Users, Wand2, BarChart3, Trash2 } from 'lucide-react'

export default function TurnamenDetail() {
  const { id } = useParams()
  const { session } = useAuth()
  const [t, setT] = useState(null)
  const [teams, setTeams] = useState([])
  const [matches, setMatches] = useState([])
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    const [{ data: t_, error: e1 }, { data: te, error: e2 }, { data: m, error: e3 }] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', id).single(),
      supabase.from('teams').select('*').eq('tournament_id', id).order('created_at', { ascending: true }),
      supabase.from('matches').select('id, match_number').eq('tournament_id', id).order('match_number', { ascending: true })
    ])
    if (e1) return setErr(e1.message)
    setT(t_); setTeams(te || []); setMatches(m || [])
    if (e2) setErr(e2.message)
    if (e3) setErr(e3.message)
  }

  useEffect(() => { load() }, [id])

  const isAdmin = session && t && t.admin_id === session.user.id

  async function startMatch() {
    if (!isAdmin) return
    setBusy(true)
    const nextNum = matches.length ? Math.max(...matches.map(m => m.match_number)) + 1 : 1
    const { error } = await supabase.from('matches').insert([{
      tournament_id: id, match_number: nextNum
    }])
    setBusy(false)
    if (error) return setErr(error.message)
    load()
  }

  async function removeMatch(mid) {
    if (!confirm('Hapus match ini? Hasil terkait juga hilang.')) return
    await supabase.from('match_results').delete().eq('match_id', mid)
    await supabase.from('matches').delete().eq('id', mid)
    load()
  }

  if (err) return <div className="text-red-600 p-4">{err}</div>
  if (!t) return <div className="text-gray-500 p-4">Memuat…</div>

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold">{t.name}</h2>
            <div className="text-sm text-gray-500 mt-1">
              {t.format} · {t.type || '-'} · {t.status}
              {t.is_champion_rush && ' · Champion Rush'}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to={`/leaderboard/${id}`} className="px-3 py-1.5 border rounded text-sm flex items-center gap-1">
              <BarChart3 size={14} /> Leaderboard
            </Link>
            <Link to={`/bagan/${id}`} className="px-3 py-1.5 border rounded text-sm flex items-center gap-1">
              <Trophy size={14} /> Bagan
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Stat label="Tim" value={teams.length} />
        <Stat label="Match" value={matches.length} />
        <Stat label="Slot" value={t.max_slots || '—'} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold flex items-center gap-2"><Users size={18} /> Tim ({teams.length})</h3>
          {isAdmin && (
            <Link to={`/wizard/${id}`}
              className="px-3 py-1.5 bg-brand text-white rounded text-sm flex items-center gap-1">
              <Wand2 size={14} /> Wizard BR
            </Link>
          )}
        </div>
        {teams.length === 0 ? (
          <div className="text-gray-500 text-sm bg-white border rounded-lg p-4">
            Belum ada tim. {isAdmin && <Link to={`/wizard/${id}`} className="text-brand">Import via Wizard →</Link>}
          </div>
        ) : (
          <div className="bg-white border rounded-lg divide-y">
            {teams.map((te, i) => (
              <div key={te.id} className="p-3 flex items-center gap-3 text-sm">
                <span className="text-gray-400 w-6 text-right">{i + 1}.</span>
                <span className="flex-1">{te.team_name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">Match ({matches.length})</h3>
          {isAdmin && (
            <button onClick={startMatch} disabled={busy}
              className="px-3 py-1.5 bg-brand text-white rounded text-sm disabled:opacity-50">
              + Match
            </button>
          )}
        </div>
        {matches.length === 0 ? (
          <div className="text-gray-500 text-sm bg-white border rounded-lg p-4">Belum ada match.</div>
        ) : (
          <div className="bg-white border rounded-lg divide-y">
            {matches.map(m => (
              <div key={m.id} className="p-3 flex items-center justify-between text-sm">
                <span>Match #{m.match_number}</span>
                <div className="flex gap-2">
                  <Link to={`/tournament/${id}/edit-match/${m.id}`} className="text-brand">Edit</Link>
                  {isAdmin && (
                    <button onClick={() => removeMatch(m.id)} className="text-red-600">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="text-xs text-gray-500 uppercase">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  )
}
