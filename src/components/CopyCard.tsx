import { StatusBadge } from './StatusBadge.js'
import type { CopyJobStatus } from '../lib/generationQueue.js'
import type { CopyRecord, NarrationVersion } from '../types/index.js'

interface CopyCardProps {
  copy: CopyRecord
  latestVersion: NarrationVersion | null
  selected: boolean
  onToggleSelect: () => void
  onOpen: () => void
  queueStatus?: CopyJobStatus
}

export function CopyCard({ copy, latestVersion, selected, onToggleSelect, onOpen, queueStatus }: CopyCardProps) {
  const hasReviewableVersion = copy.status === 'READY_FOR_REVIEW' || copy.status === 'READY_FOR_EDITING'
  const isBusy = copy.status === 'GENERATING' || queueStatus === 'generating' || queueStatus === 'queued'

  return (
    <div className={`copy-card${isBusy ? ' copy-card--busy' : ''}`}>
      <div className="copy-card__select">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          aria-label={`Selecionar ${copy.copy_id}`}
        />
      </div>

      <div className="copy-card__main" onClick={onOpen}>
        <div className="copy-card__top">
          <span className="copy-card__id">{copy.copy_id}</span>
          <StatusBadge status={copy.status} />
        </div>

        <div className="copy-card__presets">{copy.requested_presets.join(' + ')}</div>

        <p className="copy-card__snippet">{copy.copy_original.slice(0, 90)}{copy.copy_original.length > 90 ? '…' : ''}</p>

        <div className="copy-card__footer">
          {latestVersion && (
            <span className="copy-card__version">
              Última: {latestVersion.version_id}
              {typeof latestVersion.duration_seconds === 'number' ? ` · ${latestVersion.duration_seconds.toFixed(1)}s` : ''}
            </span>
          )}
          {queueStatus === 'queued' && <span className="copy-card__queue-tag">Na fila</span>}
          {queueStatus === 'generating' && <span className="copy-card__queue-tag copy-card__queue-tag--active">Gerando…</span>}
          {queueStatus === 'error' && <span className="copy-card__queue-tag copy-card__queue-tag--error">Erro no lote</span>}
        </div>
      </div>

      <div className="copy-card__action">
        <button type="button" className={`btn ${hasReviewableVersion ? 'btn--primary' : 'btn--outline'} btn--block`} onClick={onOpen}>
          {hasReviewableVersion ? 'Ouvir / Revisar' : copy.status === 'ERROR' ? 'Tentar novamente' : 'Gerar'}
        </button>
      </div>
    </div>
  )
}
