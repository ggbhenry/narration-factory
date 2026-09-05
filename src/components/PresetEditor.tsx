import { useState } from 'react'
import { apiPost } from '../lib/api.js'
import { useToast } from './Toast.js'
import type { VoicePreset } from '../types/index.js'

interface PresetEditorProps {
  /** null = criar novo preset. Se vier com id, é edição. Se vier sem id (duplicado), é criação pré-preenchida. */
  preset: Partial<VoicePreset> | null
  onClose: () => void
  onSaved: () => void
}

const BLANK: Partial<VoicePreset> = {
  name: '',
  voice_id: '',
  model_id: '',
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0,
  speed: 1,
  use_speaker_boost: true,
}

export function PresetEditor({ preset, onClose, onSaved }: PresetEditorProps) {
  const { showToast } = useToast()
  const base = preset ?? BLANK
  const [name, setName] = useState(base.name ?? '')
  const [voiceId, setVoiceId] = useState(base.voice_id ?? '')
  const [modelId, setModelId] = useState(base.model_id ?? '')
  const [stability, setStability] = useState(base.stability ?? 0.5)
  const [similarity, setSimilarity] = useState(base.similarity_boost ?? 0.75)
  const [style, setStyle] = useState(base.style ?? 0)
  const [speed, setSpeed] = useState(base.speed ?? 1)
  const [speakerBoost, setSpeakerBoost] = useState(base.use_speaker_boost ?? true)
  const [busy, setBusy] = useState(false)

  const isEditing = Boolean(preset?.id)

  async function handleSave() {
    if (!name.trim()) {
      showToast('Informe um nome para o preset.', 'error')
      return
    }
    setBusy(true)
    try {
      await apiPost('save-preset', {
        id: preset?.id,
        name: name.trim(),
        voice_id: voiceId.trim(),
        model_id: modelId.trim(),
        stability,
        similarity_boost: similarity,
        style,
        speed,
        use_speaker_boost: speakerBoost,
      })
      showToast(`Preset "${name.trim()}" salvo.`, 'success')
      onSaved()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar preset.', 'error')
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
          <h2>{isEditing ? `Editar preset — ${base.name}` : 'Novo preset'}</h2>
        </div>

        <div className="sheet__body">
          <label className="field">
            <span>Nome</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <label className="field">
            <span>Voice ID</span>
            <input className="input" value={voiceId} onChange={(e) => setVoiceId(e.target.value)} placeholder="ID da voz na ElevenLabs" />
          </label>

          <label className="field">
            <span>Model ID</span>
            <input className="input" value={modelId} onChange={(e) => setModelId(e.target.value)} placeholder="ex: eleven_multilingual_v2" />
          </label>

          <SliderField label="Stability" value={stability} min={0} max={1} step={0.01} onChange={setStability} />
          <SliderField label="Similarity" value={similarity} min={0} max={1} step={0.01} onChange={setSimilarity} />
          <SliderField label="Style" value={style} min={0} max={1} step={0.01} onChange={setStyle} />
          <SliderField label="Speed" value={speed} min={0.7} max={1.2} step={0.01} onChange={setSpeed} />

          <label className="field field--row">
            <span>Speaker boost</span>
            <input type="checkbox" checked={speakerBoost} onChange={(e) => setSpeakerBoost(e.target.checked)} />
          </label>
        </div>

        <div className="sheet__footer">
          <button type="button" className="btn btn--secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="btn btn--primary" onClick={handleSave} disabled={busy}>
            {busy ? 'Salvando…' : 'Salvar preset'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="slider-row">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="slider"
        />
        <span className="slider-value">{value.toFixed(2)}</span>
      </div>
    </label>
  )
}
