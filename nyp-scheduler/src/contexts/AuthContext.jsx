import { createContext, useContext, useState } from 'react'
import { supabase } from '../supabase.js'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('nyp_user')) } catch { return null }
  })

  async function login(email, password) {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .eq('password', password)
      .eq('is_active', true)
      .maybeSingle()

    if (error || !data) return 'Invalid email or password'
    sessionStorage.setItem('nyp_user', JSON.stringify(data))
    setUser(data)
    return null
  }

  function logout() {
    sessionStorage.removeItem('nyp_user')
    setUser(null)
  }

  async function refreshUser() {
    if (!user) return
    const { data } = await supabase.from('employees').select('*').eq('id', user.id).maybeSingle()
    if (data) { sessionStorage.setItem('nyp_user', JSON.stringify(data)); setUser(data) }
  }

  return (
    <AuthCtx.Provider value={{ user, login, logout, refreshUser }}>
      {children}
    </AuthCtx.Provider>
  )
}
