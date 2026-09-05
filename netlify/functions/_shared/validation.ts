import { HttpError } from './http.js'
import type { VoicePreset, VoiceSettings } from '../../../src/types/index.js'

export const MAX_COPY_LENGTH = 6000

export function assertNonEmptyText(text: unknown, fieldName: string): string {
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new HttpError(400, `Campo "${fieldName}" não pode estar vazio.`)
  }
  if (text.length > MAX_COPY_LENGTH) {
    throw new HttpError(
      400,
      `Campo "${fieldName}" excede o tamanho máximo de ${MAX_COPY_LENGTH} caracteres.`,
    )
  }
  return text
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function assertValidSettings(settings: Partial<VoiceSettings>): VoiceSettings {
  const stability = typeof settings.stability === 'number' ? clampNumber(settings.stability, 0, 1) : 0.5
  const similarity_boost =
    typeof settings.similarity_boost === 'number' ? clampNumber(settings.similarity_boost, 0, 1) : 0.75
  const style = typeof settings.style === 'number' ? clampNumber(settings.style, 0, 1) : 0
  const use_speaker_boost =
    typeof settings.use_speaker_boost === 'boolean' ? settings.use_speaker_boost : true
  const speed =
    typeof settings.speed === 'number' ? clampNumber(settings.speed, 0.7, 1.2) : undefined

  return { stability, similarity_boost, style, use_speaker_boost, speed }
}

/**
 * Garante que o preset está pronto para gerar áudio. Lança erros
 * compreensíveis (não apenas 500) quando falta configuração.
 */
export function assertPresetReadyToGenerate(preset: VoicePreset | null, presetId: string | null): void {
  if (presetId && !preset) {
    throw new HttpError(404, `Preset "${presetId}" não encontrado.`)
  }
  if (preset && (!preset.voice_id || preset.voice_id.trim().length === 0)) {
    throw new HttpError(400, `Preset "${preset.name}" ainda não possui Voice ID configurado.`)
  }
  if (preset && (!preset.model_id || preset.model_id.trim().length === 0)) {
    throw new HttpError(400, `Preset "${preset.name}" ainda não possui um Model ID configurado.`)
  }
}

export function assertVoiceAndModel(voiceId: string | undefined, modelId: string | undefined): void {
  if (!voiceId || voiceId.trim().length === 0) {
    throw new HttpError(400, 'Voice ID não informado para a geração.')
  }
  if (!modelId || modelId.trim().length === 0) {
    throw new HttpError(400, 'Model ID não informado para a geração.')
  }
}
