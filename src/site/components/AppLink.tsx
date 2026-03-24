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
const PLAY_FULLSCREEN_FLAG = 'perfect-drop-enter-fullscreen'

function getInternalRoute(href: string): Route | null {
  const [path] = href.split('#')
  const normalizedPath = (path || '/') as Route
  return INTERNAL_ROUTES.includes(normalizedPath) ? normalizedPath : null
}

function shouldPrimeFullscreen(href: string) {
  return href === '/play#game' && window.matchMedia('(max-width: 960px) and (pointer: coarse)').matches
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

    if (shouldPrimeFullscreen(href)) {
      try {
        window.sessionStorage.setItem(PLAY_FULLSCREEN_FLAG, '1')
      } catch {
        // Ignore storage failures.
      }
    }

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
