import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Plus, Trash2, Eye, EyeOff, Loader2, X } from 'lucide-react'

const DEFAULT_PLACEMENT = [12,9,8,7,6,5,4,3,2,1,0,0]

export default function Dashboard() {
  const { session, profile } = useAuth()
  const nav = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    if (!session) return
    setLoading(true)
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('admin_id', session.user.id)
      .order('created_at', { ascending: false })
    if (!error) setRows(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [session])

  async function del(id) {
    if (!confirm('Hapus turnamen ini? Data tim & match terkait juga akan hilang.')) return
    await supabase.from('match_results').delete().eq('match_id', id) // best effort
    await supabase.from('teams').delete().eq('tournament_id', id)
    await supabase.from('matches').delete().eq('tournament_id', id)
    await supabase.from('tournaments').delete().eq('id', id)
    load()
  }

  async function togglePublic(t) {
    await supabase.from('tournaments').update({ is_public: !t.is_public }).eq('id', t.id)
    load()
  }

  const isPro = profile?.has_unlocked_ai || (profile?.subscription_expires_at && new Date(profile.subscription_expires_at) > new Date())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">
            {isPro ? 'Akun Pro aktif' : 'Akun Free — upgrade untuk OCR tanpa limit'}
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-[#E04E27] text-white rounded-lg text-sm font-semibold flex items-center gap-2">
          <Plus size={16} /> Turnamen Baru
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Memuat…</div>
      ) : rows.length === 0 ? (
        <div className="bg-white border rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">Belum ada turnamen.</p>
          <button onClick={() => setShowForm(true)}
            className="px-5 py-2 bg-[#E04E27] text-white rounded-lg text-sm font-semibold">
            Buat yang pertama
          </button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map(t => (
            <div key={t.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{t.name}</div>
                  <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                    <span>{t.format}</span>
                    <span>· {t.status}</span>
                    {t.is_public && <span className="text-green-600">· Publik</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => togglePublic(t)} title="Toggle publik"
                    className="p-1.5 text-gray-400 hover:text-gray-700">
                    {t.is_public ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => del(t.id)} title="Hapus"
                    className="p-1.5 text-gray-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Link to={`/tournament/${t.id}`}
                  className="flex-1 text-center py-1.5 bg-[#E04E27] text-white rounded text-xs font-semibold">
                  Buka
                </Link>
                <Link to={`/wizard/${t.id}`}
                  className="flex-1 text-center py-1.5 border rounded text-xs font-semibold">
                  Wizard OCR
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <CreateForm onClose={() => setShowForm(false)} onCreated={(id) => { setShowForm(false); load(); nav(`/tournament/${id}`) }} />
      )}
    </div>
  )
}

function CreateForm({ onClose, onCreated }) {
  const { session } = useAuth()
  const [name, setName] = useState('')
  const [format, setFormat] = useState('BR')
  const [type, setType] = useState('Online')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [maxSlots, setMaxSlots] = useState('')
  const [perKill, setPerKill] = useState(1)
  const [placement, setPlacement] = useState(DEFAULT_PLACEMENT)
  const [isPublic, setIsPublic] = useState(true)
  const [isChampionRush, setIsChampionRush] = useState(false)
  const [rushThreshold, setRushThreshold] = useState(50)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit() {
    if (!name.trim()) return setErr('Nama wajib diisi.')
    if (!session) return setErr('Sesi berakhir.')
    setBusy(true); setErr('')
    const { data, error } = await supabase.from('tournaments').insert([{
      name: name.trim(),
      admin_id: session.user.id,
      format,
      type,
      location: location || '-',
      start_date: startDate || null,
      max_slots: maxSlots ? parseInt(maxSlots) : null,
      point_per_kill: perKill,
      placement_points: Object.fromEntries(placement.map((p, i) => [String(i + 1), p])),
      point_rules: { point_per_kill: perKill, placement_points: placement },
      status: 'draft',
      is_public: isPublic,
      is_champion_rush: isChampionRush,
      rush_threshold: rushThreshold
    }]).select().single()
    setBusy(false)
    if (error) return setErr(error.message)
    onCreated(data.id)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
        <div className="sticky top-0 bg-white border-b px-5 py-3 flex items-center justify-between">
          <h3 className="font-bold text-lg">Turnamen Baru</h3>
          <button onClick={onClose} className="p-1 text-gray-500"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Nama Turnamen *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Turnamen Warga RW 11"
              className="mt-1 w-full border rounded-lg px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">Format</label>
              <select value={format} onChange={e => setFormat(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2">
                <option value="BR">Battle Royale</option>
                <option value="TDM">Team Deathmatch</option>
                <option value="BRACKET">Bracket</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">Tipe</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2">
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">Lokasi</label>
              <input value={location} onChange={e => setLocation(e.target.value)}
                placeholder="Opsional"
                className="mt-1 w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">Tanggal Mulai</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">Max Slot</label>
              <input type="number" value={maxSlots} onChange={e => setMaxSlots(e.target.value)}
                placeholder="25"
                className="mt-1 w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">Poin per Kill</label>
              <input type="number" value={perKill} onChange={e => setPerKill(parseInt(e.target.value) || 0)}
                className="mt-1 w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Poin Placement</label>
            <div className="grid grid-cols-6 gap-1">
              {placement.map((p, i) => (
                <div key={i} className="text-center">
                  <div className="text-[10px] text-gray-500 mb-0.5">#{i + 1}</div>
                  <input type="number" value={p}
                    onChange={e => setPlacement(prev => prev.map((x, idx) => idx === i ? parseInt(e.target.value) || 0 : x))}
                    className="w-full border rounded px-1 py-1 text-sm text-center" />
                </div>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
            <span className="text-sm">Tampil di halaman publik</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isChampionRush} onChange={e => setIsChampionRush(e.target.checked)} />
            <span className="text-sm">Champion Rush mode</span>
          </label>
          {isChampionRush && (
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">Rush Threshold (poin)</label>
              <input type="number" value={rushThreshold} onChange={e => setRushThreshold(parseInt(e.target.value) || 0)}
                className="mt-1 w-full border rounded-lg px-3 py-2" />
            </div>
          )}
          {err && <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{err}</div>}
        </div>
        <div className="sticky bottom-0 bg-white border-t px-5 py-3 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Batal</button>
          <button onClick={submit} disabled={busy}
            className="px-5 py-2 bg-[#E04E27] text-white rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            {busy && <Loader2 size={14} className="animate-spin" />}
            {busy ? 'Membuat…' : 'Buat Turnamen'}
          </button>
        </div>
      </div>
    </div>
  )
}
