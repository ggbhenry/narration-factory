import type { CopyStatus, VersionStatus } from '../types/index.js'

const COPY_LABELS: Record<CopyStatus, string> = {
  IMPORTED: 'Importada',
  QUEUED: 'Na fila',
  GENERATING: 'Gerando…',
  READY_FOR_REVIEW: 'Pronta p/ revisão',
  READY_FOR_EDITING: 'Aprovada',
  ERROR: 'Erro',
}

const VERSION_LABELS: Record<VersionStatus, string> = {
  GENERATED: 'Gerada',
  REJECTED: 'Rejeitada',
  APPROVED: 'Aprovada',
  ERROR: 'Erro',
}

const TONE_CLASS: Record<string, string> = {
  IMPORTED: 'badge--neutral',
  QUEUED: 'badge--neutral',
  GENERATING: 'badge--pending',
  READY_FOR_REVIEW: 'badge--info',
  READY_FOR_EDITING: 'badge--success',
  ERROR: 'badge--error',
  GENERATED: 'badge--info',
  REJECTED: 'badge--error',
  APPROVED: 'badge--success',
}

export function StatusBadge({ status }: { status: CopyStatus | VersionStatus }) {
  const label = (COPY_LABELS as Record<string, string>)[status] ?? (VERSION_LABELS as Record<string, string>)[status] ?? status
  const tone = TONE_CLASS[status] ?? 'badge--neutral'
  return <span className={`badge ${tone}`}>{label}</span>
}
