export type CopyJobStatus = 'queued' | 'generating' | 'done' | 'error'

interface RunQueueOptions {
  /** copy_id -> lista ordenada de preset_ids a gerar sequencialmente para essa copy */
  jobsByCopy: Map<string, string[]>
  /** número de copies processadas em paralelo (presets da mesma copy são sempre sequenciais) */
  concurrency?: number
  onCopyStatus: (copyId: string, status: CopyJobStatus, errorMessage?: string) => void
  generateOne: (copyId: string, presetId: string) => Promise<void>
}

/**
 * Processa a fila de geração em lote:
 * - Copies diferentes podem rodar em paralelo (limitado por `concurrency`).
 * - Presets diferentes da MESMA copy são sempre processados em sequência,
 *   para nunca colidir na numeração de versões (V001, V002...).
 * - Um erro em uma copy não interrompe as demais.
 */
export async function runGenerationQueue({
  jobsByCopy,
  concurrency = 2,
  onCopyStatus,
  generateOne,
}: RunQueueOptions): Promise<void> {
  const copyIds = Array.from(jobsByCopy.keys())
  copyIds.forEach((id) => onCopyStatus(id, 'queued'))

  let cursor = 0

  async function worker(): Promise<void> {
    while (cursor < copyIds.length) {
      const myIndex = cursor
      cursor += 1
      const copyId = copyIds[myIndex]
      const presetIds = jobsByCopy.get(copyId) ?? []

      onCopyStatus(copyId, 'generating')
      try {
        for (const presetId of presetIds) {
          // Sequencial de propósito: nunca gerar dois presets da mesma copy ao mesmo tempo.
          // eslint-disable-next-line no-await-in-loop
          await generateOne(copyId, presetId)
        }
        onCopyStatus(copyId, 'done')
      } catch (err) {
        onCopyStatus(copyId, 'error', err instanceof Error ? err.message : 'Erro desconhecido.')
      }
    }
  }

  const workerCount = Math.max(1, Math.min(concurrency, copyIds.length))
  await Promise.all(Array.from({ length: workerCount }, () => worker()))
}
