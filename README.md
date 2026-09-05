# Narration Factory

MVP para automatizar a **Etapa 1** da produção de vídeos para TikTok Shop:
transformar copies em narrações organizadas, versionadas, revisadas e
aprovadas — prontas para a futura etapa de edição de vídeo.

Construído especificamente para **Netlify + Netlify Functions + Netlify
Blobs**. Sem servidor persistente, sem filesystem local, sem Streamlit/Flask.

## Tecnologias

- React 18 + Vite + TypeScript (frontend, mobile-first)
- Netlify Functions (backend serverless, `netlify/functions/`)
- Netlify Blobs (persistência — copies, versões, áudios, presets)
- ElevenLabs API (Text-to-Speech, chamada apenas pelo backend)
- `music-metadata` para calcular a duração do MP3 sem `ffmpeg`

## Estrutura

```text
src/
  components/   componentes de UI (sheets, cards, player, etc.)
  pages/        NarrationsPage (dashboard) e PresetsPage
  hooks/        useCopies, usePresets
  lib/          api client, parser de import, fila de geração, auth local
  types/        tipos compartilhados com as Functions

netlify/
  functions/    uma function por endpoint (list-copies, generate, approve...)
  functions/_shared/  helpers: auth, blobs, elevenlabs, mp3duration, ids, http, validation
  tsconfig.json típecheck local das Functions (a Netlify usa esbuild no deploy)

netlify.toml    build, publish, functions dir, redirects /api/* → functions
.env.example    variáveis necessárias
```

## Configurar variáveis de ambiente

Copie `.env.example` para `.env`:

```bash
cp .env.example .env
```

Preencha:

```env
ELEVENLABS_API_KEY=sua_chave_da_elevenlabs
APP_ACCESS_TOKEN=um_codigo_de_acesso_qualquer
```

- `ELEVENLABS_API_KEY`: nunca é exposta ao frontend — usada somente dentro
  das Netlify Functions.
- `APP_ACCESS_TOKEN`: código simples que protege o app (evita gerar áudio
  sem querer, já que cada geração custa dinheiro na ElevenLabs). O app pede
  esse código na tela inicial e o guarda no `localStorage` do navegador,
  enviando-o em toda chamada via o header `X-App-Token`.

## Rodar localmente

```bash
npm install
npx netlify dev
```

`netlify dev` sobe o Vite (frontend) e emula as Netlify Functions + Netlify
Blobs juntos, com as variáveis do `.env` carregadas automaticamente — é o
jeito recomendado de testar o projeto completo localmente.

Se quiser só o frontend (sem Functions/Blobs funcionando), `npm run dev`
sobe apenas o Vite.

## Build

```bash
npm install
npm run build
```

Isso roda `tsc -b` (checagem de tipos do frontend) e depois `vite build`,
gerando os arquivos estáticos em `dist/`.

As Netlify Functions (`netlify/functions/`) **não** passam por esse `tsc -b`
— a própria Netlify as transpila com esbuild no momento do deploy, então
elas não precisam ser "buildadas" localmente. Para checar os tipos delas
localmente antes de fazer deploy, rode:

```bash
npm run typecheck:functions
```

## Deploy na Netlify

1. Suba o projeto para um repositório Git (GitHub/GitLab/Bitbucket) ou use
   `netlify deploy` diretamente pela CLI.
2. Na Netlify, clique em **Add new site → Import an existing project** e
   conecte o repositório (ou rode `netlify init` pela CLI).
3. O `netlify.toml` já deixa configurado:
   - `command = "npm run build"`
   - `publish = "dist"`
   - `functions = "netlify/functions"`
   - redirects `/api/*` → `/.netlify/functions/*` e fallback de SPA
4. Em **Site settings → Environment variables**, adicione:
   - `ELEVENLABS_API_KEY`
   - `APP_ACCESS_TOKEN`
