import { parseBuffer } from 'music-metadata'

/**
 * Calcula a duração (em segundos) de um Buffer MP3 sem depender de
 * ffmpeg ou qualquer binário externo — usa a biblioteca pura
 * JavaScript "music-metadata" para ler os cabeçalhos do arquivo.
 * Retorna o valor arredondado para 1 casa decimal, ou null se a
 * duração não puder ser determinada.
 */
export async function getMp3DurationSeconds(buffer: Buffer): Promise<number | null> {
  try {
    const metadata = await parseBuffer(buffer, { mimeType: 'audio/mpeg' })
    const duration = metadata.format.duration
    if (typeof duration === 'number' && Number.isFinite(duration)) {
      return Math.round(duration * 10) / 10
    }
    return null
  } catch {
    return null
  }
}
