import type { Handler } from '@netlify/functions'
import { requireAppToken } from './_shared/auth.js'
import { getJSON, initBlobs, listBlobKeys } from './_shared/blobs.js'
import { errorToResponse, methodNotAllowed, ok } from './_shared/http.js'
import type { VoicePreset } from '../../src/types/index.js'

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') return methodNotAllowed()

    initBlobs(event)
    requireAppToken(event)

    const keys = await listBlobKeys('presets/')
    const presets: VoicePreset[] = []
    for (const key of keys) {
      const preset = await getJSON<VoicePreset>(key)
      if (preset) presets.push(preset)
    }
    presets.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

    return ok({ presets })
  } catch (err) {
    return errorToResponse(err)
  }
}
