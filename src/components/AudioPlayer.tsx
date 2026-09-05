import { useEffect, useRef, useState } from 'react'
import { fetchAudioObjectUrl } from '../lib/api.js'

interface AudioPlayerProps {
  copyId: string
  versionId: string
  durationSeconds: number | null
}

/**
 * O <audio src> nativo não consegue enviar nosso header X-App-Token,
 * então este componente busca o MP3 autenticado via fetch, cria um
 * Object URL e o usa como fonte. Funciona bem no Safari do iPhone.
 */
export function AudioPlayer({ copyId, versionId, durationSeconds }: AudioPlayerProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    let cancelled = false
    let localUrl: string | null = null

    setLoading(true)
    setError(null)
    setObjectUrl(null)

    fetchAudioObjectUrl(copyId, versionId)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url)
          return
        }
        localUrl = url
        setObjectUrl(url)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar áudio.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      if (localUrl) URL.revokeObjectURL(localUrl)
    }
  }, [copyId, versionId])

  return (
    <div className="audio-player">
      {loading && <div className="audio-player__loading">Carregando áudio…</div>}
      {error && <div className="audio-player__error">{error}</div>}
      {objectUrl && (
        <audio ref={audioRef} controls preload="metadata" src={objectUrl} className="audio-player__el">
          O seu navegador não suporta reprodução de áudio.
        </audio>
      )}
      {typeof durationSeconds === 'number' && (
        <div className="audio-player__duration">{durationSeconds.toFixed(1)}s</div>
      )}
    </div>
  )
}
