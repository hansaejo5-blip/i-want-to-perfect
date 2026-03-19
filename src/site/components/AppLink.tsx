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

const isInternalRoute = (href: string): href is Route => {
  return href === '/' || href === '/play' || href === '/guide' || href === '/updates' || href === '/support' || href === '/privacy'
}

export function AppLink({ href, children, className, navigate, target, rel, ariaLabel }: AppLinkProps) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (target === '_blank') {
      return
    }

    if (isInternalRoute(href)) {
      event.preventDefault()
      navigate(href)
    }
  }

  return (
    <a href={href} className={className} onClick={onClick} target={target} rel={rel} aria-label={ariaLabel}>
      {children}
    </a>
  )
}
