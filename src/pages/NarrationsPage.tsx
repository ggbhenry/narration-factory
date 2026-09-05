import { useMemo, useState } from 'react'
import { useCopies } from '../hooks/useCopies.js'
import { usePresets } from '../hooks/usePresets.js'
import { apiPost } from '../lib/api.js'
import { runGenerationQueue } from '../lib/generationQueue.js'
import type { CopyJobStatus } from '../lib/generationQueue.js'
import { BatchToolbar } from '../components/BatchToolbar.js'
import { CopyCard } from '../components/CopyCard.js'
import { ImportCopiesSheet } from '../components/ImportCopiesSheet.js'
import { QueueProgress } from '../components/QueueProgress.js'
import { ReviewSheet } from '../components/ReviewSheet.js'
import { useToast } from '../components/Toast.js'
import type { CopyRecord } from '../types/index.js'

const GENERATABLE_STATUSES = new Set<CopyRecord['status']>(['IMPORTED', 'ERROR'])

export function NarrationsPage() {
  const { copies, latestVersions, loading, error, refresh } = useCopies()
  const { presets } = usePresets()
  const { showToast } = useToast()

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [importOpen, setImportOpen] = useState(false)
  const [reviewCopyId, setReviewCopyId] = useState<string | null>(null)

  const [queueOpen, setQueueOpen] = useState(false)
  const [queueBusy, setQueueBusy] = useState(false)
  const [queueStatuses, setQueueStatuses] = useState<Record<string, CopyJobStatus>>({})
  const [queueErrors, setQueueErrors] = useState<Record<string, string>>({})

  const counts = useMemo(() => {
    const c = { total: copies.length, aguardando: 0, gerando: 0, paraRevisar: 0, aprovadas: 0, erros: 0 }
    for (const copy of copies) {
      if (copy.status === 'IMPORTED' || copy.status === 'QUEUED') c.aguardando++
      else if (copy.status === 'GENERATING') c.gerando++
      else if (copy.status === 'READY_FOR_REVIEW') c.paraRevisar++
      else if (copy.status === 'READY_FOR_EDITING') c.aprovadas++
      else if (copy.status === 'ERROR') c.erros++
    }
    return c
  }, [copies])

  const generatableCopies = useMemo(() => copies.filter((c) => GENERATABLE_STATUSES.has(c.status)), [copies])

  function toggleSelect(copyId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(copyId)) next.delete(copyId)
      else next.add(copyId)
      return next
    })
  }

  async function runBatch(targetCopies: CopyRecord[]) {
    if (targetCopies.length === 0) {
      showToast('Nenhuma copy elegível para gerar (precisa estar Importada ou com Erro).', 'error')
      return
    }

    const jobsByCopy = new Map<string, string[]>()
    for (const copy of targetCopies) {
      jobsByCopy.set(copy.copy_id, copy.requested_presets.length > 0 ? copy.requested_presets : [''])
    }

    const initialStatuses: Record<string, CopyJobStatus> = {}
    targetCopies.forEach((c) => (initialStatuses[c.copy_id] = 'queued'))
    setQueueStatuses(initialStatuses)
    setQueueErrors({})
    setQueueOpen(true)
    setQueueBusy(true)

    await runGenerationQueue({
      jobsByCopy,
      concurrency: 2,
      onCopyStatus: (copyId, status, errorMessage) => {
        setQueueStatuses((prev) => ({ ...prev, [copyId]: status }))
        if (status === 'error' && errorMessage) {
          setQueueErrors((prev) => ({ ...prev, [copyId]: errorMessage }))
        }
      },
      generateOne: async (copyId, presetId) => {
        await apiPost('generate', { copy_id: copyId, preset_id: presetId || null })
      },
    })

    setQueueBusy(false)
    await refresh()
  }

  function handleGenerateAll() {
    runBatch(generatableCopies)
  }

  function handleGenerateSelected() {
    const targets = copies.filter((c) => selectedIds.has(c.copy_id) && GENERATABLE_STATUSES.has(c.status))
    const skippedCount = selectedIds.size - targets.length
    if (skippedCount > 0) {
      showToast(`${skippedCount} copy(ies) selecionada(s) ignorada(s) — já revisadas ou aprovadas.`, 'info')
    }
    runBatch(targets)
  }

  function handleCardOpen(copy: CopyRecord) {
    const hasReviewable = copy.status === 'READY_FOR_REVIEW' || copy.status === 'READY_FOR_EDITING'
    if (hasReviewable) {
      setReviewCopyId(copy.copy_id)
    } else {
      runBatch([copy])
    }
  }

  const reviewCopy = copies.find((c) => c.copy_id === reviewCopyId) ?? null

  return (
    <div className="narrations-page">
      <h1 className="page-title">Narrações</h1>

      <div className="stats-grid">
        <Stat label="Total" value={counts.total} />
        <Stat label="Aguardando" value={counts.aguardando} />
        <Stat label="Gerando" value={counts.gerando} />
        <Stat label="Para revisar" value={counts.paraRevisar} />
        <Stat label="Aprovadas" value={counts.aprovadas} />
        <Stat label="Erros" value={counts.erros} tone={counts.erros > 0 ? 'error' : undefined} />
      </div>

      {loading && <p className="muted">Carregando copies…</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && copies.length === 0 && (
        <div className="empty-state">
          <p>Nenhuma copy importada ainda.</p>
          <button type="button" className="btn btn--primary" onClick={() => setImportOpen(true)}>
            Importar copies
          </button>
        </div>
      )}

      <div className="copy-list">
        {copies.map((copy) => (
          <CopyCard
            key={copy.copy_id}
            copy={copy}
            latestVersion={latestVersions[copy.copy_id] ?? null}
            selected={selectedIds.has(copy.copy_id)}
            onToggleSelect={() => toggleSelect(copy.copy_id)}
            onOpen={() => handleCardOpen(copy)}
            queueStatus={queueStatuses[copy.copy_id]}
          />
        ))}
      </div>

      <BatchToolbar
        selectedCount={selectedIds.size}
        totalGeneratable={generatableCopies.length}
        busy={queueBusy}
        onImport={() => setImportOpen(true)}
        onGenerateAll={handleGenerateAll}
        onGenerateSelected={handleGenerateSelected}
      />

      {importOpen && (
        <ImportCopiesSheet
          onClose={() => setImportOpen(false)}
          onImported={() => {
            refresh()
          }}
        />
      )}

      {queueOpen && (
        <QueueProgress
          statuses={queueStatuses}
          errors={queueErrors}
          onClose={() => setQueueOpen(false)}
        />
      )}

      {reviewCopy && (
        <ReviewSheet
          copy={reviewCopy}
          presets={presets}
          onClose={() => setReviewCopyId(null)}
          onChanged={refresh}
        />
      )}
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'error' }) {
  return (
    <div className={`stat${tone === 'error' && value > 0 ? ' stat--error' : ''}`}>
      <span className="stat__value">{value}</span>
      <span className="stat__label">{label}</span>
    </div>
  )
}
