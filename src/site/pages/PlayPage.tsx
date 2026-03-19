import { useRef, useState } from 'react'
import { GameScreen } from '../../game/GameScreen'
import { CTAButton } from '../components/CTAButton'
import { PageContainer } from '../components/PageContainer'
import { SectionTitle } from '../components/SectionTitle'
import { playPageCopy } from '../data/content'
import { ITCH_URL, type Route } from '../router'

type PlayPageProps = {
  navigate: (route: Route) => void
}

export function PlayPage({ navigate }: PlayPageProps) {
  const [sessionKey, setSessionKey] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const frameRef = useRef<HTMLDivElement | null>(null)

  const toggleFullscreen = async () => {
    const node = frameRef.current
    if (!node) {
      return
    }

    if (document.fullscreenElement === node) {
      await document.exitFullscreen()
      return
    }

    await node.requestFullscreen()
  }

  return (
    <PageContainer>
      <section className="page-section play-page__hero card">
        <SectionTitle eyebrow="Play" title={playPageCopy.heading} />
        <p>{playPageCopy.description}</p>
      </section>

      <section className="page-section play-layout">
        <div className="play-layout__game card" ref={frameRef}>
          <GameScreen key={sessionKey} />
        </div>
        <div className="play-layout__side">
          <section className="card control-card">
            <SectionTitle eyebrow="Controls" title="Game controls" />
            <div className="control-stack">
              <CTAButton label="Restart" navigate={navigate} onClick={() => setSessionKey((value) => value + 1)} block />
              <CTAButton label="Fullscreen" navigate={navigate} variant="secondary" onClick={() => void toggleFullscreen()} block />
              <CTAButton label={isMuted ? 'Mute Off' : 'Mute'} navigate={navigate} variant="ghost" onClick={() => setIsMuted((value) => !value)} block />
            </div>
          </section>

          <section className="card prose-card">
            <SectionTitle eyebrow="How to Play" title="Short control guide" />
            <ul className="simple-list">
              {playPageCopy.controls.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      </section>

      <section className="page-section card cta-row-section">
        <SectionTitle eyebrow="Next Step" title="After the run" />
        <div className="cta-row">
          <CTAButton label="Play Again" navigate={navigate} onClick={() => setSessionKey((value) => value + 1)} />
          <CTAButton label="Read Guide" href="/guide" navigate={navigate} variant="secondary" />
          <CTAButton label="Support on itch.io" href={ITCH_URL} navigate={navigate} variant="ghost" target="_blank" rel="noreferrer" />
        </div>
      </section>
    </PageContainer>
  )
}
