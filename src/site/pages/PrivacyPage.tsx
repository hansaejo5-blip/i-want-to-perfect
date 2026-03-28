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

        <SectionTitle title="Local progression storage" />
        <p>
          The current site stores progression, equipped cosmetics, and daily target state in browser storage so the hub can remember your session.
          That local state exists to preserve gameplay continuity and is separate from any future advertising or analytics integration.
        </p>

        <SectionTitle title="Advertising and UI separation" />
        <p>
          If advertising is added later, it should be clearly separated from gameplay controls, navigation, and primary call-to-action buttons.
          This page exists in part to document that distinction instead of blending ads into the core game interface.
        </p>

        <SectionTitle title="Contact method" />
        <p>{privacyContent.contact}</p>
      </article>
    </PageContainer>
  )
}
