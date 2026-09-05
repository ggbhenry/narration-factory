import { useEffect, useState } from 'react'
import { LoginGate } from './components/LoginGate.js'
import { AppShell } from './components/AppShell.js'
import type { AppPage } from './components/AppShell.js'
import { ToastProvider } from './components/Toast.js'
import { NarrationsPage } from './pages/NarrationsPage.js'
import { PresetsPage } from './pages/PresetsPage.js'
import { clearStoredToken, getStoredToken } from './lib/auth.js'

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => Boolean(getStoredToken()))
  const [page, setPage] = useState<AppPage>('narrations')

  useEffect(() => {
    function handleUnauthorized() {
      clearStoredToken()
      setAuthenticated(false)
    }
    window.addEventListener('app:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('app:unauthorized', handleUnauthorized)
  }, [])

  return (
    <ToastProvider>
      {!authenticated ? (
        <LoginGate onAuthenticated={() => setAuthenticated(true)} />
      ) : (
        <AppShell page={page} onNavigate={setPage}>
          {page === 'narrations' ? <NarrationsPage /> : <PresetsPage />}
        </AppShell>
      )}
    </ToastProvider>
  )
}
