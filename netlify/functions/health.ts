import type { Handler } from '@netlify/functions'
import { ok } from './_shared/http.js'

export const handler: Handler = async () => {
  return ok({
    status: 'ok',
    app_access_token_configured: Boolean(process.env.APP_ACCESS_TOKEN),
    elevenlabs_key_configured: Boolean(process.env.ELEVENLABS_API_KEY),
  })
}
