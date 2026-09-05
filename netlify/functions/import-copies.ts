import type { Handler } from '@netlify/functions'
import { requireAppToken } from './_shared/auth.js'
import { getJSON, initBlobs, setJSON } from './_shared/blobs.js'
import { badRequest, errorToResponse, methodNotAllowed, ok } from './_shared/http.js'
import { copyKey, isValidSlug, nowIso, slugify } from './_shared/ids.js'
import { assertNonEmptyText } from './_shared/validation.js'
import { parseCopiesText } from '../../src/lib/parseCopies.js'
import type { CopyRecord, ImportCopiesRequest, ImportCopiesResponse } from '../../src/types/index.js'

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return methodNotAllowed()

    initBlobs(event)
    requireAppToken(event)

    const payload = JSON.parse(event.body || '{}') as ImportCopiesRequest
    const rawText = assertNonEmptyText(payload.raw_text, 'raw_text')

    const { blocks, errors } = parseCopiesText(rawText)

    if (blocks.length === 0) {
      return badRequest(
        `Nenhuma copy válida encontrada no texto. ${errors.join(' ')}`.trim(),
      )
    }

    const imported: CopyRecord[] = []
    const skipped: { copy_id: string; reason: string }[] = []

    for (const block of blocks) {
      const slug = slugify(block.copy_id)
      if (!isValidSlug(slug)) {
        skipped.push({ copy_id: block.copy_id, reason: 'Identificador de copy inválido após normalização.' })
        continue
      }

      const key = copyKey(slug)
      const existing = await getJSON<CopyRecord>(key)
      if (existing) {
        skipped.push({ copy_id: block.copy_id, reason: 'Já existe uma copy com este ID. Importação ignorada para evitar sobrescrever.' })
        continue
      }

      const now = nowIso()
      const record: CopyRecord = {
        copy_id: block.copy_id,
        copy_original: block.text,
        copy_tts: block.text,
        requested_presets: block.presets,
        status: 'IMPORTED',
        master_version_id: null,
        created_at: now,
        updated_at: now,
      }

      await setJSON(key, record)
      imported.push(record)
    }

    for (const parseErr of errors) {
      skipped.push({ copy_id: '(parse)', reason: parseErr })
    }

    const response: ImportCopiesResponse = { imported, skipped }
    return ok(response)
  } catch (err) {
    return errorToResponse(err)
  }
}
