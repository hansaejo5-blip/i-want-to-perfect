import { useEffect, useState } from 'react'
import './App.css'
import { SiteLayout } from './site/components/SiteLayout'
import { GuidePage, HomePage, PlayPage, PrivacyPage, SupportPage, UpdatesPage } from './site/pages'
import { ROUTE_META, SITE_NAME, SITE_URL, normalizeRoute, type Route } from './site/router'

const ensureMetaTag = (selector: string, create: () => HTMLMetaElement) => {
  const existing = document.head.querySelector<HTMLMetaElement>(selector)

  if (existing) {
    return existing
  }

  const element = create()
  document.head.append(element)
  return element
}

const ensureLinkTag = (selector: string, create: () => HTMLLinkElement) => {
  const existing = document.head.querySelector<HTMLLinkElement>(selector)

  if (existing) {
    return existing
  }

  const element = create()
  document.head.append(element)
  return element
}

function App() {
  const [route, setRoute] = useState<Route>(() => normalizeRoute(window.location.pathname))
  const meta = ROUTE_META[route]

  useEffect(() => {
    const handlePopState = () => {
      setRoute(normalizeRoute(window.location.pathname))
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    document.documentElement.lang = 'en'
    document.title = meta.title

    const descriptionTag = ensureMetaTag('meta[name="description"]', () => {
      const element = document.createElement('meta')
      element.name = 'description'
      return element
    })
    descriptionTag.content = meta.description

    const ogTypeTag = ensureMetaTag('meta[property="og:type"]', () => {
      const element = document.createElement('meta')
      element.setAttribute('property', 'og:type')
      return element
    })
    ogTypeTag.content = 'website'

    const ogSiteNameTag = ensureMetaTag('meta[property="og:site_name"]', () => {
      const element = document.createElement('meta')
      element.setAttribute('property', 'og:site_name')
      return element
    })
    ogSiteNameTag.content = SITE_NAME

    const ogTitleTag = ensureMetaTag('meta[property="og:title"]', () => {
      const element = document.createElement('meta')
      element.setAttribute('property', 'og:title')
      return element
    })
    ogTitleTag.content = meta.title

    const ogDescriptionTag = ensureMetaTag('meta[property="og:description"]', () => {
      const element = document.createElement('meta')
      element.setAttribute('property', 'og:description')
      return element
    })
    ogDescriptionTag.content = meta.description

    const ogUrlTag = ensureMetaTag('meta[property="og:url"]', () => {
      const element = document.createElement('meta')
      element.setAttribute('property', 'og:url')
      return element
    })
    ogUrlTag.content = SITE_URL + meta.canonicalPath

    const canonicalLink = ensureLinkTag('link[rel="canonical"]', () => {
      const element = document.createElement('link')
      element.rel = 'canonical'
      return element
    })
    canonicalLink.href = SITE_URL + meta.canonicalPath
  }, [meta])

  const navigate = (nextRoute: Route) => {
    if (nextRoute === route) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    window.history.pushState({}, '', nextRoute)
    setRoute(nextRoute)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  const renderPage = () => {
    switch (route) {
      case '/play':
        return <PlayPage navigate={navigate} />
      case '/guide':
        return <GuidePage />
      case '/updates':
        return <UpdatesPage />
      case '/support':
        return <SupportPage navigate={navigate} />
      case '/privacy':
        return <PrivacyPage />
      case '/':
      default:
        return <HomePage navigate={navigate} />
    }
  }

  return <SiteLayout route={route} navigate={navigate}>{renderPage()}</SiteLayout>
}

export default App
