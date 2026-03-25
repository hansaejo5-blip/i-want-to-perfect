export type Route = '/' | '/play' | '/guide' | '/updates' | '/support' | '/privacy'

export type RouteMeta = {
  title: string
  description: string
  canonicalPath: Route
}

const INTERNAL_ROUTES: Route[] = ['/', '/play', '/guide', '/updates', '/support', '/privacy']
const EXTERNAL_URL_PATTERN = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i

export const SITE_NAME = 'Perfect Drop'
export const SITE_URL = 'https://i-want-to-perfect.vercel.app'
export const ITCH_URL = 'https://your-studio.itch.io/perfect-drop'
export const DISCORD_URL = 'https://discord.gg/your-community'
export const NEWSLETTER_URL = 'mailto:hello@perfectdrop.game'
export const APP_BASE_PATH = normalizeBasePath(import.meta.env.BASE_URL || '/')

export const NAV_ITEMS: Array<{ href: Exclude<Route, '/privacy'>; label: string }> = [
  { href: '/', label: 'Home' },
  { href: '/play', label: 'Play' },
  { href: '/guide', label: 'Guide' },
  { href: '/updates', label: 'Updates' },
  { href: '/support', label: 'Support' },
]

export const ROUTE_META: Record<Route, RouteMeta> = {
  '/': {
    title: 'Perfect Drop | Garden Merge Game for Browser',
    description:
      'Play Perfect Drop, a gentle garden-themed browser merge game. Learn the loop quickly, view screenshots, read updates, and jump straight into play.',
    canonicalPath: '/',
  },
  '/play': {
    title: 'Play Perfect Drop | Browser Game',
    description:
      'Play Perfect Drop in your browser with simple controls, quick restarts, fullscreen support, and a clear path back to the guide or itch.io.',
    canonicalPath: '/play',
  },
  '/guide': {
    title: 'Perfect Drop Guide | Rules, Tips, and Strategy',
    description:
      'Read the Perfect Drop guide for goals, controls, basic rules, failure conditions, beginner tips, common mistakes, and advanced strategy.',
    canonicalPath: '/guide',
  },
  '/updates': {
    title: 'Perfect Drop Updates | Patch Notes and Changes',
    description:
      'Follow Perfect Drop updates with recent gameplay, physics, control, and content changes presented in a clear update list.',
    canonicalPath: '/updates',
  },
  '/support': {
    title: 'Support Perfect Drop | itch.io and Future Plans',
    description:
      'Support Perfect Drop on itch.io, review future plans, and find placeholder channels for email or Discord community updates.',
    canonicalPath: '/support',
  },
  '/privacy': {
    title: 'Perfect Drop Privacy | Site and Data Notice',
    description:
      'Read the Perfect Drop privacy notice covering data handling, cookies, analytics-ready structure, and contact options.',
    canonicalPath: '/privacy',
  },
}

function normalizeBasePath(basePath: string) {
  const withLeadingSlash = basePath.startsWith('/') ? basePath : `/${basePath}`
  const withTrailingSlash = withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
  return withTrailingSlash.replace(/\/+/g, '/') || '/'
}

function splitHrefParts(href: string) {
  const [pathWithQuery, hashPart = ''] = href.split('#')
  const [pathnamePart, queryPart = ''] = pathWithQuery.split('?')

  return {
    pathname: pathnamePart || '/',
    query: queryPart ? `?${queryPart}` : '',
    hash: hashPart ? `#${hashPart}` : '',
  }
}

function prependBasePath(pathname: string) {
  if (APP_BASE_PATH === '/') {
    return pathname
  }

  const baseWithoutTrailingSlash = APP_BASE_PATH.replace(/\/$/, '')
  return pathname === '/'
    ? `${baseWithoutTrailingSlash}/`
    : `${baseWithoutTrailingSlash}${pathname}`
}

export function isExternalHref(href: string) {
  return EXTERNAL_URL_PATTERN.test(href)
}

export function toAppHref(href: string) {
  if (isExternalHref(href)) {
    return href
  }

  const { pathname, query, hash } = splitHrefParts(href)
  const normalizedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${prependBasePath(normalizedPathname)}${query}${hash}`
}

export function routeToHref(route: Route, hash = '') {
  return toAppHref(`${route}${hash}`)
}

export function stripBasePath(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'

  if (APP_BASE_PATH === '/') {
    return normalizedPath
  }

  const baseWithoutTrailingSlash = APP_BASE_PATH.replace(/\/$/, '')
  if (normalizedPath === baseWithoutTrailingSlash) {
    return '/'
  }

  if (normalizedPath.startsWith(`${baseWithoutTrailingSlash}/`)) {
    return normalizedPath.slice(baseWithoutTrailingSlash.length) || '/'
  }

  return normalizedPath
}

export function getInternalRoute(href: string): Route | null {
  const { pathname } = splitHrefParts(href)
  const normalizedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`
  return INTERNAL_ROUTES.includes(normalizedPathname as Route) ? (normalizedPathname as Route) : null
}

export function normalizeRoute(pathname: string): Route {
  const path = stripBasePath(pathname)

  if (INTERNAL_ROUTES.includes(path as Route)) {
    return path as Route
  }

  return '/'
}

export function getAbsoluteSiteUrl(path = '/') {
  if (isExternalHref(path)) {
    return path
  }

  const origin = typeof window === 'undefined' ? SITE_URL : window.location.origin
  return new URL(toAppHref(path), origin).toString()
}

export function getApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (typeof window === 'undefined') {
    return new URL(normalizedPath, SITE_URL).toString()
  }

  const { hostname, origin } = window.location
  const shouldUseProductionApi = hostname.endsWith('github.io')
  const apiOrigin = shouldUseProductionApi ? SITE_URL : origin

  return new URL(normalizedPath, apiOrigin).toString()
}
