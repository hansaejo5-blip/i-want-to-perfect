import { PageContainer } from '../components/PageContainer'
import { SectionTitle } from '../components/SectionTitle'
import { UpdateCard } from '../components/UpdateCard'
import { updates } from '../data/content'

export function UpdatesPage() {
  return (
    <PageContainer>
      <section className="page-section">
        <div className="card prose-card">
          <h1>Updates</h1>
          <p>
            This page tracks Perfect Drop patch notes and gameplay changes for the browser merge game. Returning players can
            check recent physics tuning, control improvements, and content updates before jumping back into a run.
          </p>
          <SectionTitle eyebrow="Updates" title="Recent changes" />
          <div className="update-list">
            {updates.map((item) => (
              <UpdateCard key={item.title} title={item.title} date={item.date} summary={item.summary} />
            ))}
          </div>
        </div>
      </section>
    </PageContainer>
  )
}
