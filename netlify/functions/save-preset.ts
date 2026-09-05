import type { Handler } from '@netlify/functions'
import { requireAppToken } from './_shared/auth.js'
import { getJSON, initBlobs, setJSON } from './_shared/blobs.js'
import { badRequest, errorToResponse, methodNotAllowed, ok } from './_shared/http.js'
import { isValidSlug, nowIso, presetKey, slugify } from './_shared/ids.js'
import { assertValidSettings } from './_shared/validation.js'
import type { VoicePreset } from '../../src/types/index.js'

interface SavePresetBody {
  id?: string
  name: string
  voice_id?: string
  model_id?: string
  stability?: number
  similarity_boost?: number
  style?: number
  speed?: number
  use_speaker_boost?: boolean
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return methodNotAllowed()

    initBlobs(event)
    requireAppToken(event)

    const payload = JSON.parse(event.body || '{}') as SavePresetBody
    if (!payload.name || !payload.name.trim()) {
      return badRequest('O preset precisa de um nome.')
    }

    const now = nowIso()
    const settings = assertValidSettings(payload)

    if (payload.id) {
      // Atualização de preset existente
      const slug = slugify(payload.id)
      const key = presetKey(slug)
      const existing = await getJSON<VoicePreset>(key)
      if (!existing) return badRequest(`Preset "${payload.id}" não encontrado para atualização.`)

      const updated: VoicePreset = {
        ...existing,
        name: payload.name.trim(),
        voice_id: (payload.voice_id ?? existing.voice_id ?? '').trim(),
        model_id: (payload.model_id ?? existing.model_id ?? '').trim(),
        ...settings,
        updated_at: now,
      }
      await setJSON(key, updated)
      return ok({ preset: updated })
    }

    // Criação de novo preset (ou duplicação, quando o frontend envia os
    // valores copiados de outro preset sem o campo "id").
    const baseSlug = slugify(payload.name)
    if (!isValidSlug(baseSlug)) {
      return badRequest('Nome de preset inválido — use letras e números.')
    }

    let slug = baseSlug
    let suffix = 2
    // Evita colisão de ID quando já existe um preset com nome igual/normalizado igual
    // eslint-disable-next-line no-await-in-loop
    while (await getJSON<VoicePreset>(presetKey(slug))) {
      slug = `${baseSlug}-${suffix}`
      suffix += 1
    }

    const preset: VoicePreset = {
      id: slug,
      name: payload.name.trim(),
      voice_id: (payload.voice_id ?? '').trim(),
      model_id: (payload.model_id ?? '').trim(),
      ...settings,
      created_at: now,
      updated_at: now,
    }

    await setJSON(presetKey(slug), preset)
    return ok({ preset })
  } catch (err) {
    return errorToResponse(err)
  }
}
