import type { ReactNode } from 'react'
import { CTAButton } from './CTAButton'
import { AppLink } from './AppLink'
import { HUB_NAV_ITEMS, SITE_NAME, type Route } from '../router'
import type { ProgressionState } from '../progression'
import { getDailyCompletion, getDailyRefreshCountdown, getLevelProgress } from '../progression'

type DashboardShellProps = {
  route: Route
  navigate: (route: Route) => void
  progression: ProgressionState
  title: string
  description: string
  children: ReactNode
  actions?: ReactNode
}

const SUPPORT_LINKS: Array<{ href: Route; label: string }> = [
  { href: '/guide', label: 'Guide' },
  { href: '/updates', label: 'Updates' },
  { href: '/support', label: 'Support' },
  { href: '/privacy', label: 'Privacy' },
]

function SidebarIcon({ route }: { route: string }) {
  switch (route) {
    case '/play':
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.14v13.72a1 1 0 0 0 1.53.85l10-6.86a1 1 0 0 0 0-1.7l-10-6.86A1 1 0 0 0 8 5.14Z" /></svg>
    case '/garden':
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c1.66 0 3 1.79 3 4 0 1.16-.37 2.21-.96 2.94 2.53.3 4.46 2.21 4.46 4.56C18.5 17.54 15.59 20 12 20s-6.5-2.46-6.5-5.5c0-2.35 1.93-4.26 4.46-4.56A4.84 4.84 0 0 1 9 7c0-2.21 1.34-4 3-4Z" /></svg>
    case '/market':
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5 6 4h12l2 3.5V10a3 3 0 0 1-3 3h-1v7H8v-7H7a3 3 0 0 1-3-3V7.5Zm4.15-1.5-1.1 2h9.9l-1.1-2H8.15Z" /></svg>
    case '/rankings':
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 20H4V10h3v10Zm6 0h-3V4h3v16Zm6 0h-3v-8h3v8Z" /></svg>
    default:
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 4 10.2V20h5v-5h6v5h5v-9.8L12 4Z" /></svg>
  }
}

export function DashboardShell({ route, navigate, progression, title, actions, children }: DashboardShellProps) {
  const level = getLevelProgress(progression)
  const daily = getDailyCompletion(progression)
  const dailyRefreshLabel = getDailyRefreshCountdown()

  return (
    <div className="garden-dashboard">
      <aside className="garden-dashboard__sidebar">
        <div className="garden-sidebar__brand">
          <span className="garden-sidebar__eyebrow">Velvet Garden</span>
          <strong>{SITE_NAME}</strong>
          <p>Lv.{progression.level}</p>
        </div>

        <div className="garden-sidebar__level card">
          <div className="garden-sidebar__level-copy">
            <span className="hud-label">Level</span>
            <strong>Lv.{progression.level}</strong>
          </div>
          <div className="garden-progress">
            <div className="garden-progress__fill" style={{ width: Math.max(level.progress * 100, 6) + '%' }} />
          </div>
          <div className="garden-sidebar__level-stats">
            <span>{level.remainingXp} XP</span>
            <span>{progression.emeralds}◆</span>
          </div>
        </div>

        <nav className="garden-sidebar__nav" aria-label="Hub navigation">
          {HUB_NAV_ITEMS.map((item) => (
            <AppLink
              key={item.href}
              href={item.href}
              navigate={navigate}
              className={route === item.href ? 'garden-sidebar__link is-active' : 'garden-sidebar__link'}
            >
              <SidebarIcon route={item.href} />
              <span>{item.label}</span>
            </AppLink>
          ))}
        </nav>

        <div className="garden-sidebar__footer">
          <div className="garden-sidebar__mini-card card garden-sidebar__mini-card--visual">
            <span className="hud-label">Daily</span>
            <strong>{daily.completed} / {daily.total}</strong>
            <div className="garden-sidebar__mini-stats">
              <span>{dailyRefreshLabel}</span>
              <span>◆ loop</span>
            </div>
          </div>
          <div className="garden-sidebar__link-row">
            {SUPPORT_LINKS.map((item) => (
              <AppLink key={item.href} href={item.href} navigate={navigate} className="garden-sidebar__text-link">
                {item.label}
              </AppLink>
            ))}
          </div>
          <CTAButton label="Play Now" href="/play#game" navigate={navigate} size="large" block />
        </div>
      </aside>

      <div className="garden-dashboard__main">
        <header className="garden-dashboard__topbar">
          <div>
            <p className="section-title__eyebrow">Garden Hub</p>
            <h1>{title}</h1>
          </div>
          <div className="garden-topbar__actions">
            <div className="garden-currency-pill">
              <span className="garden-currency-pill__icon">◆</span>
              <strong>{progression.emeralds}</strong>
              <span>Emeralds</span>
            </div>
            <div className="garden-topbar__icon-row">
              <button className="garden-icon-button" type="button" aria-label="Notifications">•</button>
              <button className="garden-icon-button" type="button" aria-label="Settings">⚙</button>
              <button className="garden-profile-pill" type="button" aria-label="Profile">VG</button>
            </div>
          </div>
        </header>

        {actions ? <div className="garden-dashboard__actions">{actions}</div> : null}
        <div className="garden-dashboard__content">{children}</div>
      </div>
    </div>
  )
}
