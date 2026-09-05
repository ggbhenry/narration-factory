import type { Handler } from '@netlify/functions'
import { requireAppToken } from './_shared/auth.js'
import { getJSON, initBlobs, setJSON } from './_shared/blobs.js'
import { badRequest, errorToResponse, methodNotAllowed, notFound, ok } from './_shared/http.js'
import { copyKey, nowIso, slugify, versionKey } from './_shared/ids.js'
import type { ApproveRejectRequest, CopyRecord, NarrationVersion } from '../../src/types/index.js'

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return methodNotAllowed()

    initBlobs(event)
    requireAppToken(event)

    const payload = JSON.parse(event.body || '{}') as ApproveRejectRequest
    if (!payload.copy_id || !payload.version_id) {
      return badRequest('copy_id e version_id são obrigatórios.')
    }

    const slug = slugify(payload.copy_id)
    const copy = await getJSON<CopyRecord>(copyKey(slug))
    if (!copy) return notFound(`Copy "${payload.copy_id}" não encontrada.`)

    const version = await getJSON<NarrationVersion>(versionKey(slug, payload.version_id))
    if (!version) return notFound(`Versão "${payload.version_id}" não encontrada.`)

    // Nunca apaga a versão ou o áudio — apenas muda o status.
    version.status = 'REJECTED'
    await setJSON(versionKey(slug, payload.version_id), version)

    if (copy.master_version_id === payload.version_id) {
      copy.master_version_id = null
      copy.status = 'IMPORTED'
    } else if (!copy.master_version_id) {
      copy.status = 'IMPORTED'
    }
    // Se já existe outro master aprovado, o status READY_FOR_EDITING é mantido.
    copy.updated_at = nowIso()
    await setJSON(copyKey(slug), copy)

    return ok({ copy, version })
  } catch (err) {
    return errorToResponse(err)
  }
}
