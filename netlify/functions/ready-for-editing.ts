import type { Handler } from '@netlify/functions'
import { requireAppToken } from './_shared/auth.js'
import { getJSON, initBlobs, listBlobKeys } from './_shared/blobs.js'
import { errorToResponse, methodNotAllowed, ok } from './_shared/http.js'
import { slugify, versionKey } from './_shared/ids.js'
import type { CopyRecord, NarrationVersion, ReadyForEditingItem } from '../../src/types/index.js'

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') return methodNotAllowed()

    initBlobs(event)
    requireAppToken(event)

    const keys = await listBlobKeys('copies/')
    const items: ReadyForEditingItem[] = []

    for (const key of keys) {
      const copy = await getJSON<CopyRecord>(key)
      if (!copy || copy.status !== 'READY_FOR_EDITING' || !copy.master_version_id) continue

      const slug = slugify(copy.copy_id)
      const version = await getJSON<NarrationVersion>(versionKey(slug, copy.master_version_id))
      if (!version || !version.audio_key) continue

      items.push({
        copy_id: copy.copy_id,
        copy_original: copy.copy_original,
        copy_tts: copy.copy_tts,
        preset_id: version.preset_id,
        voice_id: version.voice_id,
        version_id: version.version_id,
        master_audio: version.audio_key,
        duration_seconds: version.duration_seconds,
        status: copy.status,
      })
    }

    return ok({ items })
  } catch (err) {
    return errorToResponse(err)
  }
}
