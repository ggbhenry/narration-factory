import type { Handler } from '@netlify/functions'
import { requireAppToken } from './_shared/auth.js'
import { getBinary, initBlobs } from './_shared/blobs.js'
import { badRequest, errorToResponse, methodNotAllowed, notFound } from './_shared/http.js'
import { audioKey, slugify } from './_shared/ids.js'

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') return methodNotAllowed()

    initBlobs(event)
    requireAppToken(event)

    const copyId = event.queryStringParameters?.copy_id
    const versionId = event.queryStringParameters?.version_id
    if (!copyId || !versionId) {
      return badRequest('Parâmetros copy_id e version_id são obrigatórios.')
    }

    const slug = slugify(copyId)
    const key = audioKey(slug, versionId)
    const buffer = await getBinary(key)

    if (!buffer) return notFound('Áudio não encontrado.')

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=3600',
      },
      body: Buffer.from(buffer).toString('base64'),
      isBase64Encoded: true,
    }
  } catch (err) {
    return errorToResponse(err)
  }
}
