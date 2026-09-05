import { connectLambda, getStore } from '@netlify/blobs'
import type { HandlerEvent } from '@netlify/functions'

const STORE_NAME = 'narration-mvp'

/**
 * Deve ser chamado no início de cada Function, antes de qualquer
 * acesso ao Blob Storage. Necessário porque as Netlify Functions
 * rodam em modo de compatibilidade Lambda, onde o contexto do
 * Blobs não é configurado automaticamente.
 */
export function initBlobs(event: HandlerEvent): void {
  connectLambda(event)
}

export function narrationStore() {
  return getStore(STORE_NAME)
}

export async function getJSON<T>(key: string): Promise<T | null> {
  const value = await narrationStore().get(key, { type: 'json' })
  return (value as T | null) ?? null
}

export async function setJSON(key: string, value: unknown): Promise<void> {
  await narrationStore().setJSON(key, value)
}

export async function deleteBlob(key: string): Promise<void> {
  await narrationStore().delete(key)
}

export async function listBlobKeys(prefix: string): Promise<string[]> {
  const { blobs } = await narrationStore().list({ prefix })
  return blobs.map((b) => b.key)
}

export async function setBinary(key: string, data: Buffer): Promise<void> {
  await narrationStore().set(key, data)
}

export async function getBinary(key: string): Promise<ArrayBuffer | null> {
  const value = await narrationStore().get(key, { type: 'arrayBuffer' })
  return value ?? null
}

/**
 * Escreve uma chave garantindo que ela ainda não existe (evita
 * colisão de numeração de versões quando duas gerações concorrentes
 * tentam usar o mesmo V00X). Retorna true se a escrita foi aceita.
 */
export async function setJSONIfNew(key: string, value: unknown): Promise<boolean> {
  const result = await narrationStore().setJSON(key, value, { onlyIfNew: true })
  // A tipagem do @netlify/blobs retorna { modified: boolean } | null
  if (result && typeof result === 'object' && 'modified' in result) {
    return Boolean((result as { modified: boolean }).modified)
  }
  return true
}
