import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../lib/api.js'
import { AudioPlayer } from './AudioPlayer.js'
import { StatusBadge } from './StatusBadge.js'
import { VersionHistory } from './VersionHistory.js'
import { EditNarrationSheet } from './EditNarrationSheet.js'
import { useToast } from './Toast.js'
import type { CopyRecord, NarrationVersion, VoicePreset } from '../types/index.js'

interface ReviewSheetProps {
  copy: CopyRecord
  presets: VoicePreset[]
  onClose: () => void
  onChanged: () => void
}

export function ReviewSheet({ copy: initialCopy, presets, onClose, onChanged }: ReviewSheetProps) {
  const { showToast } = useToast()
  const [copy, setCopy] = useState<CopyRecord>(initialCopy)
  const [versions, setVersions] = useState<NarrationVersion[]>([])
  const [loadingVersions, setLoadingVersions] = useState(true)
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const loadVersions = async (preferVersionId?: string | null) => {
    setLoadingVersions(true)
    try {
      const data = await apiGet<{ versions: NarrationVersion[] }>(`list-versions?copy_id=${encodeURIComponent(copy.copy_id)}`)
      setVersions(data.versions)
      const preferred = preferVersionId ?? copy.master_version_id ?? data.versions[0]?.version_id ?? null
      setSelectedVersionId(preferred)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao carregar versões.', 'error')
    } finally {
      setLoadingVersions(false)
    }
  }

  useEffect(() => {
    loadVersions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copy.copy_id])

  const selectedVersion = versions.find((v) => v.version_id === selectedVersionId) ?? null

  async function handleApprove() {
    if (!selectedVersion) return
    setBusy(true)
    try {
      const res = await apiPost<{ copy: CopyRecord; version: NarrationVersion }>('approve', {
        copy_id: copy.copy_id,
        version_id: selectedVersion.version_id,
      })
      setCopy(res.copy)
      showToast(`${selectedVersion.version_id} aprovada como master.`, 'success')
      await loadVersions(res.version.version_id)
      onChanged()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao aprovar.', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleReject(andRegenerate: boolean) {
    if (!selectedVersion) return
    setBusy(true)
    try {
      const res = await apiPost<{ copy: CopyRecord; version: NarrationVersion }>('reject', {
        copy_id: copy.copy_id,
        version_id: selectedVersion.version_id,
      })
      setCopy(res.copy)
      showToast(`${selectedVersion.version_id} rejeitada.`, 'info')
      onChanged()

      if (andRegenerate) {
        const genRes = await apiPost<{ copy: CopyRecord; version: NarrationVersion }>('generate', {
          copy_id: copy.copy_id,
          preset_id: selectedVersion.preset_id,
          voice_id: selectedVersion.voice_id,
          model_id: selectedVersion.model_id,
          settings: selectedVersion.settings,
          copy_tts: selectedVersion.copy_tts,
        })
        setCopy(genRes.copy)
        showToast(`${genRes.version.version_id} gerada.`, 'success')
        await loadVersions(genRes.version.version_id)
        onChanged()
      } else {
        await loadVersions()
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao rejeitar/regerar.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true">
      <div className="sheet sheet--full">
        <div className="sheet__header">
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
          <h2>{copy.copy_id}</h2>
          <StatusBadge status={copy.status} />
        </div>

        <div className="sheet__body">
          <section className="review-copy-text">
            <h3>Copy original</h3>
            <p className="readonly-block">{copy.copy_original}</p>
          </section>

          {loadingVersions && <p className="muted">Carregando versões…</p>}

          {!loadingVersions && selectedVersion && (
            <section>
              <h3>
                {selectedVersion.version_id}
                {selectedVersion.preset_id ? ` — ${selectedVersion.preset_id}` : ''}
              </h3>
              {selectedVersion.status === 'ERROR' ? (
                <p className="error-text">{selectedVersion.error_message ?? 'Falha ao gerar este áudio.'}</p>
              ) : (
                <AudioPlayer
                  copyId={copy.copy_id}
                  versionId={selectedVersion.version_id}
                  durationSeconds={selectedVersion.duration_seconds}
                />
              )}

              <div className="review-actions">
                <button
                  type="button"
                  className="btn btn--success"
                  disabled={busy || selectedVersion.status !== 'GENERATED'}
                  onClick={handleApprove}
                >
                  Aprovar
                </button>
                <button
                  type="button"
                  className="btn btn--danger"
                  disabled={busy || selectedVersion.status !== 'GENERATED'}
                  onClick={() => handleReject(false)}
                >
                  Rejeitar
                </button>
                <button
                  type="button"
                  className="btn btn--outline"
                  disabled={busy || selectedVersion.status !== 'GENERATED'}
                  onClick={() => handleReject(true)}
                >
                  Rejeitar e regerar
                </button>
                <button type="button" className="btn btn--secondary" disabled={busy} onClick={() => setShowEdit(true)}>
                  Editar
                </button>
              </div>
            </section>
          )}

          {!loadingVersions && (
            <section>
              <h3>Histórico de versões</h3>
              <VersionHistory
                copy={copy}
                versions={versions}
                selectedVersionId={selectedVersionId}
                onSelect={setSelectedVersionId}
              />
            </section>
          )}
        </div>
      </div>

      {showEdit && selectedVersion && (
        <EditNarrationSheet
          copy={copy}
          baseVersion={selectedVersion}
          presets={presets}
          onClose={() => setShowEdit(false)}
          onGenerated={async (updatedCopy, newVersion) => {
            setCopy(updatedCopy)
            setShowEdit(false)
            await loadVersions(newVersion.version_id)
            onChanged()
          }}
        />
      )}
    </div>
  )
}
