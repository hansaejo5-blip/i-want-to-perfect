import { faqs, featureCards, homeHero, homeIntro, screenshots, updates } from '../data/content'
import type { Route } from '../router'
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
        <SectionTitle eyebrow="Highlights" title="Three clear reasons to try a run" />
        <div className="feature-grid">
          {featureCards.map((item) => (
            <FeatureCard key={item.title} title={item.title} body={item.body} />
          ))}
        </div>
      </section>

      <section className="page-section">
        <SectionTitle eyebrow="Screenshots" title="A quick view of the game before you click play" />
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
        <SectionTitle eyebrow="Recent Updates" title="A small preview for returning players" />
        <div className="update-grid">
          {updates.map((item) => (
            <UpdateCard key={item.title} title={item.title} date={item.date} summary={item.summary} />
          ))}
        </div>
      </section>

      <section className="page-section">
        <SectionTitle eyebrow="FAQ" title="Questions that usually block the first play" />
        <FAQSection items={faqs} />
      </section>
    </PageContainer>
  )
}
