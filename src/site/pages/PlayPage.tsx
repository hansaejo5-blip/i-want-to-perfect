import { useEffect, useMemo, useRef, useState } from 'react'
import { GameScreen } from '../../game/GameScreen'
import { getCachedLeaderboardSnapshot, getPlayerId, loadLeaderboard, recordRun, type LeaderboardSnapshot, type RecordedRunSummary } from '../../game/stats'
import { CTAButton } from '../components/CTAButton'
import { PageContainer } from '../components/PageContainer'
import { SectionTitle } from '../components/SectionTitle'
import { playPageCopy } from '../data/content'
import { ITCH_URL, SITE_URL, type Route } from '../router'

type PlayPageProps = {
  navigate: (route: Route) => void
}

const leaderboardTimestampFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function PlayPage({ navigate }: PlayPageProps) {
  const [sessionKey, setSessionKey] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [latestRun, setLatestRun] = useState<RecordedRunSummary | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardSnapshot | null>(() => getCachedLeaderboardSnapshot())
  const [isLeaderboardReady, setIsLeaderboardReady] = useState(() => getCachedLeaderboardSnapshot() !== null)
  const [shareLabel, setShareLabel] = useState('Share')
  const frameRef = useRef<HTMLDivElement | null>(null)
  const shareResetRef = useRef<number | null>(null)
  const currentPlayerId = useMemo(() => getPlayerId(), [])

  useEffect(() => {
    void loadLeaderboard().then((snapshot) => {
      setLeaderboard(snapshot)
      setIsLeaderboardReady(true)
    })

    return () => {
      if (shareResetRef.current !== null) {
        window.clearTimeout(shareResetRef.current)
      }
    }
  }, [])

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
    const shareText = latestRun
      ? `I scored ${latestRun.score} in Perfect Drop and landed in the top ${latestRun.topPercent}% of ${latestRun.totalRuns} runs. Can you beat it?`
      : 'Play Perfect Drop and climb the shared leaderboard.'

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Perfect Drop',
          text: shareText,
          url: SITE_URL,
        })
        return
      }

      await navigator.clipboard.writeText(`${shareText} ${SITE_URL}`)
      setShareLabel('Copied')
      if (shareResetRef.current !== null) {
        window.clearTimeout(shareResetRef.current)
      }
      shareResetRef.current = window.setTimeout(() => setShareLabel('Share'), 1800)
    } catch {
      // Ignore cancelled shares and clipboard failures.
    }
  }

  const displayedLeaderboard = latestRun?.leaderboard.length
    ? latestRun.leaderboard
    : leaderboard?.leaderboard ?? []
  const totalRuns = latestRun?.totalRuns ?? leaderboard?.totalRuns ?? 0
  const bestScore = latestRun?.bestScore ?? leaderboard?.playerBestScore ?? 0
  const leaderboardStatus = latestRun?.source ?? leaderboard?.source ?? 'local'
  const updatedAt = leaderboard?.updatedAt
    ? leaderboardTimestampFormatter.format(new Date(leaderboard.updatedAt))
    : null

  return (
    <PageContainer>
      <section className="page-section play-page__hero card">
        <SectionTitle eyebrow="Play" title={playPageCopy.heading} />
        <p>{playPageCopy.description}</p>
      </section>

      <section className="page-section play-toolbar">
        <div className="play-toolbar__actions">
          <CTAButton
            label={isMuted ? 'Unmute' : 'Mute'}
            navigate={navigate}
            variant="ghost"
            onClick={() => setIsMuted((value) => !value)}
          />
          <CTAButton label={shareLabel} navigate={navigate} variant="secondary" onClick={() => void handleShare()} />
        </div>
      </section>

      <section className="page-section play-layout">
        <div className="play-layout__game card" ref={frameRef}>
          <GameScreen
            key={sessionKey}
            isMuted={isMuted}
            onRunEnded={(summary) => {
              void recordRun(summary).then((result) => {
                setLatestRun(result)
                setLeaderboard({
                  leaderboard: result.leaderboard,
                  totalRuns: result.totalRuns,
                  playerBestScore: result.bestScore,
                  updatedAt: new Date().toISOString(),
                  source: result.source,
                })
                setIsLeaderboardReady(true)
              })
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

      <section className="page-section card run-stats-section">
        <SectionTitle eyebrow="Leaderboard" title="Global leaderboard" />
        <p className="run-stats-copy">
          {latestRun
            ? (
              <>
                You scored <strong>{latestRun.score}</strong> and now sit in the <strong>top {latestRun.topPercent}%</strong> across <strong>{latestRun.totalRuns}</strong> recorded runs.
              </>
            )
            : isLeaderboardReady
              ? (
                <>
                  Previous records are shown below even before you start, and the board syncs with shared runs whenever the leaderboard API is available.
                </>
              )
              : (
                <>
                  Loading previous records...
                </>
              )}
        </p>
        <div className="run-stats-grid">
          <div className="run-stat-card run-stat-card--score">
            <span className="hud-label">Latest score</span>
            <strong>{latestRun?.score ?? 0}</strong>
          </div>
          <div className="run-stat-card run-stat-card--rank">
            <span className="hud-label">Percentile</span>
            <strong>{latestRun ? `Top ${latestRun.topPercent}%` : isLeaderboardReady ? 'Ready' : 'Loading'}</strong>
          </div>
          <div className="run-stat-card">
            <span className="hud-label">Best score</span>
            <strong>{bestScore}</strong>
          </div>
          <div className="run-stat-card">
            <span className="hud-label">Total runs</span>
            <strong>{totalRuns}</strong>
          </div>
        </div>
        <div className="leaderboard-panel">
          <div className="leaderboard-panel__top">
            <div>
              <strong>Top runs</strong>
              <p>
                {leaderboardStatus === 'remote' ? 'Shared leaderboard live' : 'Showing saved local results'}
                {updatedAt ? `, updated ${updatedAt}` : ''}
              </p>
            </div>
            {latestRun ? <span className="leaderboard-badge">Rank #{latestRun.rank}</span> : null}
          </div>
          {displayedLeaderboard.length ? (
            <div className="leaderboard-table" role="table" aria-label="Leaderboard">
              <div className="leaderboard-table__head" role="row">
                <span>Rank</span>
                <span>Player</span>
                <span>Score</span>
                <span>Flowers</span>
              </div>
              {displayedLeaderboard.map((entry, index) => (
                <div
                  key={`${entry.playerId}-${entry.recordedAt}-${index}`}
                  className={`leaderboard-table__row ${entry.playerId === currentPlayerId ? 'is-current-player' : ''}`}
                  role="row"
                >
                  <span>#{index + 1}</span>
                  <span>{entry.playerId === currentPlayerId ? 'You' : entry.displayName}</span>
                  <strong>{entry.score}</strong>
                  <span>{entry.shotCount}</span>
                </div>
              ))}
            </div>
          ) : isLeaderboardReady ? (
            <p className="leaderboard-empty">No runs have been recorded yet.</p>
          ) : (
            <p className="leaderboard-empty">Loading previous records...</p>
          )}
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
