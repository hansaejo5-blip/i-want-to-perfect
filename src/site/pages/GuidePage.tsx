import { PageContainer } from '../components/PageContainer'
import { SectionTitle } from '../components/SectionTitle'
import { guideContent } from '../data/content'

export function GuidePage() {
  return (
    <PageContainer>
      <article className="guide-page">
        <section className="page-section card prose-card">
          <h1>Perfect Drop Guide</h1>
          <SectionTitle eyebrow="Guide" title="Game introduction" />
          <p>{guideContent.introduction}</p>

          <SectionTitle title="Goal" />
          <p>{guideContent.goal}</p>

          <SectionTitle title="Controls" />
          {guideContent.controls.map((item) => (
            <div key={item.title} className="subsection-block">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}

          <SectionTitle title="Basic rules" />
          <ul className="simple-list">
            {guideContent.basicRules.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <SectionTitle title="Failure condition" />
          <p>{guideContent.failureCondition}</p>

          <SectionTitle title="Beginner tips" />
          <ul className="simple-list">
            {guideContent.beginnerTips.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <SectionTitle title="Common mistakes" />
          <ul className="simple-list">
            {guideContent.commonMistakes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <SectionTitle title="Advanced strategy" />
          {guideContent.advancedStrategy.map((item) => (
            <div key={item.title} className="subsection-block">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </section>
      </article>
    </PageContainer>
  )
}
