import type { ParsedCopyBlock } from '../types/index.js'

export interface ParseCopiesResult {
  blocks: ParsedCopyBlock[]
  errors: string[]
}

/**
 * Parser tolerante do formato de importação de copies:
 *
 * === COPY 009 ===
 * PRESET: VENDEDOR
 *
 * Texto da copy aqui.
 *
 * Aceita múltiplos "=" no cabeçalho, espaços extras, linhas vazias
 * entre blocos, e "PRESET"/"PRESETS" (singular ou plural).
 * Presets múltiplos são separados por vírgula.
 */
export function parseCopiesText(raw: string): ParseCopiesResult {
  const errors: string[] = []
  const blocks: ParsedCopyBlock[] = []

  if (!raw || !raw.trim()) {
    return { blocks, errors: ['O texto importado está vazio.'] }
  }

  const headerRegex = /^[ \t]*=+[ \t]*(.+?)[ \t]*=+[ \t]*$/gm
  const headers: { id: string; start: number; end: number }[] = []
  let match: RegExpExecArray | null
  // eslint-disable-next-line no-cond-assign
  while ((match = headerRegex.exec(raw)) !== null) {
    headers.push({ id: match[1].trim(), start: match.index, end: match.index + match[0].length })
  }

  if (headers.length === 0) {
    errors.push('Nenhum bloco "=== COPY ID ===" foi encontrado no texto colado/importado.')
    return { blocks, errors }
  }

  const seenIds = new Set<string>()

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i]
    const bodyStart = header.end
    const bodyEnd = i + 1 < headers.length ? headers[i + 1].start : raw.length
    const bodyRaw = raw.slice(bodyStart, bodyEnd)

    if (!header.id) {
      errors.push(`Encontrado um cabeçalho "===...===" sem identificador de copy (posição ~${header.start}).`)
      continue
    }

    const lines = bodyRaw.split(/\r?\n/)
    let idx = 0
    while (idx < lines.length && lines[idx].trim() === '') idx++

    let presets: string[] = []
    const presetLineMatch = idx < lines.length ? /^PRESETS?\s*:\s*(.+)$/i.exec(lines[idx].trim()) : null
    if (presetLineMatch) {
      presets = presetLineMatch[1]
        .split(',')
        .map((p) => p.trim().toUpperCase())
        .filter(Boolean)
      idx++
    }

    while (idx < lines.length && lines[idx].trim() === '') idx++

    const text = lines.slice(idx).join('\n').trim()

    if (seenIds.has(header.id)) {
      errors.push(`Copy "${header.id}" aparece duplicada dentro do próprio arquivo importado — apenas a primeira ocorrência será considerada.`)
      continue
    }

    if (presets.length === 0) {
      errors.push(`Copy "${header.id}" não possui uma linha "PRESET:" válida.`)
      continue
    }

    if (!text) {
      errors.push(`Copy "${header.id}" está sem texto de narração.`)
      continue
    }

    seenIds.add(header.id)
    blocks.push({ copy_id: header.id, presets, text })
  }

  return { blocks, errors }
}
