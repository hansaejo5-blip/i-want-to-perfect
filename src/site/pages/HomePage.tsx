import { faqs, featureCards, homeHero, homeIntro, homeSupportCards, screenshots, updates } from '../data/content'
import type { Route } from '../router'
import { AppLink } from '../components/AppLink'
import { CTAButton } from '../components/CTAButton'
import { FeatureCard } from '../components/FeatureCard'
import { FAQSection } from '../components/FAQSection'
import { HeroSection } from '../components/HeroSection'
import { PageContainer } from '../components/PageContainer'
import { ScreenshotGrid } from '../components/ScreenshotGrid'
import { SectionTitle } from '../components/SectionTitle'
import { UpdateCard } from '../components/UpdateCard'

type HomePageProps = {
  navigate: (route: Route) => void
}

export function HomePage({ navigate }: HomePageProps) {
  return (
    <PageContainer>
      <HeroSection {...homeHero} navigate={navigate} />

      <section className="page-section">
        <div className="home-entry-grid">
          <article className="card prose-card home-entry-card">
            <SectionTitle eyebrow="Start Here" title="Play the browser merge game first, then use the rest when you need it" />
            <p>
              Perfect Drop is a free flower merge browser game. The main play page is the real entry point, while the guide,
              updates, and support pages stay close by for players who want rules, strategy, or patch notes after a run.
            </p>
            <p>
              That balance matters for both players and search engines. A first-time visitor can understand that this is an
              online merge game with real supporting content instead of a thin landing page wrapped around one button.
            </p>
            <div className="home-link-grid">
              {homeSupportCards.map((item) => (
                <article key={item.title} className="home-link-card">
                  <p className="section-title__eyebrow">{item.eyebrow}</p>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <AppLink href={item.cta.href} className="home-link-card__cta" navigate={navigate}>
                    {item.cta.label}
                  </AppLink>
                </article>
              ))}
            </div>
          </article>

          <aside className="card home-trust-card" aria-label="Site quality and layout notes">
            <p className="section-title__eyebrow">Site Signals</p>
            <h2>Built like a real game site, not a thin click shell</h2>
            <ul className="simple-list">
              <li>The main play button stays visually isolated from navigation and future monetization zones.</li>
              <li>Supporting sections sit below the fold so the homepage still feels substantial and reviewable.</li>
              <li>Guide, updates, screenshots, and support remain part of the homepage structure instead of being hidden.</li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="page-section home-benefits-section">
        <SectionTitle eyebrow="Why It Works" title="Designed for quick play and clean revisit paths" />
        <div className="feature-grid home-benefit-grid">
          {featureCards.map((item) => (
            <FeatureCard key={item.title} title={item.title} body={item.body} />
          ))}
        </div>
      </section>

      <section className="page-section">
        <article className="card prose-card">
          <SectionTitle eyebrow="Game Overview" title="What kind of game Perfect Drop is" />
          <p>
            Perfect Drop is an online flower merge game for desktop and mobile browsers. You drop matching flowers into the
            board, combine them into larger forms, and manage space carefully enough to keep the run alive.
          </p>
          <p>
            If you have searched for a free merge game online, a browser puzzle game, or a flower merge game with short
            sessions, this site is built to answer those questions quickly and let you start playing immediately.
          </p>
        </article>
      </section>

      <section className="page-section">
        <SectionTitle eyebrow="Screenshots" title="A quick view of the board before you jump in" />
        <ScreenshotGrid items={screenshots} />
      </section>

      <section className="page-section">
        <article className="card prose-card">
          <SectionTitle eyebrow="About" title={homeIntro.title} />
          {homeIntro.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </article>
      </section>

      <section className="page-section">
        <SectionTitle eyebrow="Recent Updates" title="Recent improvements for returning players" />
        <div className="update-grid">
          {updates.map((item) => (
            <UpdateCard key={item.title} title={item.title} date={item.date} summary={item.summary} />
          ))}
        </div>
      </section>

      <section className="page-section">
        <div className="card home-banner-cta">
          <div>
            <p className="section-title__eyebrow">Play Entry</p>
            <h2>Start your flower merge run now.</h2>
          </div>
          <CTAButton label="Play Perfect Drop" href="/play#game" navigate={navigate} size="large" />
        </div>
      </section>

      <section className="page-section">
        <SectionTitle eyebrow="FAQ" title="Questions that should not block the first play" />
        <FAQSection items={faqs} />
      </section>
    </PageContainer>
  )
}
