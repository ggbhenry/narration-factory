// Helpers de identificadores e chaves de armazenamento.
// Mantém as chaves do Blob Storage sempre seguras (sem path
// traversal, sem caracteres inválidos).

/**
 * Converte um copy_id ou preset_id livre (ex: "COPY 009") em um
 * "slug" seguro para uso como parte de uma chave do Blob Storage.
 * Mantém apenas letras, números, hífen e underscore.
 */
export function slugify(raw: string): string {
  const trimmed = (raw ?? '').trim()
  const slug = trimmed
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug
}

export function isValidSlug(slug: string): boolean {
  return /^[A-Z0-9][A-Z0-9-]{0,80}$/.test(slug)
}

export function copyKey(copySlug: string): string {
  return `copies/${copySlug}.json`
}

export function versionKey(copySlug: string, versionId: string): string {
  return `versions/${copySlug}/${versionId}.json`
}

export function versionPrefix(copySlug: string): string {
  return `versions/${copySlug}/`
}

export function audioKey(copySlug: string, versionId: string): string {
  return `audio/${copySlug}/${versionId}.mp3`
}

export function presetKey(presetSlug: string): string {
  return `presets/${presetSlug}.json`
}

/** Formata um número de versão sequencial como "V001", "V002", ... */
export function formatVersionId(n: number): string {
  return `V${String(n).padStart(3, '0')}`
}

/** Extrai o número de uma versão no formato "V001" -> 1. Retorna 0 se não reconhecer. */
export function parseVersionNumber(versionId: string): number {
  const match = /^V(\d+)$/.exec(versionId)
  return match ? parseInt(match[1], 10) : 0
}

export function nowIso(): string {
  return new Date().toISOString()
}
