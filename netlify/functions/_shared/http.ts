import type { HandlerResponse } from '@netlify/functions'

const BASE_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
}

export function json(statusCode: number, body: unknown): HandlerResponse {
  return {
    statusCode,
    headers: BASE_HEADERS,
    body: JSON.stringify(body),
  }
}

export function ok(body: unknown): HandlerResponse {
  return json(200, body)
}

export function badRequest(message: string): HandlerResponse {
  return json(400, { error: message })
}

export function unauthorized(message = 'Código de acesso inválido.'): HandlerResponse {
  return json(401, { error: message })
}

export function notFound(message: string): HandlerResponse {
  return json(404, { error: message })
}

export function methodNotAllowed(): HandlerResponse {
  return json(405, { error: 'Método não permitido.' })
}

export function serverError(message: string): HandlerResponse {
  return json(500, { error: message })
}

/** Classe de erro que carrega um status HTTP, para ser tratada de forma uniforme nos handlers. */
export class HttpError extends Error {
  statusCode: number
  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
  }
}

export function errorToResponse(err: unknown): HandlerResponse {
  if (err instanceof HttpError) {
    return json(err.statusCode, { error: err.message })
  }
  const message = err instanceof Error ? err.message : 'Erro desconhecido.'
  // eslint-disable-next-line no-console
  console.error('[narration-factory] erro não tratado:', err)
  return serverError(message || 'Erro interno do servidor.')
}
