import { useEffect, useMemo, useState } from 'react'
import { DashboardShell } from '../components/DashboardShell'
import type { ProgressionState } from '../progression'
import { getPlayerId, getCachedLeaderboardSnapshot, loadLeaderboard, type LeaderboardSnapshot } from '../../game/stats'
import type { Route } from '../router'

type RankingsPageProps = {
  navigate: (route: Route) => void
  progression: ProgressionState
}

export function RankingsPage({ navigate, progression }: RankingsPageProps) {
  const [snapshot, setSnapshot] = useState<LeaderboardSnapshot | null>(() => getCachedLeaderboardSnapshot())
  const playerId = useMemo(() => getPlayerId(), [])

  useEffect(() => {
    void loadLeaderboard().then((next) => {
      setSnapshot(next)
    })
  }, [])

  const entries = snapshot?.leaderboard ?? []
  const podium = entries.slice(0, 3)
  const personalEntry = entries.find((entry) => entry.playerId === playerId) ?? null

  return (
    <DashboardShell
      route="/rankings"
      navigate={navigate}
      progression={progression}
      title="Rankings"
      description="A cleaner look at your best score, the live board, and how your growth loop translates into competitive pressure."
    >
      <section className="rankings-page-grid">
        <article className="card rankings-overview-card">
          <span className="section-title__eyebrow">Personal Record</span>
          <h2>{progression.stats.bestScore}</h2>
          <p>Your best bloom score so far, supported by {progression.stats.totalRuns} total runs and {progression.stats.totalMerges} lifetime merges.</p>
          <div className="rankings-overview-card__stats">
            <div>
              <span className="hud-label">Runs</span>
              <strong>{progression.stats.totalRuns}</strong>
            </div>
            <div>
              <span className="hud-label">Merges</span>
              <strong>{progression.stats.totalMerges}</strong>
            </div>
            <div>
              <span className="hud-label">Best Combo</span>
              <strong>x{progression.stats.bestCombo}</strong>
            </div>
          </div>
        </article>

        <article className="card rankings-overview-card rankings-overview-card--soft">
          <span className="section-title__eyebrow">Board Status</span>
          <h2>{personalEntry ? `#${entries.findIndex((entry) => entry.playerId === playerId) + 1}` : 'Unranked'}</h2>
          <p>{personalEntry ? 'Your last recorded position is live in the current cached board.' : 'Play one more run to stamp a fresh leaderboard position.'}</p>
          <div className="rankings-overview-card__stats">
            <div>
              <span className="hud-label">Entries</span>
              <strong>{entries.length}</strong>
            </div>
            <div>
              <span className="hud-label">Source</span>
              <strong>{snapshot?.source ?? 'local'}</strong>
            </div>
            <div>
              <span className="hud-label">Updated</span>
              <strong>{snapshot?.updatedAt ? new Date(snapshot.updatedAt).toLocaleDateString() : 'Today'}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="rankings-podium-grid">
        {podium.map((entry, index) => (
          <article className={index === 0 ? 'card podium-card is-first' : 'card podium-card'} key={entry.playerId + entry.recordedAt}>
            <span className="section-title__eyebrow">Top {index + 1}</span>
            <h3>{entry.displayName || 'Anonymous Bloom'}</h3>
            <strong>{entry.score}</strong>
            <p>{entry.shotCount} shots used in that run.</p>
          </article>
        ))}
      </section>

      <section className="card rankings-table-card">
        <div className="rankings-table-card__header">
          <div>
            <span className="section-title__eyebrow">Top Keepers</span>
            <h2>Current board snapshot</h2>
          </div>
        </div>
        <div className="rankings-table">
          {entries.slice(0, 8).map((entry, index) => (
            <div className={entry.playerId === playerId ? 'rankings-table__row is-player' : 'rankings-table__row'} key={entry.playerId + entry.recordedAt}>
              <span className="rankings-table__rank">{index + 1}</span>
              <div>
                <strong>{entry.displayName || 'Anonymous Bloom'}</strong>
                <p>{new Date(entry.recordedAt).toLocaleDateString()}</p>
              </div>
              <strong>{entry.score}</strong>
            </div>
          ))}
        </div>
      </section>
    </DashboardShell>
  )
}
