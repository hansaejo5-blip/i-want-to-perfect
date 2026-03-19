import { PageContainer } from '../components/PageContainer'
import { SectionTitle } from '../components/SectionTitle'
import { privacyContent } from '../data/content'

export function PrivacyPage() {
  return (
    <PageContainer>
      <article className="page-section card prose-card">
        <h1>Privacy</h1>
        <SectionTitle eyebrow="Privacy" title="Personal information notice" />
        <p>{privacyContent.notice}</p>

        <SectionTitle title="Cookies and analytics-ready structure" />
        <p>{privacyContent.cookies}</p>

        <SectionTitle title="Contact method" />
        <p>{privacyContent.contact}</p>
      </article>
    </PageContainer>
  )
}
