import type { MouseEvent, ReactNode } from 'react'
import type { Route } from '../router'

type AppLinkProps = {
  href: string
  children: ReactNode
  className?: string
  navigate: (route: Route) => void
  target?: string
  rel?: string
  ariaLabel?: string
}

const INTERNAL_ROUTES: Route[] = ['/', '/play', '/guide', '/updates', '/support', '/privacy']

function getInternalRoute(href: string): Route | null {
  const [path] = href.split('#')
  const normalizedPath = (path || '/') as Route
  return INTERNAL_ROUTES.includes(normalizedPath) ? normalizedPath : null
}

export function AppLink({ href, children, className, navigate, target, rel, ariaLabel }: AppLinkProps) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (target === '_blank') {
      return
    }

    const internalRoute = getInternalRoute(href)
    if (!internalRoute) {
      return
    }

    event.preventDefault()
    const hash = href.includes('#') ? '#' + href.split('#')[1] : ''

    if (hash) {
      window.history.pushState({}, '', internalRoute + hash)
      window.dispatchEvent(new PopStateEvent('popstate'))
      window.dispatchEvent(new HashChangeEvent('hashchange'))
      return
    }

    navigate(internalRoute)
  }

  return (
    <a href={href} className={className} onClick={onClick} target={target} rel={rel} aria-label={ariaLabel}>
      {children}
    </a>
  )
}
