import { useState } from 'react'
import type { FormEvent } from 'react'
import { setStoredToken } from '../lib/auth.js'
import { ApiError, apiGet } from '../lib/api.js'

interface LoginGateProps {
  onAuthenticated: () => void
}

export function LoginGate({ onAuthenticated }: LoginGateProps) {
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token.trim()) {
      setError('Digite o código de acesso.')
      return
    }
    setBusy(true)
    setError(null)

    // Guarda temporariamente para o apiGet enviar no header, valida com uma chamada real.
    setStoredToken(token.trim())

    try {
      await apiGet('list-presets')
      onAuthenticated()
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Código de acesso inválido.')
      } else {
        setError(err instanceof Error ? err.message : 'Erro ao validar o código de acesso.')
      }
      setStoredToken('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-gate">
      <form className="login-gate__card" onSubmit={handleSubmit}>
        <h1>Narration Factory</h1>
        <p className="muted">Digite o código de acesso para entrar.</p>

        <label className="field">
          <span>Código de acesso</span>
          <input
            className="input"
            type="password"
            autoFocus
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          {busy ? 'Verificando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
