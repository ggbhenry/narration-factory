import { useState } from 'react'
import { usePresets } from '../hooks/usePresets.js'
import { apiPost } from '../lib/api.js'
import { PresetCard } from '../components/PresetCard.js'
import { PresetEditor } from '../components/PresetEditor.js'
import { useToast } from '../components/Toast.js'
import type { VoicePreset } from '../types/index.js'

export function PresetsPage() {
  const { presets, loading, error, refresh } = usePresets()
  const { showToast } = useToast()
  const [editing, setEditing] = useState<Partial<VoicePreset> | null | 'new'>(null)
  const [pendingDelete, setPendingDelete] = useState<VoicePreset | null>(null)
  const [deleting, setDeleting] = useState(false)

  function handleDuplicate(preset: VoicePreset) {
    const { id, created_at, updated_at, ...rest } = preset
    setEditing({ ...rest, name: `${preset.name} (cópia)` })
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await apiPost('delete-preset', { id: pendingDelete.id })
      showToast(`Preset "${pendingDelete.name}" excluído.`, 'success')
      setPendingDelete(null)
      refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao excluir preset.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="presets-page">
      <div className="page-title-row">
        <h1 className="page-title">Presets</h1>
        <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>
          Novo preset
        </button>
      </div>

      {loading && <p className="muted">Carregando presets…</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && presets.length === 0 && (
        <p className="muted">Nenhum preset cadastrado ainda. Crie o primeiro para poder gerar narrações.</p>
      )}

      <div className="preset-list">
        {presets.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            onEdit={() => setEditing(preset)}
            onDuplicate={() => handleDuplicate(preset)}
            onDelete={() => setPendingDelete(preset)}
          />
        ))}
      </div>

      {editing !== null && (
        <PresetEditor
          preset={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            refresh()
          }}
        />
      )}

      {pendingDelete && (
        <div className="sheet-overlay" role="dialog" aria-modal="true">
          <div className="sheet sheet--compact">
            <div className="sheet__body">
              <h3>Excluir preset "{pendingDelete.name}"?</h3>
              <p className="muted">
                Isso não afeta versões já geradas — cada versão guarda seu próprio snapshot de configuração.
              </p>
            </div>
            <div className="sheet__footer">
              <button type="button" className="btn btn--secondary" onClick={() => setPendingDelete(null)} disabled={deleting}>
                Cancelar
              </button>
              <button type="button" className="btn btn--danger" onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
