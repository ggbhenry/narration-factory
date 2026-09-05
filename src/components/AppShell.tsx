import type { ReactNode } from 'react'

export type AppPage = 'narrations' | 'presets'

interface AppShellProps {
  page: AppPage
  onNavigate: (page: AppPage) => void
  children: ReactNode
}

export function AppShell({ page, onNavigate, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <span className="app-shell__title">Narration Factory</span>
        <nav className="app-shell__nav-desktop">
          <button
            type="button"
            className={page === 'narrations' ? 'nav-link nav-link--active' : 'nav-link'}
            onClick={() => onNavigate('narrations')}
          >
            Narrações
          </button>
          <button
            type="button"
            className={page === 'presets' ? 'nav-link nav-link--active' : 'nav-link'}
            onClick={() => onNavigate('presets')}
          >
            Presets
          </button>
        </nav>
      </header>

      <main className="app-shell__content">{children}</main>

      <nav className="bottom-nav">
        <button
          type="button"
          className={page === 'narrations' ? 'bottom-nav__item bottom-nav__item--active' : 'bottom-nav__item'}
          onClick={() => onNavigate('narrations')}
        >
          <span className="bottom-nav__icon" aria-hidden>🎙️</span>
          Narrações
        </button>
        <button
          type="button"
          className={page === 'presets' ? 'bottom-nav__item bottom-nav__item--active' : 'bottom-nav__item'}
          onClick={() => onNavigate('presets')}
        >
          <span className="bottom-nav__icon" aria-hidden>🎚️</span>
          Presets
        </button>
      </nav>
    </div>
  )
}
