import { getStoredToken } from './auth.js'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken()

  const response = await fetch(`/api/${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-App-Token': token ?? '',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    let message = `Erro ${response.status}`
    try {
      const body = await response.json()
      if (body?.error) message = body.error
    } catch {
      // resposta sem corpo JSON
    }
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('app:unauthorized'))
    }
    throw new ApiError(response.status, message)
  }

  // Algumas respostas (áudio binário) não passam por aqui — get-audio usa fetch direto.
  return (await response.json()) as T
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' })
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined })
}

/**
 * Busca um áudio protegido e retorna uma Object URL pronta para uso em <audio>.
 * O chamador é responsável por revogar a URL quando não precisar mais dela.
 */
export async function fetchAudioObjectUrl(copyId: string, versionId: string): Promise<string> {
  const token = getStoredToken()
  const params = new URLSearchParams({ copy_id: copyId, version_id: versionId })
  const response = await fetch(`/api/get-audio?${params.toString()}`, {
    headers: { 'X-App-Token': token ?? '' },
  })

  if (!response.ok) {
    let message = `Erro ${response.status} ao buscar áudio.`
    try {
      const body = await response.json()
      if (body?.error) message = body.error
    } catch {
      // ignore
    }
    throw new ApiError(response.status, message)
  }

  const blob = await response.blob()
  return URL.createObjectURL(blob)
}
