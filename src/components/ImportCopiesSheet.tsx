import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { apiPost } from '../lib/api.js'
import { parseCopiesText } from '../lib/parseCopies.js'
import { useToast } from './Toast.js'
import type { CopyRecord, ImportCopiesResponse } from '../types/index.js'

interface ImportCopiesSheetProps {
  onClose: () => void
  onImported: () => void
}

export function ImportCopiesSheet({ onClose, onImported }: ImportCopiesSheetProps) {
  const { showToast } = useToast()
  const [rawText, setRawText] = useState('')
  const [busy, setBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const { blocks, errors } = parseCopiesText(rawText)

  function handleFilePicked(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setRawText(String(reader.result ?? ''))
    }
    reader.readAsText(file, 'utf-8')
  }

  async function handleImport() {
    if (blocks.length === 0) {
      showToast('Nenhuma copy válida para importar.', 'error')
      return
    }
    setBusy(true)
    try {
      const res = await apiPost<ImportCopiesResponse>('import-copies', { raw_text: rawText })
      const importedCount = res.imported.length
      const skippedCount = res.skipped.length
      if (importedCount > 0) {
        showToast(
          `${importedCount} copy(ies) importada(s).${skippedCount > 0 ? ` ${skippedCount} ignorada(s).` : ''}`,
          'success',
        )
        onImported()
        onClose()
      } else {
        showToast(`Nenhuma copy foi importada. ${res.skipped.map((s) => s.reason).join(' ')}`, 'error')
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao importar copies.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true">
      <div className="sheet sheet--full">
        <div className="sheet__header">
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
          <h2>Importar copies</h2>
        </div>

        <div className="sheet__body">
          <section>
            <label className="field">
              <span>Arquivo .txt</span>
              <input ref={fileInputRef} type="file" accept=".txt,text/plain" onChange={handleFilePicked} />
            </label>

            <label className="field">
              <span>Ou cole o texto diretamente</span>
              <textarea
                className="textarea"
                rows={10}
                placeholder={'=== COPY 009 ===\nPRESET: VENDEDOR\n\nTexto da copy aqui.'}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
            </label>
          </section>

          {rawText.trim().length > 0 && (
            <section>
              <h3>
                {blocks.length} {blocks.length === 1 ? 'copy encontrada' : 'copies encontradas'}
              </h3>
              <ul className="import-preview-list">
                {blocks.map((b) => (
                  <li key={b.copy_id}>
                    <strong>{b.copy_id}</strong> — {b.presets.join(' + ')}
                  </li>
                ))}
              </ul>
              {errors.length > 0 && (
                <div className="import-preview-errors">
                  {errors.map((e, i) => (
                    <p key={i} className="error-text">
                      {e}
                    </p>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <div className="sheet__footer">
          <button type="button" className="btn btn--secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="btn btn--primary" disabled={busy || blocks.length === 0} onClick={handleImport}>
            {busy ? 'Importando…' : `Importar ${blocks.length || ''} ${blocks.length === 1 ? 'copy' : 'copies'}`}
          </button>
        </div>
      </div>
    </div>
  )
}
