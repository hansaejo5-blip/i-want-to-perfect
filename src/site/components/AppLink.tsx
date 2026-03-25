import type { MouseEvent, ReactNode } from 'react'
import { getInternalRoute, routeToHref, toAppHref, type Route } from '../router'

type AppLinkProps = {
  href: string
  children: ReactNode
  className?: string
  navigate: (route: Route) => void
  target?: string
  rel?: string
  ariaLabel?: string
}

const PLAY_FULLSCREEN_FLAG = 'perfect-drop-enter-fullscreen'

function shouldPrimeFullscreen(href: string) {
  return href === '/play#game' && window.matchMedia('(max-width: 960px) and (pointer: coarse)').matches
}

function shouldLetBrowserHandle(event: MouseEvent<HTMLAnchorElement>, target?: string) {
  return Boolean(
    event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      target === '_blank',
  )
}

export function AppLink({ href, children, className, navigate, target, rel, ariaLabel }: AppLinkProps) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (shouldLetBrowserHandle(event, target)) {
      return
    }

    const internalRoute = getInternalRoute(href)
    if (!internalRoute) {
      return
    }

    event.preventDefault()
    const hash = href.includes('#') ? `#${href.split('#')[1]}` : ''

    if (shouldPrimeFullscreen(href)) {
      try {
        window.sessionStorage.setItem(PLAY_FULLSCREEN_FLAG, '1')
      } catch {
        // Ignore storage failures.
      }
    }

    if (hash) {
      window.history.pushState({}, '', routeToHref(internalRoute, hash))
      window.dispatchEvent(new PopStateEvent('popstate'))
      window.dispatchEvent(new HashChangeEvent('hashchange'))
      return
    }

    navigate(internalRoute)
  }

  return (
    <a href={toAppHref(href)} className={className} onClick={onClick} target={target} rel={rel} aria-label={ariaLabel}>
      {children}
    </a>
  )
}
