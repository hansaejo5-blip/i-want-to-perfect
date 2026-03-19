import { SITE_NAME, ITCH_URL, type Route } from '../router'
import { AppLink } from './AppLink'

type FooterProps = {
  navigate: (route: Route) => void
}

export function Footer({ navigate }: FooterProps) {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <p className="site-footer__title">{SITE_NAME}</p>
          <p className="site-footer__copy">
            Browser play first, clear revisit paths second, and itch.io support third.
          </p>
        </div>
        <div className="site-footer__links">
          <AppLink href="/play" className="site-footer__link" navigate={navigate}>Play</AppLink>
          <AppLink href="/updates" className="site-footer__link" navigate={navigate}>Updates</AppLink>
          <AppLink href={ITCH_URL} className="site-footer__link" navigate={navigate} target="_blank" rel="noreferrer">itch.io</AppLink>
          <AppLink href="/privacy" className="site-footer__link" navigate={navigate}>Privacy</AppLink>
        </div>
      </div>
    </footer>
  )
}
