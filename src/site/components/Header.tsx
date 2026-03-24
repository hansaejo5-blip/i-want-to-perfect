import { NAV_ITEMS, SITE_NAME, type Route } from '../router'
import { CTAButton } from './CTAButton'
import { AppLink } from './AppLink'
import { ITCH_URL } from '../router'

type HeaderProps = {
  route: Route
  navigate: (route: Route) => void
}

export function Header({ route, navigate }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <AppLink href="/" className="site-brand" navigate={navigate} ariaLabel={`${SITE_NAME} home`}>
          <span className="site-brand__eyebrow">Garden Browser Game</span>
          <strong>{SITE_NAME}</strong>
        </AppLink>
        <nav className="site-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <AppLink key={item.href} href={item.href} className={route === item.href ? 'site-nav__link is-active' : 'site-nav__link'} navigate={navigate}>
              {item.label}
            </AppLink>
          ))}
        </nav>
        <div className="site-header__actions">
          <CTAButton label="Play Now" href="/play#game" navigate={navigate} />
          <CTAButton label="itch.io" href={ITCH_URL} navigate={navigate} variant="ghost" target="_blank" rel="noreferrer" />
        </div>
      </div>
    </header>
  )
}
