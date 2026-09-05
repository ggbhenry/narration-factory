import type { HandlerEvent } from '@netlify/functions'
import { HttpError } from './http.js'

/**
 * Verifica o header "X-App-Token" contra a variável de ambiente
 * server-side APP_ACCESS_TOKEN. Lança HttpError(401) se inválido,
 * e HttpError(500) se a variável não estiver configurada no
 * ambiente da Netlify.
 */
export function requireAppToken(event: HandlerEvent): void {
  const expected = process.env.APP_ACCESS_TOKEN

  if (!expected) {
    throw new HttpError(
      500,
      'APP_ACCESS_TOKEN não está configurada no ambiente da Netlify.',
    )
  }

  const provided =
    event.headers['x-app-token'] ?? event.headers['X-App-Token'] ?? ''

  if (!provided || provided !== expected) {
    throw new HttpError(401, 'Código de acesso inválido.')
  }
}
