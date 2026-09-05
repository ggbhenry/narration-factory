import { StatusBadge } from './StatusBadge.js'
import type { CopyRecord, NarrationVersion } from '../types/index.js'

interface VersionHistoryProps {
  copy: CopyRecord
  versions: NarrationVersion[]
  selectedVersionId: string | null
  onSelect: (versionId: string) => void
}

export function VersionHistory({ copy, versions, selectedVersionId, onSelect }: VersionHistoryProps) {
  if (versions.length === 0) {
    return <p className="muted">Nenhuma versão gerada ainda.</p>
  }

  return (
    <ul className="version-history">
      {versions.map((v) => {
        const isMaster = copy.master_version_id === v.version_id
        const isSelected = selectedVersionId === v.version_id
        return (
          <li key={v.version_id}>
            <button
              type="button"
              className={`version-history__item${isSelected ? ' version-history__item--selected' : ''}`}
              onClick={() => onSelect(v.version_id)}
            >
              <div className="version-history__top">
                <strong>{v.version_id}</strong>
                {isMaster && <span className="badge badge--success">MASTER</span>}
                <StatusBadge status={v.status} />
              </div>
              <div className="version-history__meta">
                {v.preset_id ? <span>Preset: {v.preset_id}</span> : <span>Preset: manual</span>}
                {typeof v.duration_seconds === 'number' && <span>{v.duration_seconds.toFixed(1)}s</span>}
              </div>
              {v.error_message && <div className="version-history__error">{v.error_message}</div>}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
