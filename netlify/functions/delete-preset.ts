import type { Handler } from '@netlify/functions'
import { requireAppToken } from './_shared/auth.js'
import { deleteBlob, getJSON, initBlobs } from './_shared/blobs.js'
import { badRequest, errorToResponse, methodNotAllowed, notFound, ok } from './_shared/http.js'
import { presetKey, slugify } from './_shared/ids.js'
import type { VoicePreset } from '../../src/types/index.js'

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST' && event.httpMethod !== 'DELETE') return methodNotAllowed()

    initBlobs(event)
    requireAppToken(event)

    const payload = JSON.parse(event.body || '{}') as { id?: string }
    if (!payload.id) return badRequest('id é obrigatório.')

    const slug = slugify(payload.id)
    const key = presetKey(slug)
    const existing = await getJSON<VoicePreset>(key)
    if (!existing) return notFound(`Preset "${payload.id}" não encontrado.`)

    await deleteBlob(key)
    return ok({ deleted: true, id: slug })
  } catch (err) {
    return errorToResponse(err)
  }
}
