import { useCallback, useEffect, useState } from 'react'
import { apiGet } from '../lib/api.js'
import type { VoicePreset } from '../types/index.js'

export function usePresets() {
  const [presets, setPresets] = useState<VoicePreset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setError(null)
    try {
      const data = await apiGet<{ presets: VoicePreset[] }>('list-presets')
      setPresets(data.presets)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar presets.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { presets, loading, error, refresh }
}
