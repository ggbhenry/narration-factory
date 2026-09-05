import type { Handler } from '@netlify/functions'
import { requireAppToken } from './_shared/auth.js'
import { getJSON, initBlobs, setJSON } from './_shared/blobs.js'
import { badRequest, errorToResponse, methodNotAllowed, notFound, ok } from './_shared/http.js'
import { copyKey, nowIso, slugify } from './_shared/ids.js'
import { assertNonEmptyText } from './_shared/validation.js'
import type { CopyRecord, UpdateCopyRequest } from '../../src/types/index.js'

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return methodNotAllowed()

    initBlobs(event)
    requireAppToken(event)

    const payload = JSON.parse(event.body || '{}') as UpdateCopyRequest
    if (!payload.copy_id) return badRequest('copy_id é obrigatório.')

    const slug = slugify(payload.copy_id)
    const key = copyKey(slug)
    const existing = await getJSON<CopyRecord>(key)
    if (!existing) return notFound(`Copy "${payload.copy_id}" não encontrada.`)

    if (typeof payload.copy_tts === 'string') {
      existing.copy_tts = assertNonEmptyText(payload.copy_tts, 'copy_tts')
    }
    existing.updated_at = nowIso()

    await setJSON(key, existing)

    return ok({ copy: existing })
  } catch (err) {
    return errorToResponse(err)
  }
}
