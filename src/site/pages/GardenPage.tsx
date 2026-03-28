import { DashboardShell } from '../components/DashboardShell'
import { CTAButton } from '../components/CTAButton'
import {
  getActiveEventState,
  getDailyCompletion,
  getDailyRefreshCountdown,
  getLevelProgress,
  getOwnedCosmetics,
  getTargetRewardAmount,
  type ProgressionState,
} from '../progression'
import type { Route } from '../router'

type GardenPageProps = {
  navigate: (route: Route) => void
  progression: ProgressionState
}

function buildMilestones(progression: ProgressionState) {
  return [
    { label: 'Run Keeper', icon: '◎', progress: progression.stats.totalRuns, goal: 12 },
    { label: 'Merge Gardener', icon: '◌', progress: progression.stats.totalMerges, goal: 60 },
    { label: 'High Bloom', icon: '✦', progress: progression.stats.bestScore, goal: 800 },
    { label: 'Combo Tender', icon: '×', progress: progression.stats.bestCombo, goal: 6 },
  ]
}

export function GardenPage({ navigate, progression }: GardenPageProps) {
  const level = getLevelProgress(progression)
  const daily = getDailyCompletion(progression)
  const ownedCosmetics = getOwnedCosmetics(progression)
  const milestones = buildMilestones(progression)
  const eventState = getActiveEventState()
  const dailyRefreshLabel = getDailyRefreshCountdown()

  return (
    <DashboardShell
      route="/garden"
      navigate={navigate}
      progression={progression}
      title="Garden"
      description="Progress room"
    >
      <section className="garden-page-grid">
        <article className="card garden-level-card">
          <span className="section-title__eyebrow">Growth Track</span>
          <h2>Level {progression.level}</h2>
          <div className="garden-progress garden-progress--large">
            <div className="garden-progress__fill" style={{ width: Math.max(level.progress * 100, 6) + '%' }} />
          </div>
          <div className="garden-level-card__stats garden-level-card__stats--visual">
            <div>
              <span className="hud-label">XP</span>
              <strong>{level.remainingXp}</strong>
            </div>
            <div>
              <span className="hud-label">Owned</span>
              <strong>{ownedCosmetics.length}</strong>
            </div>
            <div>
              <span className="hud-label">Daily</span>
              <strong>{daily.completed} / {daily.total}</strong>
            </div>
          </div>
        </article>

        <article className="card garden-collection-card">
          <div className="garden-collection-card__top">
            <span className="section-title__eyebrow">Collection</span>
            <CTAButton label="Market" href="/market" navigate={navigate} variant="secondary" />
          </div>
          <div className="garden-collection-grid garden-collection-grid--visual">
            {ownedCosmetics.map((item) => (
              <div className="garden-collection-chip" key={item.id}>
                <span className="garden-collection-chip__swatch" style={{ background: item.accent, boxShadow: `0 10px 22px ${item.glow}` }} />
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.kind === 'skin' ? 'Skin' : 'Board'}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="garden-milestone-grid">
        {milestones.map((milestone) => {
          const percent = Math.min((milestone.progress / milestone.goal) * 100, 100)
          const completed = milestone.progress >= milestone.goal
          return (
            <article className={completed ? 'card garden-milestone-card is-complete' : 'card garden-milestone-card'} key={milestone.label}>
              <span className="garden-milestone-card__icon">{milestone.icon}</span>
              <h3>{milestone.label}</h3>
              <div className="garden-progress">
                <div className="garden-progress__fill" style={{ width: Math.max(percent, milestone.progress > 0 ? 8 : 0) + '%' }} />
              </div>
              <strong>{Math.min(milestone.progress, milestone.goal)} / {milestone.goal}</strong>
            </article>
          )
        })}
      </section>

      <section className="garden-daily-board">
        <article className="card garden-daily-board__card garden-daily-board__card--visual">
          <div className="garden-daily-board__top">
            <span className="section-title__eyebrow">Daily Cultivation</span>
            <strong>{dailyRefreshLabel}</strong>
          </div>
          <div className="daily-target-list daily-target-list--visual">
            {progression.daily.targets.map((target) => {
              const percent = Math.min((target.progress / target.goal) * 100, 100)
              const reward = getTargetRewardAmount(target.rewardEmeralds, eventState.dailyEmeraldMultiplier)
              return (
                <div className="daily-target-list__item" key={target.id}>
                  <div className="daily-target-list__copy">
                    <strong>{target.title}</strong>
                    <span>{reward}◆</span>
                  </div>
                  <div className="garden-progress">
                    <div className="garden-progress__fill" style={{ width: Math.max(percent, target.progress > 0 ? 8 : 0) + '%' }} />
                  </div>
                  <div className="daily-target-list__meta">
                    <span>{target.progress} / {target.goal}</span>
                    <span>{target.rewarded ? 'Paid' : target.completed ? 'Claimed' : 'Live'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </article>
      </section>
    </DashboardShell>
  )
}
