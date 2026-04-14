import { useState } from 'react'
import LandingPage from './Landing.jsx'
import Revisionsassistent from './Revisionsassistent.jsx'

export default function App() {
  const [user, setUser] = useState(null)

  if (!user) {
    return <LandingPage onLogin={(email) => setUser(email)} />
  }

  return <Revisionsassistent user={user} onLogout={() => setUser(null)} />
}
