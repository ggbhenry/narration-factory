import { useCallback, useEffect, useState } from 'react'
import { apiGet } from '../lib/api.js'
import type { CopyRecord, NarrationVersion } from '../types/index.js'

interface ListCopiesResponse {
  copies: CopyRecord[]
  latest_versions: Record<string, NarrationVersion | null>
}

export function useCopies() {
  const [copies, setCopies] = useState<CopyRecord[]>([])
  const [latestVersions, setLatestVersions] = useState<Record<string, NarrationVersion | null>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setError(null)
    try {
      const data = await apiGet<ListCopiesResponse>('list-copies')
      setCopies(data.copies)
      setLatestVersions(data.latest_versions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar copies.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { copies, latestVersions, loading, error, refresh }
}