5. Deploy. Pronto — o app estará em produção, com backend serverless e
   persistência via Netlify Blobs (não precisa criar/configurar o Blob
   Store manualmente: `getStore('narration-mvp')` cria o store
   automaticamente na primeira escrita).

## Como o app funciona (resumo)

1. **Login**: tela pede o `APP_ACCESS_TOKEN`. Ele é validado com uma
   chamada real a uma Function protegida antes de liberar o acesso.
2. **Importar copies**: cole o texto ou envie um `.txt` no formato:

   ```text
   === COPY 009 ===
   PRESET: VENDEDOR

   Texto da copy aqui.
   ```

   Presets múltiplos: `PRESET: VENDEDOR, AGRESSIVO`. A prévia mostra quantas
   copies foram reconhecidas antes de confirmar a importação. IDs já
   existentes são ignorados (nunca sobrescritos silenciosamente).
3. **Presets**: cadastre voz/model/configurações da ElevenLabs. Presets
   incompletos (sem Voice ID/Model ID) bloqueiam a geração com uma mensagem
   clara.
4. **Gerar**: "Gerar todas" ou "Gerar selecionadas" processam a fila —
   copies diferentes em paralelo (2 por vez), mas os presets de uma mesma
   copy sempre em sequência, para nunca colidir na numeração de versão
   (V001, V002...). Um erro em uma copy não trava as demais.
5. **Revisar**: abra a copy, ouça a versão (player autenticado, funciona no
   Safari do iPhone), aprove, rejeite, ou rejeite-e-regenere. Nada é
   apagado — todo o histórico de versões fica preservado.
6. **Editar/Regerar**: ajuste a `copy_tts` (nunca a `copy_original`) e as
   configurações de voz manualmente, gerando uma nova versão sem afetar as
   anteriores. Dá para salvar a configuração ajustada como um novo preset.
7. **Aprovar**: a versão aprovada vira o `master_version_id` da copy, que
   passa a `READY_FOR_EDITING` — pronta para a futura Etapa 2 (edição de
   vídeo), consultável via `GET /api/ready-for-editing`.

## O que foi verificado

- Toda a base de código (frontend + Functions) foi revisada linha a linha,
  com uma checagem de sintaxe TypeScript completa em todos os arquivos, e um
  type-check completo do projeto usando um ambiente com stubs de tipos para
  `react`, `@netlify/blobs`, `@netlify/functions` e `music-metadata` (o
  sandbox onde este projeto foi montado não tem acesso à internet para
  baixar os pacotes reais do npm).
- Os formatos de API usados (endpoint de TTS da ElevenLabs com
  `voice_settings` incluindo `speed`; `@netlify/blobs` com
  `connectLambda`/`getStore`/`onlyIfNew`; `music-metadata` `parseBuffer`)
  foram conferidos contra a documentação/páginas oficiais atuais no momento
  da entrega.

**Importante**: o `npm install` e o `npm run build` reais (com os pacotes
de verdade) **não puderam ser executados neste ambiente por falta de
acesso à internet**. Rode os dois comandos localmente antes do primeiro
deploy — se aparecer algum erro de tipos ou de import, me avise com a
mensagem de erro que eu ajusto.

## Limitações reais do MVP

- Usuário único (sem múltiplos usuários/times), sem billing.
- Se uma geração travar exatamente entre a "reserva" do número de versão e
  a resposta da ElevenLabs (ex: timeout da function), pode sobrar uma
  versão com status `GENERATING` incompleta no histórico — raro, mas
  possível; nesse caso, gere novamente (uma nova versão é sempre criada, o
  histórico incompleto só fica visível, sem ser usado como master).
- O parser de importação segue o formato `=== COPY ID ===` /
  `PRESET: ...` descrito no briefing; formatos muito diferentes disso não
  serão reconhecidos (os erros de parsing aparecem na prévia antes de
  importar).
- Sem edição de vídeo (fora de escopo desta etapa, por design).
