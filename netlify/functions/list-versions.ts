import type { Handler } from '@netlify/functions'
import { requireAppToken } from './_shared/auth.js'
import { getJSON, initBlobs, listBlobKeys } from './_shared/blobs.js'
import { badRequest, errorToResponse, methodNotAllowed, ok } from './_shared/http.js'
import { parseVersionNumber, slugify, versionPrefix } from './_shared/ids.js'
import type { NarrationVersion } from '../../src/types/index.js'

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') return methodNotAllowed()

    initBlobs(event)
    requireAppToken(event)

    const copyId = event.queryStringParameters?.copy_id
    if (!copyId) return badRequest('Parâmetro copy_id é obrigatório.')

    const slug = slugify(copyId)
    const keys = await listBlobKeys(versionPrefix(slug))

    const versions: NarrationVersion[] = []
    for (const key of keys) {
      const version = await getJSON<NarrationVersion>(key)
      if (version) versions.push(version)
    }

    versions.sort((a, b) => parseVersionNumber(b.version_id) - parseVersionNumber(a.version_id))

    return ok({ versions })
  } catch (err) {
    return errorToResponse(err)
  }
}
