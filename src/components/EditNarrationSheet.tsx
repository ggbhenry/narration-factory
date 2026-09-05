import { useState } from 'react'
import { apiPost } from '../lib/api.js'
import { useToast } from './Toast.js'
import type { CopyRecord, NarrationVersion, VoicePreset, VoiceSettings } from '../types/index.js'

interface EditNarrationSheetProps {
  copy: CopyRecord
  baseVersion: NarrationVersion
  presets: VoicePreset[]
  onClose: () => void
  onGenerated: (copy: CopyRecord, version: NarrationVersion) => void
}

export function EditNarrationSheet({ copy, baseVersion, presets, onClose, onGenerated }: EditNarrationSheetProps) {
  const { showToast } = useToast()
  const [copyTts, setCopyTts] = useState(baseVersion.copy_tts)
  const [presetId, setPresetId] = useState<string>(baseVersion.preset_id ?? '')
  const [voiceId, setVoiceId] = useState(baseVersion.voice_id)
  const [modelId, setModelId] = useState(baseVersion.model_id)
  const [settings, setSettings] = useState<VoiceSettings>(baseVersion.settings)
  const [saveAsPresetName, setSaveAsPresetName] = useState('')
  const [busy, setBusy] = useState(false)
  const [savingPreset, setSavingPreset] = useState(false)

  function applyPreset(id: string) {
    setPresetId(id)
    const preset = presets.find((p) => p.id === id)
    if (preset) {
      setVoiceId(preset.voice_id)
      setModelId(preset.model_id)
      setSettings({
        stability: preset.stability,
        similarity_boost: preset.similarity_boost,
        style: preset.style,
        speed: preset.speed,
        use_speaker_boost: preset.use_speaker_boost,
      })
    }
  }

  function updateSetting<K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  async function handleGenerate() {
    setBusy(true)
    try {
      const res = await apiPost<{ copy: CopyRecord; version: NarrationVersion }>('generate', {
        copy_id: copy.copy_id,
        preset_id: presetId || null,
        copy_tts: copyTts,
        voice_id: voiceId,
        model_id: modelId,
        settings,
      })
      showToast(`${res.version.version_id} gerada com sucesso.`, 'success')
      onGenerated(res.copy, res.version)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao gerar nova versão.', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleSaveAsPreset() {
    if (!saveAsPresetName.trim()) {
      showToast('Informe um nome para o novo preset.', 'error')
      return
    }
    setSavingPreset(true)
    try {
      await apiPost('save-preset', {
        name: saveAsPresetName.trim(),
        voice_id: voiceId,
        model_id: modelId,
        ...settings,
      })
      showToast(`Preset "${saveAsPresetName.trim()}" criado.`, 'success')
      setSaveAsPresetName('')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar preset.', 'error')
    } finally {
      setSavingPreset(false)
    }
  }

  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true">
      <div className="sheet sheet--full">
        <div className="sheet__header">
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
          <h2>Editar / Regerar — {copy.copy_id}</h2>
        </div>

        <div className="sheet__body">
          <section>
            <h3>Copy original</h3>
            <p className="readonly-block">{copy.copy_original}</p>
          </section>

          <section>
            <h3>Copy para TTS</h3>
            <textarea
              className="textarea"
              value={copyTts}
              onChange={(e) => setCopyTts(e.target.value)}
              rows={6}
            />
          </section>

          <section>
            <h3>Configuração de voz</h3>

            <label className="field">
              <span>Preset</span>
              <select value={presetId} onChange={(e) => applyPreset(e.target.value)} className="select">
                <option value="">Manual (sem preset)</option>
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Voice ID</span>
              <input className="input" value={voiceId} onChange={(e) => setVoiceId(e.target.value)} />
            </label>

            <label className="field">
              <span>Model ID</span>
              <input className="input" value={modelId} onChange={(e) => setModelId(e.target.value)} />
            </label>

            <SliderField
              label="Stability"
              value={settings.stability}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => updateSetting('stability', v)}
            />
            <SliderField
              label="Similarity"
              value={settings.similarity_boost}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => updateSetting('similarity_boost', v)}
            />
            <SliderField
              label="Style"
              value={settings.style}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => updateSetting('style', v)}
            />
            <SliderField
              label="Speed"
              value={settings.speed ?? 1}
              min={0.7}
              max={1.2}
              step={0.01}
              onChange={(v) => updateSetting('speed', v)}
            />

            <label className="field field--row">
              <span>Speaker boost</span>
              <input
                type="checkbox"
                checked={settings.use_speaker_boost}
                onChange={(e) => updateSetting('use_speaker_boost', e.target.checked)}
              />
            </label>
          </section>

          <section className="save-preset-row">
            <label className="field">
              <span>Salvar configuração atual como preset</span>
              <input
                className="input"
                placeholder="Nome do novo preset"
                value={saveAsPresetName}
                onChange={(e) => setSaveAsPresetName(e.target.value)}
              />
            </label>
            <button type="button" className="btn btn--outline" disabled={savingPreset} onClick={handleSaveAsPreset}>
              {savingPreset ? 'Salvando…' : 'Salvar como preset'}
            </button>
          </section>
        </div>

        <div className="sheet__footer">
          <button type="button" className="btn btn--secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="btn btn--primary" onClick={handleGenerate} disabled={busy}>
            {busy ? 'Gerando…' : 'Gerar nova versão'}
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
