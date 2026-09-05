interface BatchToolbarProps {
  selectedCount: number
  totalGeneratable: number
  busy: boolean
  onImport: () => void
  onGenerateAll: () => void
  onGenerateSelected: () => void
}

export function BatchToolbar({
  selectedCount,
  totalGeneratable,
  busy,
  onImport,
  onGenerateAll,
  onGenerateSelected,
}: BatchToolbarProps) {
  return (
    <div className="batch-toolbar">
      <button type="button" className="btn btn--outline" onClick={onImport} disabled={busy}>
        Importar copies
      </button>
      <button type="button" className="btn btn--secondary" onClick={onGenerateAll} disabled={busy || totalGeneratable === 0}>
        Gerar todas ({totalGeneratable})
      </button>
      <button
        type="button"
        className="btn btn--primary"
        onClick={onGenerateSelected}
        disabled={busy || selectedCount === 0}
      >
        Gerar selecionadas ({selectedCount})
      </button>
    </div>
  )
}
