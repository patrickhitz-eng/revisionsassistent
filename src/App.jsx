import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import LandingPage from './Landing.jsx'
import Revisionsassistent from './Revisionsassistent.jsx'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })
    if (error) {
      alert('Fehler beim Login: ' + error.message)
      return false
    }
    alert('Magic Link gesendet! Prüfen Sie Ihre E-Mail-Inbox und klicken Sie auf den Link.')
    return true
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{ color: '#64748b', fontSize: 14 }}>Laden...</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return <LandingPage onLogin={handleLogin} />
  }

  return (
    <Revisionsassistent 
      user={session.user.email} 
      userId={session.user.id}
      onLogout={handleLogout} 
    />
  )
}
