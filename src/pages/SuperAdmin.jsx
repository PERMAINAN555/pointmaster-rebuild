import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Shield, Users, Tag, Loader2, Search, Crown, Ban, Check } from 'lucide-react'

export default function SuperAdmin() {
  const { session } = useAuth()
  const [tab, setTab] = useState('users')
  const [isAdmin, setIsAdmin] = useState(null)
  const [users, setUsers] = useState([])
  const [promos, setPromos] = useState([])
  const [stats, setStats] = useState(null)
  const [busy, setBusy] = useState(false)
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null)
  const [err, setErr] = useState('')

  async function api(action, body) {
    const token = session?.access_token
    if (!token) throw new Error('No session')
    const res = await fetch(`/api/admin/${action}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: body ? JSON.stringify(body) : undefined
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  }

  useEffect(() => {
    if (!session) return
    api('verify').then(d => {
      setIsAdmin(d.isAdmin === true)
      if (d.isAdmin) {
        loadUsers()
        loadPromos()
      }
    }).catch(e => { setErr(e.message); setIsAdmin(false) })
  }, [session])

  async function loadUsers() {
    setBusy(true)
    try {
      const d = await api('users')
      setUsers(d.users || [])
      setStats(d.stats || null)
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }

  async function loadPromos() {
    try {
      const d = await api('promos')
      setPromos(d.promos || [])
    } catch (e) { setErr(e.message) }
  }

  async function saveUser(userId, patch) {
    try {
      await api('update-user', { userId, ...patch })
      setEditing(null)
      loadUsers()
    } catch (e) { setErr(e.message) }
  }

  async function togglePromo(promoId, action, extra) {
    try {
      await api('update-promo', { promoId, action, ...extra })
      loadPromos()
    } catch (e) { setErr(e.message) }
  }

  if (isAdmin === null) return <div className="p-8 text-gray-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Cek akses…</div>
  if (!isAdmin) return <div className="p-8 text-red-600">Akses ditolak. Halaman ini hanya untuk super admin.</div>

  const filtered = q.trim()
    ? users.filter(u => (u.full_name || '').toLowerCase().includes(q.toLowerCase()) || u.id.includes(q))
    : users

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6 text-[#E04E27]" />
        <h2 className="text-2xl font-bold">Super Admin</h2>
      </div>

      {err && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded">{err}</div>}

      <div className="flex gap-1 border-b">
        <button onClick={() => setTab('users')}
          className={`px-4 py-2 text-sm font-semibold flex items-center gap-1 border-b-2 ${tab === 'users' ? 'border-[#E04E27] text-[#E04E27]' : 'border-transparent text-gray-500'}`}>
          <Users size={14} /> Users
        </button>
        <button onClick={() => setTab('promos')}
          className={`px-4 py-2 text-sm font-semibold flex items-center gap-1 border-b-2 ${tab === 'promos' ? 'border-[#E04E27] text-[#E04E27]' : 'border-transparent text-gray-500'}`}>
          <Tag size={14} /> Promos
        </button>
      </div>

      {stats && tab === 'users' && (
        <div className="grid grid-cols-4 gap-2">
          <Stat label="Total" value={stats.total ?? users.length} />
          <Stat label="Pro" value={stats.pro ?? '—'} />
          <Stat label="Hari ini" value={stats.today ?? '—'} />
          <Stat label="Scan" value={stats.scans ?? '—'} />
        </div>
      )}

      {tab === 'users' && (
        <>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={q} onChange={e => setQ(e.target.value)}
              placeholder="Cari nama atau ID…"
              className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm" />
          </div>
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="p-2 text-left">Nama</th>
                  <th className="p-2 text-right">Token</th>
                  <th className="p-2 text-center">Pro</th>
                  <th className="p-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.slice(0, 100).map(u => {
                  const isPro = u.has_unlocked_ai || (u.subscription_expires_at && new Date(u.subscription_expires_at) > new Date())
                  return (
                    <tr key={u.id}>
                      <td className="p-2">
                        <div className="font-medium truncate max-w-[180px]">{u.full_name || '—'}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{u.id.slice(0, 8)}</div>
                      </td>
                      <td className="p-2 text-right">{u.tokens || 0}</td>
                      <td className="p-2 text-center">
                        {isPro ? <Crown className="w-4 h-4 text-yellow-500 inline" /> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="p-2 text-right">
                        <button onClick={() => setEditing(u)} className="text-xs text-[#E04E27]">Edit</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'promos' && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="p-2 text-left">Kode</th>
                <th className="p-2 text-right">Days</th>
                <th className="p-2 text-center">Status</th>
                <th className="p-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {promos.map(p => (
                <tr key={p.id}>
                  <td className="p-2 font-mono text-xs">{p.code || p.id.slice(0, 8)}</td>
                  <td className="p-2 text-right">{p.duration_days || '—'}</td>
                  <td className="p-2 text-center text-xs">
                    <span className={p.promo_status === 'active' ? 'text-green-600' : 'text-gray-400'}>
                      {p.promo_status || 'inactive'}
                    </span>
                  </td>
                  <td className="p-2 text-right">
                    <button onClick={() => togglePromo(p.id, p.promo_status === 'active' ? 'deactivate' : 'activate')}
                      className="text-xs text-[#E04E27]">
                      {p.promo_status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </td>
                </tr>
              ))}
              {promos.length === 0 && (
                <tr><td colSpan="4" className="p-6 text-center text-gray-500">Belum ada promo.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <EditUserModal user={editing} onClose={() => setEditing(null)} onSave={saveUser} />
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-white border rounded-lg p-3 text-center">
      <div className="text-[10px] uppercase text-gray-500">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  )
}

function EditUserModal({ user, onClose, onSave }) {
  const [tokens, setTokens] = useState(user.tokens || 0)
  const [unlocked, setUnlocked] = useState(user.has_unlocked_ai || false)
  const [expires, setExpires] = useState(user.subscription_expires_at ? user.subscription_expires_at.slice(0, 10) : '')

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-3">
        <h3 className="font-bold">Edit {user.full_name || user.id.slice(0, 8)}</h3>
        <div>
          <label className="text-xs font-bold uppercase text-gray-500">Token</label>
          <input type="number" value={tokens} onChange={e => setTokens(parseInt(e.target.value) || 0)}
            className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={unlocked} onChange={e => setUnlocked(e.target.checked)} />
          Unlock AI (Pro)
        </label>
        <div>
          <label className="text-xs font-bold uppercase text-gray-500">Langganan Berakhir</label>
          <input type="date" value={expires} onChange={e => setExpires(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 border rounded text-sm">Batal</button>
          <button onClick={() => onSave(user.id, {
            tokens, has_unlocked_ai: unlocked,
            subscription_expires_at: expires ? new Date(expires).toISOString() : null
          })} className="px-5 py-2 bg-[#E04E27] text-white rounded text-sm font-semibold">Simpan</button>
        </div>
      </div>
    </div>
  )
}
