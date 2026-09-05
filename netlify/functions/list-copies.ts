import type { Handler } from '@netlify/functions'
import { requireAppToken } from './_shared/auth.js'
import { getJSON, initBlobs, listBlobKeys } from './_shared/blobs.js'
import { errorToResponse, methodNotAllowed, ok } from './_shared/http.js'
import { slugify, versionKey, versionPrefix, parseVersionNumber } from './_shared/ids.js'
import type { CopyRecord, NarrationVersion } from '../../src/types/index.js'

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') return methodNotAllowed()

    initBlobs(event)
    requireAppToken(event)

    const keys = await listBlobKeys('copies/')
    const copies: CopyRecord[] = []

    for (const key of keys) {
      const record = await getJSON<CopyRecord>(key)
      if (record) copies.push(record)
    }

    copies.sort((a, b) => a.copy_id.localeCompare(b.copy_id, 'pt-BR', { numeric: true }))

    const latestVersions: Record<string, NarrationVersion | null> = {}

    for (const copy of copies) {
      const slug = slugify(copy.copy_id)
      const vKeys = await listBlobKeys(versionPrefix(slug))
      let latest: NarrationVersion | null = null
      let latestNum = -1
      for (const vKey of vKeys) {
        const versionIdMatch = /\/(V\d+)\.json$/.exec(vKey)
        if (!versionIdMatch) continue
        const num = parseVersionNumber(versionIdMatch[1])
        if (num > latestNum) {
          const record = await getJSON<NarrationVersion>(versionKey(slug, versionIdMatch[1]))
          if (record) {
            latest = record
            latestNum = num
          }
        }
      }
      latestVersions[copy.copy_id] = latest
    }

    return ok({ copies, latest_versions: latestVersions })
  } catch (err) {
    return errorToResponse(err)
  }
}
