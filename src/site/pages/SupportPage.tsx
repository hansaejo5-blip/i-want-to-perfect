import { CTAButton } from '../components/CTAButton'
import { PageContainer } from '../components/PageContainer'
import { SectionTitle } from '../components/SectionTitle'
import { supportContent } from '../data/content'
import type { Route } from '../router'

type SupportPageProps = {
  navigate: (route: Route) => void
}

export function SupportPage({ navigate }: SupportPageProps) {
  return (
    <PageContainer>
      <section className="page-section card prose-card">
        <h1>{supportContent.title}</h1>
        <p>{supportContent.description}</p>
        <p>
          This page is where players can see how the project is maintained, where future contact options will live,
          and which off-site support path is intentionally separated from the main in-browser game flow.
        </p>
        <CTAButton label={supportContent.itchCta.label} href={supportContent.itchCta.href} navigate={navigate} target="_blank" rel="noreferrer" />
      </section>

      <section className="page-section support-grid">
        <article className="card prose-card">
          <SectionTitle eyebrow="Future Plans" title="What comes next" />
          <ul className="simple-list">
            {supportContent.futurePlans.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="card prose-card">
          <SectionTitle eyebrow="Help" title="Support and contact paths" />
          <p>
            For now, gameplay feedback, bug reports, and follow requests are funneled through the project placeholders below.
            As the site matures, this section can expand into a more formal help center without changing the current navigation structure.
          </p>
          <div className="support-channel-list">
            {supportContent.channels.map((item) => (
              <CTAButton key={item.label} label={item.label} href={item.href} navigate={navigate} variant="secondary" block target={item.href.startsWith('http') ? '_blank' : undefined} rel={item.href.startsWith('http') ? 'noreferrer' : undefined} />
            ))}
          </div>
        </article>
      </section>
    </PageContainer>
  )
}
