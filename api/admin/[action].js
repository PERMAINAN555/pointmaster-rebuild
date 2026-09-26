// Vercel serverless — /api/admin/[action]
// *verifies Supabase JWT, checks admin (has at least one tournament), then proxies operation*

const SUPA_URL = 'https://psnxhhqenhtdmmmlcqvj.supabase.co'
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzbnhoaHFlbmh0ZG1tbWxjcXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4NjIyMDIsImV4cCI6MjEwMjQzODIwMn0.erqOFxV4ITixqnuCO_LX06Oa0S3IX9VUsREQgA7KP4c'

async function sb(path, options = {}) {
  return fetch(`${SUPA_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPA_KEY,
      Authorization: options.token ? `Bearer ${options.token}` : `Bearer ${SUPA_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })
}

async function getUser(token) {
  const r = await fetch(`${SUPA_URL}/auth/v1/user`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${token}` }
  })
  if (!r.ok) return null
  return r.json()
}

async function isAdmin(userId) {
  const r = await sb(`tournaments?select=id&admin_id=eq.${userId}&limit=1`)
  const data = await r.json()
  return Array.isArray(data) && data.length > 0
}

export default async function handler(req, res) {
  const action = req.query.action
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'No token' })

  const user = await getUser(token)
  if (!user) return res.status(401).json({ error: 'Invalid token' })

  const admin = await isAdmin(user.id)
  if (!admin) return res.status(403).json({ error: 'Not admin' })

  try {
    if (action === 'verify' && req.method === 'GET') {
      return res.json({ isAdmin: true, userId: user.id })
    }

    if (action === 'users' && req.method === 'GET') {
      const r = await sb('profiles?select=*&order=created_at.desc&limit=500')
      const users = await r.json()
      const today = new Date().toISOString().slice(0, 10)
      const now = new Date()
      const stats = {
        total: Array.isArray(users) ? users.length : 0,
        pro: (users || []).filter(u => u.has_unlocked_ai || (u.subscription_expires_at && new Date(u.subscription_expires_at) > now)).length,
        today: (users || []).filter(u => (u.created_at || '').startsWith(today)).length,
        scans: (users || []).reduce((s, u) => s + (u.daily_scan_count || 0), 0)
      }
      return res.json({ users, stats })
    }

    if (action === 'promos' && req.method === 'GET') {
      const r = await sb('tournament_promos?select=*&order=created_at.desc&limit=200')
      return res.json({ promos: await r.json() })
    }

    if (action === 'update-user' && req.method === 'POST') {
      const { userId, ...patch } = req.body || {}
      if (!userId) return res.status(400).json({ error: 'userId required' })
      const r = await sb(`profiles?id=eq.${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
        headers: { Prefer: 'return=minimal' }
      })
      if (!r.ok) throw new Error(`PATCH failed: ${r.status}`)
      return res.json({ ok: true, message: 'Data user tersimpan' })
    }

    if (action === 'update-promo' && req.method === 'POST') {
      const { promoId, action: promoAction, durationDays, additionalDays } = req.body || {}
      if (!promoId) return res.status(400).json({ error: 'promoId required' })
      const patch = {}
      if (promoAction === 'activate') patch.promo_status = 'active'
      if (promoAction === 'deactivate') patch.promo_status = 'inactive'
      if (durationDays) patch.duration_days = durationDays
      if (additionalDays && patch.promo_status === 'active') {
        patch.expires_at = new Date(Date.now() + additionalDays * 86400000).toISOString()
      }
      const r = await sb(`tournament_promos?id=eq.${promoId}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
        headers: { Prefer: 'return=minimal' }
      })
      if (!r.ok) throw new Error(`PATCH failed: ${r.status}`)
      return res.json({ ok: true, message: 'Promo diperbarui' })
    }

    return res.status(404).json({ error: 'Unknown action' })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
