import type { ReactNode } from 'react'
import type { Route } from '../router'
import { isHubRoute } from '../router'
import { Footer } from './Footer'
import { Header } from './Header'

type SiteLayoutProps = {
  route: Route
  navigate: (route: Route) => void
  children: ReactNode
}

export function SiteLayout({ route, navigate, children }: SiteLayoutProps) {
  if (isHubRoute(route)) {
    return (
      <div className="site-shell site-shell--hub">
        <main>{children}</main>
      </div>
    )
  }

  return (
    <div className="site-shell">
      <Header route={route} navigate={navigate} />
      <main>{children}</main>
      <Footer navigate={navigate} />
    </div>
  )
}
