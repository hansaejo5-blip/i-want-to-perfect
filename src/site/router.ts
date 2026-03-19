export type Route = '/' | '/play' | '/guide' | '/updates' | '/support' | '/privacy'

export type RouteMeta = {
  title: string
  description: string
  canonicalPath: Route
}

export const SITE_NAME = 'Perfect Drop'
export const SITE_URL = 'https://i-want-to-perfect.vercel.app'
export const ITCH_URL = 'https://your-studio.itch.io/perfect-drop'
export const DISCORD_URL = 'https://discord.gg/your-community'
export const NEWSLETTER_URL = 'mailto:hello@perfectdrop.game'

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

export const normalizeRoute = (pathname: string): Route => {
  const path = pathname.replace(/\/+$/, '') || '/'

  if (
    path === '/' ||
    path === '/play' ||
    path === '/guide' ||
    path === '/updates' ||
    path === '/support' ||
    path === '/privacy'
  ) {
    return path
  }

  return '/'
}
