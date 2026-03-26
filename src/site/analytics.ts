const GA_MEASUREMENT_ID = 'G-1L5RBWW3ES'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function trackPageView(pageTitle: string) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return
  }

  window.gtag('event', 'page_view', {
    send_to: GA_MEASUREMENT_ID,
    page_title: pageTitle,
    page_location: window.location.href,
    page_path: `${window.location.pathname}${window.location.search}`,
  })
}
