// ============================================================
// Tipos compartilhados do domínio "Narration Factory"
// Usados tanto pelo frontend (src/) quanto pelas Netlify
// Functions (netlify/functions/), que importam diretamente
// deste arquivo (o esbuild da Netlify empacota tudo junto).
// ============================================================

export type CopyStatus =
  | 'IMPORTED'
  | 'QUEUED'
  | 'GENERATING'
  | 'READY_FOR_REVIEW'
  | 'READY_FOR_EDITING'
  | 'ERROR'

export type VersionStatus = 'GENERATED' | 'REJECTED' | 'APPROVED' | 'ERROR'

/** Configuração de voz da ElevenLabs — apenas os campos suportados pela API atual. */
export interface VoiceSettings {
  stability: number
  similarity_boost: number
  style: number
  use_speaker_boost: boolean
  /**
   * 0.7 a 1.2, padrão 1.0. Não disponível para o modelo eleven_v3.
   * Omitido (undefined) = não enviar para a API (usa o padrão dela).
   */
  speed?: number
}

export interface VoicePreset {
  id: string
  name: string
  voice_id: string
  model_id: string
  stability: number
  similarity_boost: number
  style: number
  speed?: number
  use_speaker_boost: boolean
  created_at: string
  updated_at: string
}

export interface CopyRecord {
  copy_id: string
  copy_original: string
  copy_tts: string
  requested_presets: string[]
  status: CopyStatus
  master_version_id: string | null
  last_error?: string | null
  created_at: string
  updated_at: string
}

export interface NarrationVersion {
  version_id: string // ex: "V001"
  copy_id: string
  copy_tts: string
  preset_id: string | null
  voice_id: string
  model_id: string
  settings: VoiceSettings
  audio_key: string | null
  duration_seconds: number | null
  status: VersionStatus
  error_message?: string | null
  created_at: string
}

export interface ReadyForEditingItem {
  copy_id: string
  copy_original: string
  copy_tts: string
  preset_id: string | null
  voice_id: string
  version_id: string
  master_audio: string
  duration_seconds: number | null
  status: CopyStatus
}

export interface ParsedCopyBlock {
  copy_id: string
  presets: string[]
  text: string
}

// ------------------------------------------------------------
// Payloads de API
// ------------------------------------------------------------

export interface ImportCopiesRequest {
  raw_text: string
}

export interface ImportCopiesResponse {
  imported: CopyRecord[]
  skipped: { copy_id: string; reason: string }[]
}

export interface GenerateRequest {
  copy_id: string
  preset_id?: string | null
  copy_tts?: string
  voice_id?: string
  model_id?: string
  settings?: VoiceSettings
  save_as_preset_name?: string | null
}

export interface GenerateResponse {
  copy: CopyRecord
  version: NarrationVersion
}

export interface ApproveRejectRequest {
  copy_id: string
  version_id: string
}

export interface UpdateCopyRequest {
  copy_id: string
  copy_tts?: string
}

export interface ApiErrorBody {
  error: string
}
