import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import LandingPage from './Landing.jsx'
import Revisionsassistent from './Revisionsassistent.jsx'

function OtpScreen({ email, onVerify, onBack }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const handleVerify = async () => {
    if (code.length < 6) return
    setVerifying(true); setError(null)
    const result = await onVerify(code)
    if (!result) { setError('Code ungültig oder abgelaufen.'); setVerifying(false) }
  }
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafe', fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <div style={{ width: 400, textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'white', fontWeight: 800, margin: '0 auto 24px' }}>R</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Code eingeben</h2>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28 }}>Wir haben einen Code an <strong>{email}</strong> gesendet.</p>
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '28px 24px' }}>
          <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))} onKeyDown={e => e.key === 'Enter' && handleVerify()} placeholder="Code eingeben" autoFocus style={{ width: '100%', padding: '14px 18px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 24, textAlign: 'center', letterSpacing: '0.2em', fontFamily: "'JetBrains Mono'", outline: 'none', boxSizing: 'border-box' }} />
          {error && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 10 }}>{error}</div>}
          <button onClick={handleVerify} disabled={code.length < 6 || verifying} style={{ width: '100%', padding: '13px', marginTop: 16, background: code.length >= 6 ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : '#e2e8f0', color: code.length >= 6 ? 'white' : '#94a3b8', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: code.length >= 6 ? 'pointer' : 'not-allowed' }}>{verifying ? 'Wird geprüft...' : 'Anmelden'}</button>
        </div>
        <button onClick={onBack} style={{ marginTop: 16, background: 'none', border: 'none', color: '#7c3aed', fontSize: 13, cursor: 'pointer' }}>← Andere E-Mail verwenden</button>
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [otpEmail, setOtpEmail] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); if (session) setOtpEmail(null) })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
    if (error) { alert('Fehler: ' + error.message); return false }
    setOtpEmail(email); return true
  }

  const handleVerifyOtp = async (code) => {
    const { data, error } = await supabase.auth.verifyOtp({ email: otpEmail, token: code, type: 'email' })
    if (error || !data.session) return false
    setSession(data.session); return true
  }

  const handleLogout = async () => { await supabase.auth.signOut(); setSession(null) }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Sans'" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ color: '#64748b', fontSize: 14 }}>Laden...</div>
      </div>
    </div>
  )

  if (!session && otpEmail) return <OtpScreen email={otpEmail} onVerify={handleVerifyOtp} onBack={() => setOtpEmail(null)} />
  if (!session) return <LandingPage onLogin={handleLogin} />

  return <Revisionsassistent user={session.user.email} userId={session.user.id} onLogout={handleLogout} />
}
