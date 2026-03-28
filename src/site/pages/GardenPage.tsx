import { DashboardShell } from '../components/DashboardShell'
import { CTAButton } from '../components/CTAButton'
import { getDailyCompletion, getLevelProgress, getOwnedSkins, type ProgressionState } from '../progression'
import type { Route } from '../router'

type GardenPageProps = {
  navigate: (route: Route) => void
  progression: ProgressionState
}

function buildMilestones(progression: ProgressionState) {
  return [
    {
      label: 'Run Keeper',
      description: 'Play 12 runs to settle into the garden loop.',
      progress: progression.stats.totalRuns,
      goal: 12,
    },
    {
      label: 'Merge Gardener',
      description: 'Reach 60 total merges across all sessions.',
      progress: progression.stats.totalMerges,
      goal: 60,
    },
    {
      label: 'High Bloom',
      description: 'Post a best score of 800 or higher.',
      progress: progression.stats.bestScore,
      goal: 800,
    },
    {
      label: 'Combo Tender',
      description: 'Hit a combo chain of 6 in one run.',
      progress: progression.stats.bestCombo,
      goal: 6,
    },
  ]
}

export function GardenPage({ navigate, progression }: GardenPageProps) {
  const level = getLevelProgress(progression)
  const daily = getDailyCompletion(progression)
  const ownedSkins = getOwnedSkins(progression)
  const milestones = buildMilestones(progression)

  return (
    <DashboardShell
      route="/garden"
      navigate={navigate}
      progression={progression}
      title="Garden"
      description="Your calmer progress room: level pace, unlocked cosmetics, daily cultivation, and long-term milestones all in one place."
    >
      <section className="garden-page-grid">
        <article className="card garden-level-card">
          <span className="section-title__eyebrow">Growth Track</span>
          <h2>Level {progression.level} keeper path</h2>
          <div className="garden-progress garden-progress--large">
            <div className="garden-progress__fill" style={{ width: Math.max(level.progress * 100, 6) + '%' }} />
          </div>
          <p>{level.xpIntoLevel} XP banked in this tier, with {level.remainingXp} XP remaining before the next unlock lane opens.</p>
          <div className="garden-level-card__stats">
            <div>
              <span className="hud-label">Total XP</span>
              <strong>{progression.totalXp}</strong>
            </div>
            <div>
              <span className="hud-label">Owned Skins</span>
              <strong>{ownedSkins.length}</strong>
            </div>
            <div>
              <span className="hud-label">Daily Done</span>
              <strong>{daily.completed} / {daily.total}</strong>
            </div>
          </div>
        </article>

        <article className="card garden-collection-card">
          <span className="section-title__eyebrow">Collection</span>
          <h2>Unlocked garden finishes</h2>
          <div className="garden-collection-grid">
            {ownedSkins.map((skin) => (
              <div className="garden-collection-chip" key={skin.id}>
                <span className="garden-collection-chip__swatch" style={{ background: skin.accent, boxShadow: `0 10px 22px ${skin.glow}` }} />
                <div>
                  <strong>{skin.name}</strong>
                  <p>{skin.preview}</p>
                </div>
              </div>
            ))}
          </div>
          <CTAButton label="Visit Market" href="/market" navigate={navigate} variant="secondary" />
        </article>
      </section>

      <section className="garden-milestone-grid">
        {milestones.map((milestone) => {
          const percent = Math.min((milestone.progress / milestone.goal) * 100, 100)
          const completed = milestone.progress >= milestone.goal
          return (
            <article className={completed ? 'card garden-milestone-card is-complete' : 'card garden-milestone-card'} key={milestone.label}>
              <span className="section-title__eyebrow">{completed ? 'Complete' : 'Growing'}</span>
              <h3>{milestone.label}</h3>
              <p>{milestone.description}</p>
              <div className="garden-progress">
                <div className="garden-progress__fill" style={{ width: Math.max(percent, milestone.progress > 0 ? 8 : 0) + '%' }} />
              </div>
              <strong>{Math.min(milestone.progress, milestone.goal)} / {milestone.goal}</strong>
            </article>
          )
        })}
      </section>

      <section className="garden-daily-board">
        <article className="card garden-daily-board__card">
          <span className="section-title__eyebrow">Daily Cultivation</span>
          <h2>Targets that feed the emerald loop</h2>
          <div className="daily-target-list">
            {progression.daily.targets.map((target) => {
              const percent = Math.min((target.progress / target.goal) * 100, 100)
              return (
                <div className="daily-target-list__item" key={target.id}>
                  <div className="daily-target-list__copy">
                    <strong>{target.title}</strong>
                    <span>{target.progress} / {target.goal}</span>
                  </div>
                  <div className="garden-progress">
                    <div className="garden-progress__fill" style={{ width: Math.max(percent, target.progress > 0 ? 8 : 0) + '%' }} />
                  </div>
                  <p>{target.description} {target.rewarded ? 'Reward paid.' : `Reward: ${target.rewardEmeralds} emeralds.`}</p>
                </div>
              )
            })}
          </div>
        </article>
      </section>
    </DashboardShell>
  )
}
