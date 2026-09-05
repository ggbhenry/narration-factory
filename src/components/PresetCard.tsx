import type { VoicePreset } from '../types/index.js'

interface PresetCardProps {
  preset: VoicePreset
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export function PresetCard({ preset, onEdit, onDuplicate, onDelete }: PresetCardProps) {
  const missingVoice = !preset.voice_id || preset.voice_id.trim().length === 0
  const missingModel = !preset.model_id || preset.model_id.trim().length === 0

  return (
    <div className="preset-card">
      <div className="preset-card__top">
        <strong>{preset.name}</strong>
        {(missingVoice || missingModel) && <span className="badge badge--error">Incompleto</span>}
      </div>

      <div className="preset-card__meta">
        <span>Voice: {missingVoice ? '— não configurado —' : preset.voice_id}</span>
        <span>Model: {missingModel ? '— não configurado —' : preset.model_id}</span>
      </div>

      <div className="preset-card__settings">
        <span>Stability {preset.stability.toFixed(2)}</span>
        <span>Similarity {preset.similarity_boost.toFixed(2)}</span>
        <span>Style {preset.style.toFixed(2)}</span>
        <span>Speed {(preset.speed ?? 1).toFixed(2)}</span>
        <span>Boost {preset.use_speaker_boost ? 'sim' : 'não'}</span>
      </div>

      <div className="preset-card__actions">
        <button type="button" className="btn btn--outline" onClick={onEdit}>
          Editar
        </button>
        <button type="button" className="btn btn--outline" onClick={onDuplicate}>
          Duplicar
        </button>
        <button type="button" className="btn btn--danger-outline" onClick={onDelete}>
          Excluir
        </button>
      </div>
    </div>
  )
}
