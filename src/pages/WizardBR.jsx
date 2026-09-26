import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { bestMatch } from '../lib/fuzzy.js'
import { Upload, Loader2, Check, AlertTriangle, Save, ArrowRight, ArrowLeft, Wand2, ListChecks } from 'lucide-react'

const STEPS = ['Setup', 'Upload', 'Review OCR', 'Papan Mentah']
const OCR_ENDPOINT = 'https://1c01-103-130-18-160.ngrok-free.app'

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result.split(',')[1])
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

export default function WizardBR() {
  const { id } = useParams()
  const nav = useNavigate()
  const { session, profile, refreshProfile } = useAuth()

  const [step, setStep] = useState(0)
  const [tournament, setTournament] = useState(null)
  const [teams, setTeams] = useState([])
  const [matchNum, setMatchNum] = useState(1)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const [tournamentName, setTournamentName] = useState('')
  const [perKill, setPerKill] = useState(1)
  const [placementPts, setPlacementPts] = useState([12,9,8,7,6,5,4,3,2,1,0,0])

  const [uploadMode, setUploadMode] = useState('manual')
  const [topFile, setTopFile] = useState(null)
  const [bottomFile, setBottomFile] = useState(null)
  const [topPreview, setTopPreview] = useState('')
  const [bottomPreview, setBottomPreview] = useState('')
  const [manualText, setManualText] = useState('')

  const [results, setResults] = useState([])

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('tournaments').select('*').eq('id', id).single(),
      supabase.from('teams').select('*').eq('tournament_id', id),
      supabase.from('matches').select('match_number').eq('tournament_id', id)
    ]).then(([tr, te, ma]) => {
      if (tr.data) {
        setTournament(tr.data)
        setTournamentName(tr.data.name || '')
        setPerKill(tr.data.point_per_kill || 1)
        if (Array.isArray(tr.data.point_rules?.placement_points)) setPlacementPts(tr.data.point_rules.placement_points)
        else if (Array.isArray(tr.data.placement_points)) setPlacementPts(tr.data.placement_points)
      }
      setTeams(te || [])
      const nums = (ma.data || []).map(x => x.match_number)
      setMatchNum(nums.length ? Math.max(...nums) + 1 : 1)
    })
  }, [id])

  function handleFile(which) {
    return async (e) => {
      const f = e.target.files?.[0]
      if (!f) return
      const b64 = await fileToBase64(f)
      const dataUrl = `data:${f.type};base64,${b64}`
      if (which === 'top') { setTopFile(b64); setTopPreview(dataUrl) }
      else { setBottomFile(b64); setBottomPreview(dataUrl) }
    }
  }

  async function runOCR() {
    setErr('')
    if (!topFile || !bottomFile) return setErr('Harap unggah Screenshot Atas dan Screenshot Bawah secara utuh.')
    if (!session?.access_token) return setErr('Sesi Berakhir. Silakan login kembali.')
    setBusy(true)
    try {
      const r = await fetch(`${OCR_ENDPOINT}/api/ocr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ crops: [{ image: topFile, region: 'top' }, { image: bottomFile, region: 'bottom' }] })
      })
      if (!r.ok) {
        if ([502, 503, 404].includes(r.status)) throw new Error('Server VIP sedang Offline / Maintenance.')
        const j = await r.json().catch(() => ({}))
        throw new Error(j.error?.message || j.error || 'Server OCR sedang maintenance.')
      }
      const data = await r.json()
      const detected = Array.isArray(data) ? data : (data.results || data.teams || [])
      const mapped = detected.map((d, idx) => {
        const name = d.detectedName || d.team_name || d.name || ''
        const match = bestMatch(name, teams)
        let conf = d.confidence ?? 0.8
        if (!name || name.trim() === '') conf = 0
        return {
          rank: d.rank || idx + 1,
          team_name_ocr: name,
          mapped_team_id: match?.team?.id || '',
          kill_count: d.kills_detail ? d.kills_detail.reduce((s, x) => s + (Number(x) || 0), 0) : (d.total_kills || d.kills || 0),
          kills_confidence: conf,
          player_count: d.player_count || 0,
          ambiguous: match?.ambiguous || false
        }
      })
      setResults(mapped)
      setStep(2)
      const today = new Date().toISOString().slice(0, 10)
      const unlocked = profile?.has_unlocked_ai || (profile?.subscription_expires_at && new Date(profile.subscription_expires_at) > new Date())
      if (!unlocked) {
        await supabase.from('profiles').update({
          daily_scan_count: (profile?.daily_scan_count || 0) + 1,
          last_scan_date: today
        }).eq('id', session.user.id)
        refreshProfile()
      }
    } catch (e) {
      let msg = e.message || 'Server OCR sedang maintenance.'
      if (msg.includes('Failed to fetch') || msg.includes('Network')) msg = 'Server VIP sedang Offline / Maintenance.'
      setErr(msg)
    } finally { setBusy(false) }
  }

  function parseManual() {
    setErr('')
    const lines = manualText.split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length) return setErr('Isi minimal 1 baris.')
    const parsed = lines.map((line, idx) => {
      let rank = idx + 1, team = line, kills = 0
      const rankMatch = line.match(/^(\d+)[\.\)\-]\s*(.+)$/)
      if (rankMatch) { rank = parseInt(rankMatch[1]); team = rankMatch[2] }
      const killMatch = team.match(/^(.*?)[,\-]\s*(\d+)\s*$/)
      if (killMatch) { team = killMatch[1].trim(); kills = parseInt(killMatch[2]) }
      const match = bestMatch(team, teams)
      return {
        rank,
        team_name_ocr: team,
        mapped_team_id: match?.team?.id || '',
        kill_count: kills,
        kills_confidence: 1,
        player_count: 0,
        ambiguous: match?.ambiguous || false
      }
    })
    setResults(parsed)
    setStep(2)
  }

  function updateRow(i, patch) {
    setResults(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r))
  }

  function computePoints(kill, rank) {
    const pp = placementPts[Math.max(0, (Number(rank) || 1) - 1)] || 0
    return (Number(kill) || 0) * perKill + pp
  }

  async function saveToDB() {
    if (!session) return setErr('Sesi Berakhir.')
    setErr('')
    setBusy(true)
    try {
      const { data: matchRow, error: me } = await supabase.from('matches').insert([{
        tournament_id: id, match_number: matchNum
      }]).select().single()
      if (me) throw me
      const rows = results
        .filter(r => r.mapped_team_id && r.team_name_ocr)
        .map(r => ({
          match_id: matchRow.id,
          team_id: r.mapped_team_id,
          kill_count: Number(r.kill_count) || 0,
          placement_rank: Number(r.rank) || null,
          total_match_point: computePoints(r.kill_count, r.rank)
        }))
      if (rows.length) {
        const { error: re } = await supabase.from('match_results').insert(rows)
        if (re) throw re
      }
      setStep(3)
    } catch (e) {
      setErr(e.message || 'Gagal menyimpan.')
    } finally { setBusy(false) }
  }

  if (!tournament) return <div className="p-8 text-gray-500">Memuat…</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Wand2 className="w-6 h-6 text-[#E04E27]" /> Wizard BR
        </h2>
        <div className="text-sm text-gray-500 mt-1">{tournament.name} · Match #{matchNum}</div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center whitespace-nowrap">
            <div className={`px-3 py-1.5 rounded text-xs font-semibold ${
              i === step ? 'bg-[#E04E27] text-white' :
              i < step ? 'bg-[#E04E27]/10 text-[#E04E27]' :
              'bg-gray-100 text-gray-500'
            }`}>{i + 1}. {s}</div>
            {i < STEPS.length - 1 && <div className="w-3 h-px bg-gray-300" />}
          </div>
        ))}
      </div>

      {err && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <div className="text-sm text-red-700">{err}</div>
        </div>
      )}

      {step === 0 && (
        <div className="bg-white border rounded-lg p-5 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Nama Turnamen</label>
            <input value={tournamentName} onChange={e => setTournamentName(e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">Poin per Kill</label>
              <input type="number" min="0" value={perKill}
                onChange={e => setPerKill(parseInt(e.target.value) || 0)}
                className="mt-1 w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">Match #</label>
              <input type="number" min="1" value={matchNum}
                onChange={e => setMatchNum(parseInt(e.target.value) || 1)}
                className="mt-1 w-full border rounded px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Poin Placement</label>
            <div className="grid grid-cols-6 gap-2">
              {placementPts.map((p, i) => (
                <div key={i} className="text-center">
                  <div className="text-[10px] text-gray-500 mb-1">#{i + 1}</div>
                  <input type="number" min="0" value={p}
                    onChange={e => setPlacementPts(prev => prev.map((x, idx) => idx === i ? parseInt(e.target.value) || 0 : x))}
                    className="w-full border rounded px-1 py-1 text-sm text-center" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={() => setStep(1)}
              className="px-5 py-2 bg-[#E04E27] text-white rounded flex items-center gap-2">
              Lanjut <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="bg-white border rounded-lg p-5 space-y-4">
          <div className="flex border-b -mx-5 px-5 gap-1">
            <button onClick={() => setUploadMode('manual')}
              className={`px-3 py-2 text-sm font-semibold border-b-2 ${uploadMode === 'manual' ? 'border-[#E04E27] text-[#E04E27]' : 'border-transparent text-gray-500'}`}>
              Input Manual
            </button>
            <button onClick={() => setUploadMode('ocr')}
              className={`px-3 py-2 text-sm font-semibold border-b-2 ${uploadMode === 'ocr' ? 'border-[#E04E27] text-[#E04E27]' : 'border-transparent text-gray-500'}`}>
              Upload Screenshot (OCR)
            </button>
          </div>

          {uploadMode === 'manual' ? (
            <>
              <div className="text-sm text-gray-500">
                Format per baris: <code className="bg-gray-100 px-1 rounded">Rank. Nama Tim, Kill</code>
                <br />Contoh: <code className="bg-gray-100 px-1 rounded">1. EVOS, 12</code>
              </div>
              <textarea
                value={manualText}
                onChange={e => setManualText(e.target.value)}
                rows={12}
                placeholder={"1. EVOS, 12\n2. RRQ, 9\n3. Bigetron, 7\n4. Aerowolf, 5"}
                className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
              />
              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(0)} className="px-4 py-2 border rounded flex items-center gap-2 text-sm">
                  <ArrowLeft className="w-4 h-4" /> Kembali
                </button>
                <button onClick={parseManual}
                  className="px-5 py-2 bg-[#E04E27] text-white rounded flex items-center gap-2">
                  Lanjut Review <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <UploadBox label="Screenshot Atas" preview={topPreview} onFile={handleFile('top')} />
                <UploadBox label="Screenshot Bawah" preview={bottomPreview} onFile={handleFile('bottom')} />
              </div>
              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(0)} className="px-4 py-2 border rounded flex items-center gap-2 text-sm">
                  <ArrowLeft className="w-4 h-4" /> Kembali
                </button>
                <button onClick={runOCR} disabled={busy}
                  className="px-5 py-2 bg-[#E04E27] text-white rounded flex items-center gap-2 disabled:opacity-50">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListChecks className="w-4 h-4" />}
                  {busy ? 'Memproses…' : 'Proses OCR'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="bg-white border rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Review — {results.length} baris</h3>
            <div className="text-xs text-gray-500">{results.filter(r => !r.mapped_team_id).length} belum di-mapping</div>
          </div>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="p-2 text-right w-14">Rank</th>
                  <th className="p-2 text-left">OCR Text</th>
                  <th className="p-2 text-left">Mapping</th>
                  <th className="p-2 text-right w-20">Kill</th>
                  <th className="p-2 text-right w-20">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {results.map((r, i) => (
                  <tr key={i} className={!r.mapped_team_id ? 'bg-red-50' : r.ambiguous ? 'bg-yellow-50' : ''}>
                    <td className="p-1">
                      <input type="number" value={r.rank}
                        onChange={e => updateRow(i, { rank: parseInt(e.target.value) || 0 })}
                        className="w-full border rounded px-2 py-1 text-right text-xs" />
                    </td>
                    <td className="p-1">
                      <input value={r.team_name_ocr}
                        onChange={e => updateRow(i, { team_name_ocr: e.target.value })}
                        className="w-full border rounded px-2 py-1 text-xs font-mono" />
                    </td>
                    <td className="p-1">
                      <select value={r.mapped_team_id}
                        onChange={e => updateRow(i, { mapped_team_id: e.target.value })}
                        className={`w-full border rounded px-2 py-1 text-xs ${!r.mapped_team_id ? 'border-red-400 text-red-700' : ''}`}>
                        <option value="">— pilih tim —</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}
                      </select>
                    </td>
                    <td className="p-1">
                      <input type="number" value={r.kill_count}
                        onChange={e => updateRow(i, { kill_count: parseInt(e.target.value) || 0 })}
                        className="w-full border rounded px-2 py-1 text-right text-xs" />
                    </td>
                    <td className="p-2 text-right font-bold text-xs">{computePoints(r.kill_count, r.rank)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(1)}
              className="px-4 py-2 border rounded flex items-center gap-2 text-sm">
              <ArrowLeft className="w-4 h-4" /> Kembali
            </button>
            <button onClick={saveToDB} disabled={busy}
              className="px-5 py-2 bg-[#E04E27] text-white rounded flex items-center gap-2 disabled:opacity-50">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {busy ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white border rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 text-green-600">
            <Check className="w-5 h-5" />
            <span className="font-bold">Tersimpan. Match #{matchNum}</span>
          </div>
          <div className="grid gap-2">
            {results.slice().sort((a, b) => a.rank - b.rank).map((r, i) => {
              const team = teams.find(t => t.id === r.mapped_team_id)
              return (
                <div key={i} className="flex items-center gap-3 p-2 border rounded text-sm">
                  <span className="font-bold w-6 text-right text-gray-400">#{r.rank}</span>
                  <span className="flex-1">{team?.team_name || r.team_name_ocr}</span>
                  <span className="text-gray-500">{r.kill_count} kill</span>
                  <span className="font-bold">{computePoints(r.kill_count, r.rank)} pts</span>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between pt-2">
            <button onClick={() => nav(`/tournament/${id}`)} className="px-4 py-2 border rounded text-sm">Ke Turnamen</button>
            <button onClick={() => nav(`/leaderboard/${id}`)}
              className="px-5 py-2 bg-[#E04E27] text-white rounded text-sm flex items-center gap-2">
              Leaderboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function UploadBox({ label, preview, onFile }) {
  return (
    <label className="border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-[#E04E27] transition-colors block">
      <div className="text-xs font-bold uppercase text-gray-500 mb-2">{label}</div>
      {preview ? (
        <img src={preview} alt={label} className="w-full h-40 object-contain bg-gray-50 rounded" />
      ) : (
        <div className="h-40 flex flex-col items-center justify-center text-gray-400">
          <Upload className="w-8 h-8 mb-2" />
          <span className="text-xs">Tap untuk pilih gambar</span>
        </div>
      )}
      <input type="file" accept="image/*" className="hidden" onChange={onFile} />
    </label>
  )
}
