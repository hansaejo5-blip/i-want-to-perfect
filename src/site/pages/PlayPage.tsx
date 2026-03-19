import { useRef, useState } from 'react'
import { GameScreen } from '../../game/GameScreen'
import { recordRun, type RecordedRunSummary } from '../../game/stats'
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
  const [latestRun, setLatestRun] = useState<RecordedRunSummary | null>(null)
  const [shareLabel, setShareLabel] = useState('공유하기')
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

  const handleShare = async () => {
    if (latestRun === null) {
      return
    }

    const shareText = `Perfect Drop에서 ${latestRun.score}점, 상위 ${latestRun.topPercent}% 기록했어. 이길 수 있겠어?`

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Perfect Drop',
          text: shareText,
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(`${shareText} ${window.location.href}`)
        setShareLabel('복사됨')
        window.setTimeout(() => setShareLabel('공유하기'), 1800)
      }
    } catch {
      // Ignore cancelled shares.
    }
  }

  return (
    <PageContainer>
      <section className="page-section play-page__hero card">
        <SectionTitle eyebrow="Play" title={playPageCopy.heading} />
        <p>{playPageCopy.description}</p>
      </section>

      <section className="page-section play-toolbar">
        <CTAButton
          label={isMuted ? 'Unmute' : 'Mute'}
          navigate={navigate}
          variant="ghost"
          onClick={() => setIsMuted((value) => !value)}
        />
      </section>

      <section className="page-section play-layout">
        <div className="play-layout__game card" ref={frameRef}>
          <GameScreen
            key={sessionKey}
            isMuted={isMuted}
            onRunEnded={(summary) => {
              setLatestRun(recordRun(summary))
            }}
          />
        </div>
        <div className="play-layout__side">
          <section className="card control-card">
            <SectionTitle eyebrow="Controls" title="Game controls" />
            <div className="control-stack">
              <CTAButton label="Restart" navigate={navigate} onClick={() => setSessionKey((value) => value + 1)} block />
              <CTAButton label="Fullscreen" navigate={navigate} variant="secondary" onClick={() => void toggleFullscreen()} block />
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

      {latestRun ? (
        <section className="page-section card run-stats-section">
          <SectionTitle eyebrow="Garden Record" title="이번 정원 기록" />
          <p className="run-stats-copy">
            이번 런은 <strong>{latestRun.score}</strong>점을 기록했고, 지금까지 저장된 기록 기준 <strong>상위 {latestRun.topPercent}%</strong>에 들어갑니다.
          </p>
          <div className="run-stats-grid">
            <div className="run-stat-card run-stat-card--score">
              <span className="hud-label">이번 점수</span>
              <strong>{latestRun.score}</strong>
            </div>
            <div className="run-stat-card run-stat-card--rank">
              <div className="run-stat-card__top">
                <span className="hud-label">정원 순위</span>
                <button className="share-run-button" type="button" onClick={() => void handleShare()}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M15 8a3 3 0 1 0-2.82-4H12a3 3 0 0 0 .18 1.01L7.91 7.27a3 3 0 0 0-1.91-.69 3 3 0 1 0 1.91 5.31l4.27 2.26A3 3 0 0 0 12 15a3 3 0 1 0 .18 1.01l-4.27-2.26A3 3 0 0 0 8 12c0-.35-.06-.69-.18-1.01l4.27-2.26c.53.52 1.25.84 2.01.84Z" />
                  </svg>
                  <span>{shareLabel}</span>
                </button>
              </div>
              <strong>#{latestRun.rank} / {latestRun.totalRuns}</strong>
            </div>
            <div className="run-stat-card">
              <span className="hud-label">최고 점수</span>
              <strong>{latestRun.bestScore}</strong>
            </div>
            <div className="run-stat-card">
              <span className="hud-label">사용한 꽃</span>
              <strong>{latestRun.shotCount}</strong>
            </div>
          </div>
        </section>
      ) : null}

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
