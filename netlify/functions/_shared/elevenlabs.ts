import { HttpError } from './http.js'
import type { VoiceSettings } from '../../../src/types/index.js'

const ELEVENLABS_TTS_URL = (voiceId: string) =>
  `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`

export interface TtsRequestParams {
  text: string
  voiceId: string
  modelId: string
  settings: VoiceSettings
}

/**
 * Chama a API oficial de Text-to-Speech da ElevenLabs e retorna o
 * áudio MP3 gerado como Buffer.
 *
 * Endpoint: POST /v1/text-to-speech/{voice_id}
 * Header: xi-api-key
 * Body: { text, model_id, voice_settings }
 *
 * "speed" só é enviado se definido, pois nem todos os modelos o
 * suportam (ex: eleven_v3 não suporta o parâmetro speed).
 */
export async function generateSpeech({
  text,
  voiceId,
  modelId,
  settings,
}: TtsRequestParams): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY

  if (!apiKey) {
    throw new HttpError(
      500,
      'ELEVENLABS_API_KEY não está configurada no ambiente da Netlify.',
    )
  }

  const voiceSettings: Record<string, unknown> = {
    stability: settings.stability,
    similarity_boost: settings.similarity_boost,
    style: settings.style,
    use_speaker_boost: settings.use_speaker_boost,
  }

  if (typeof settings.speed === 'number') {
    voiceSettings.speed = settings.speed
  }

  let response: Response
  try {
    response = await fetch(ELEVENLABS_TTS_URL(voiceId), {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: voiceSettings,
      }),
    })
  } catch (networkErr) {
    throw new HttpError(
      502,
      `Falha de rede ao contatar a ElevenLabs: ${
        networkErr instanceof Error ? networkErr.message : String(networkErr)
      }`,
    )
  }

  if (!response.ok) {
    let details = ''
    try {
      const errBody = await response.text()
      details = errBody?.slice(0, 500) ?? ''
    } catch {
      // ignore
    }

    if (response.status === 401) {
      throw new HttpError(
        502,
        'ElevenLabs recusou a chave de API (401). Verifique ELEVENLABS_API_KEY.',
      )
    }
    if (response.status === 422) {
      throw new HttpError(
        400,
        `ElevenLabs rejeitou os parâmetros enviados (422). ${details}`,
      )
    }
    if (response.status === 429) {
      throw new HttpError(
        429,
        'ElevenLabs retornou limite de uso excedido (429). Tente novamente em instantes.',
      )
    }

    throw new HttpError(
      502,
      `ElevenLabs retornou erro ${response.status}. ${details}`,
    )
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
