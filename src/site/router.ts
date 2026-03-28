export type Route = '/' | '/play' | '/garden' | '/market' | '/rankings' | '/guide' | '/updates' | '/support' | '/privacy'
export type HubRoute = '/' | '/play' | '/garden' | '/market' | '/rankings'

export type RouteMeta = {
  title: string
  description: string
  canonicalPath: Route
}

const INTERNAL_ROUTES: Route[] = ['/', '/play', '/garden', '/market', '/rankings', '/guide', '/updates', '/support', '/privacy']
const HUB_ROUTES: HubRoute[] = ['/', '/play', '/garden', '/market', '/rankings']
const EXTERNAL_URL_PATTERN = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i

export const SITE_NAME = 'Perfect Drop'
export const SITE_URL = 'https://i-want-to-perfect.vercel.app'
export const ITCH_URL = 'https://your-studio.itch.io/perfect-drop'
export const DISCORD_URL = 'https://discord.gg/your-community'
export const NEWSLETTER_URL = 'mailto:hello@perfectdrop.game'
export const APP_BASE_PATH = normalizeBasePath(import.meta.env.BASE_URL || '/')

export const HUB_NAV_ITEMS: Array<{ href: HubRoute; label: string }> = [
  { href: '/', label: 'Home' },
  { href: '/play', label: 'Play' },
  { href: '/garden', label: 'Garden' },
  { href: '/market', label: 'Market' },
  { href: '/rankings', label: 'Rankings' },
]

export const NAV_ITEMS: Array<{ href: Exclude<Route, '/privacy' | '/garden' | '/market' | '/rankings'>; label: string }> = [
  { href: '/', label: 'Home' },
  { href: '/play', label: 'Play' },
  { href: '/guide', label: 'Guide' },
  { href: '/updates', label: 'Updates' },
  { href: '/support', label: 'Support' },
]

export const ROUTE_META: Record<Route, RouteMeta> = {
  '/': {
    title: 'Perfect Drop Hub | Garden Growth Dashboard',
    description: 'Track your level, daily bloom targets, emerald balance, skins, and recent Perfect Drop runs from one calm garden dashboard.',
    canonicalPath: '/',
  },
  '/play': {
    title: 'Play Perfect Drop | Runs, Rewards, and Growth',
    description: 'Play Perfect Drop online and turn each run into XP, emerald rewards, daily target progress, and new garden unlocks.',
    canonicalPath: '/play',
  },
  '/garden': {
    title: 'Perfect Drop Garden | Progress, Unlocks, and Milestones',
    description: 'See your Perfect Drop level progress, bloom milestones, collection unlocks, and daily growth status inside the Garden.',
    canonicalPath: '/garden',
  },
  '/market': {
    title: 'Perfect Drop Market | Buy Skins with Emeralds',
    description: 'Spend emeralds on Perfect Drop skins, preview unlocks, and equip new garden-themed finishes for your runs.',
    canonicalPath: '/market',
  },
  '/rankings': {
    title: 'Perfect Drop Rankings | Best Score and Leaderboards',
    description: 'Review your best Perfect Drop score, leaderboard standings, and current competitive pace from the Rankings hub.',
    canonicalPath: '/rankings',
  },
  '/guide': {
    title: 'Perfect Drop Guide | How to Play, Rules, Tips',
    description: 'Learn how to play Perfect Drop with controls, rules, failure conditions, beginner tips, common mistakes, and merge strategy.',
    canonicalPath: '/guide',
  },
  '/updates': {
    title: 'Perfect Drop Updates | Patch Notes for the Merge Game',
    description: 'Read Perfect Drop patch notes covering gameplay tuning, physics changes, controls, and new content for the flower merge browser game.',
    canonicalPath: '/updates',
  },
  '/support': {
    title: 'Support Perfect Drop | itch.io and Future Plans',
    description: 'Support Perfect Drop on itch.io, follow future updates, and find the next steps for this browser merge game project.',
    canonicalPath: '/support',
  },
  '/privacy': {
    title: 'Perfect Drop Privacy | Site and Data Notice',
    description: 'Read the Perfect Drop privacy notice covering data handling, cookies, analytics-ready structure, and contact options.',
    canonicalPath: '/privacy',
  },
}

export function isHubRoute(route: Route): route is HubRoute {
  return HUB_ROUTES.includes(route as HubRoute)
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
