import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const nav = useNavigate()
  const loc = useLocation()
  const { signIn, signUp } = useAuth()

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setMsg('')
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password)
        if (error) throw error
        nav(loc.state?.from || '/dashboard', { replace: true })
      } else {
        const { error } = await signUp(email, password, fullName)
        if (error) throw error
        setMsg('Cek email buat konfirmasi, lalu login.')
        setMode('signin')
      }
    } catch (err) {
      setMsg(err.message || 'Gagal.')
    } finally { setBusy(false) }
  }

  return (
    <div className="max-w-sm mx-auto mt-16 bg-white border rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-1">
        {mode === 'signin' ? 'Masuk' : 'Daftar'}
      </h2>
      <p className="text-sm text-gray-500 mb-6">PointMaster</p>

      <form onSubmit={submit} className="space-y-3">
        {mode === 'signup' && (
          <input
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Nama lengkap"
            required
            className="w-full border rounded px-3 py-2"
          />
        )}
        <input
          type="email" value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email" required
          className="w-full border rounded px-3 py-2"
        />
        <input
          type="password" value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password" required minLength={6}
          className="w-full border rounded px-3 py-2"
        />
        <button disabled={busy}
          className="w-full py-2 bg-brand text-white rounded font-medium disabled:opacity-50">
          {busy ? '…' : mode === 'signin' ? 'Masuk' : 'Daftar'}
        </button>
      </form>

      {msg && <div className="mt-3 text-sm text-red-600">{msg}</div>}

      <button
        onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMsg('') }}
        className="mt-4 text-sm text-gray-500 hover:text-brand"
      >
        {mode === 'signin' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
      </button>
    </div>
  )
}
