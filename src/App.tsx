import { useEffect, useState } from 'react'
import './App.css'
import { trackPageView } from './site/analytics'
import { SiteLayout } from './site/components/SiteLayout'
import { faqs } from './site/data/content'
import { GardenPage, GuidePage, HomePage, MarketPage, PlayPage, PrivacyPage, RankingsPage, SupportPage, UpdatesPage } from './site/pages'
import {
  ROUTE_META,
  SITE_NAME,
  getAbsoluteSiteUrl,
  normalizeRoute,
  routeToHref,
  type Route,
} from './site/router'
import {
  applyRunProgression,
  unequipBackground,
  equipSkin,
  unequipSkin,
  loadProgressionState,
  purchaseSkin,
  saveProgressionState,
  syncProgressionState,
  type ProgressionRunSummary,
} from './site/progression'

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

const ensureScriptTag = (selector: string, create: () => HTMLScriptElement) => {
  const existing = document.head.querySelector<HTMLScriptElement>(selector)

  if (existing) {
    return existing
  }

  const element = create()
  document.head.append(element)
  return element
}

function App() {
  const [route, setRoute] = useState<Route>(() => normalizeRoute(window.location.pathname))
  const [progression, setProgression] = useState(() => loadProgressionState())
  const meta = ROUTE_META[route]

  useEffect(() => {
    const handlePopState = () => {
      setRoute(normalizeRoute(window.location.pathname))
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    const syncInterval = window.setInterval(() => {
      setProgression((current) => syncProgressionState(current))
    }, 60_000)

    return () => window.clearInterval(syncInterval)
  }, [])

  useEffect(() => {
    saveProgressionState(progression)
  }, [progression])

  useEffect(() => {
    document.documentElement.lang = 'en'
    document.title = meta.title

    const canonicalUrl = getAbsoluteSiteUrl(meta.canonicalPath)
    const previewImageUrl = getAbsoluteSiteUrl('/og-image.png')

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
    ogUrlTag.content = canonicalUrl

    const ogImageTag = ensureMetaTag('meta[property="og:image"]', () => {
      const element = document.createElement('meta')
      element.setAttribute('property', 'og:image')
      return element
    })
    ogImageTag.content = previewImageUrl

    const twitterCardTag = ensureMetaTag('meta[name="twitter:card"]', () => {
      const element = document.createElement('meta')
      element.name = 'twitter:card'
      return element
    })
    twitterCardTag.content = 'summary_large_image'

    const twitterTitleTag = ensureMetaTag('meta[name="twitter:title"]', () => {
      const element = document.createElement('meta')
      element.name = 'twitter:title'
      return element
    })
    twitterTitleTag.content = meta.title

    const twitterDescriptionTag = ensureMetaTag('meta[name="twitter:description"]', () => {
      const element = document.createElement('meta')
      element.name = 'twitter:description'
      return element
    })
    twitterDescriptionTag.content = meta.description

    const twitterImageTag = ensureMetaTag('meta[name="twitter:image"]', () => {
      const element = document.createElement('meta')
      element.name = 'twitter:image'
      return element
    })
    twitterImageTag.content = previewImageUrl

    const canonicalLink = ensureLinkTag('link[rel="canonical"]', () => {
      const element = document.createElement('link')
      element.rel = 'canonical'
      return element
    })
    canonicalLink.href = canonicalUrl

    const siteSchemaTag = ensureScriptTag('script[data-schema="site"]', () => {
      const element = document.createElement('script')
      element.type = 'application/ld+json'
      element.dataset.schema = 'site'
      return element
    })
    siteSchemaTag.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'VideoGame',
      name: SITE_NAME,
      url: canonicalUrl,
      image: previewImageUrl,
      description: meta.description,
      genre: ['Puzzle game', 'Merge game', 'Casual game'],
      gamePlatform: ['Web browser', 'Mobile web'],
      applicationCategory: 'Game',
      operatingSystem: 'Any',
      playMode: 'SinglePlayer',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    })

    const existingFaqTag = document.head.querySelector<HTMLScriptElement>('script[data-schema="faq"]')
    if (route === '/') {
      const faqSchemaTag = existingFaqTag ?? ensureScriptTag('script[data-schema="faq"]', () => {
        const element = document.createElement('script')
        element.type = 'application/ld+json'
        element.dataset.schema = 'faq'
        return element
      })

      faqSchemaTag.text = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      })
    } else {
      existingFaqTag?.remove()
    }

    trackPageView(meta.title)
  }, [meta, route])

  const navigate = (nextRoute: Route) => {
    if (nextRoute === route) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    window.history.pushState({}, '', routeToHref(nextRoute))
    setRoute(nextRoute)
    setProgression((current) => syncProgressionState(current))
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  const handleRunCompleted = (summary: ProgressionRunSummary) => {
    setProgression((current) => applyRunProgression(current, summary))
  }

  const renderPage = () => {
    switch (route) {
      case '/play':
        return <PlayPage navigate={navigate} progression={progression} onCompleteRun={handleRunCompleted} />
      case '/garden':
        return <GardenPage navigate={navigate} progression={progression} />
      case '/market':
        return (
          <MarketPage
            navigate={navigate}
            progression={progression}
            onBuySkin={(skinId) => setProgression((current) => purchaseSkin(current, skinId))}
            onEquipSkin={(skinId) => setProgression((current) => equipSkin(current, skinId))}
            onUnequipSkin={() => setProgression((current) => unequipSkin(current))}
            onUnequipBackground={() => setProgression((current) => unequipBackground(current))}
          />
        )
      case '/rankings':
        return <RankingsPage navigate={navigate} progression={progression} />
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
        return <HomePage navigate={navigate} progression={progression} />
    }
  }

  return <SiteLayout route={route} navigate={navigate}>{renderPage()}</SiteLayout>
}

export default App
