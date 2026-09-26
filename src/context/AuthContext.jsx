import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(id) {
    if (!id) return setProfile(null)
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
    if (!error) setProfile(data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (s) loadProfile(s.user.id)
      else setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const isPro = Boolean(
    profile?.has_unlocked_ai ||
    (profile?.subscription_expires_at && new Date(profile.subscription_expires_at) > new Date())
  )

  return (
    <AuthCtx.Provider value={{
      session, profile, isPro, loading,
      signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
      signUp: (email, password, fullName) =>
        supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } }),
      signOut: () => supabase.auth.signOut(),
      refreshProfile: () => session && loadProfile(session.user.id)
    }}>
      {children}
    </AuthCtx.Provider>
  )
}

const FALLBACK = {
  session: null, profile: null, isPro: false, loading: false,
  signIn: async () => ({ error: { message: 'Auth belum siap' } }),
  signUp: async () => ({ error: { message: 'Auth belum siap' } }),
  signOut: async () => {},
  refreshProfile: () => {}
}

export function useAuth() {
  return useContext(AuthCtx) || FALLBACK
}
