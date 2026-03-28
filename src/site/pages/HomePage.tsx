import { CTAButton } from '../components/CTAButton'
import { DashboardShell } from '../components/DashboardShell'
import { AppLink } from '../components/AppLink'
import { getDailyCompletion, getEquippedSkin, getLevelProgress, type ProgressionState } from '../progression'
import type { Route } from '../router'

type HomePageProps = {
  navigate: (route: Route) => void
  progression: ProgressionState
}

export function HomePage({ navigate, progression }: HomePageProps) {
  const level = getLevelProgress(progression)
  const daily = getDailyCompletion(progression)
  const skin = getEquippedSkin(progression)
  const recentRewards = progression.recentRewards
  const featuredTargets = progression.daily.targets.slice(0, 3)

  return (
    <DashboardShell
      route="/"
      navigate={navigate}
      progression={progression}
      title="Perfect Drop"
      description="A softer garden hub where every run now grows your level, daily board, emerald stash, and skin collection."
      actions={
        <div className="dashboard-hero-actions">
          <CTAButton label="Play a Run" href="/play#game" navigate={navigate} />
          <CTAButton label="Open Market" href="/market" navigate={navigate} variant="secondary" />
        </div>
      }
    >
      <section className="hub-home-grid">
        <div className="hub-home-grid__main">
          <article className="card growth-event-banner">
            <div>
              <span className="growth-event-banner__tag">Limited Time</span>
              <h2>Double Bloom Weekend</h2>
              <p>Every strong run this weekend feels more meaningful because XP, emeralds, and rank pressure now connect into one growth loop.</p>
            </div>
            <div className="growth-event-banner__timer">
              <strong>22:45:12</strong>
              <span>remaining</span>
            </div>
          </article>

          <article className="card home-play-entry-card">
            <div className="home-play-entry-card__header">
              <div>
                <span className="section-title__eyebrow">Ready to Drop</span>
                <h2>One more bloom run now feeds your whole garden.</h2>
                <p>Score converts into XP, daily target progress, emerald rewards, and new skin unlocks without leaving the same calm Perfect Drop world.</p>
              </div>
              <div className="home-play-entry-card__meta">
                <div>
                  <span className="hud-label">Best Score</span>
                  <strong>{progression.stats.bestScore}</strong>
                </div>
                <div>
                  <span className="hud-label">Total Runs</span>
                  <strong>{progression.stats.totalRuns}</strong>
                </div>
              </div>
            </div>

            <div className="home-play-stage-preview">
              <div className="home-play-stage-preview__board">
                <span className="home-play-stage-preview__pill">Ready to Drop</span>
                <div className="home-orb home-orb--rose" />
                <div className="home-orb home-orb--mint" style={{ background: skin.accent, boxShadow: `0 18px 30px ${skin.glow}` }} />
                <div className="home-orb home-orb--seed" />
              </div>
            </div>

            <div className="home-play-entry-card__footer">
              <div className="home-highlight-pill home-highlight-pill--combo">x{Math.max(progression.stats.bestCombo, 5)} combo</div>
              <div className="home-highlight-pill">{Math.round(level.progress * 100)}% to Lv.{progression.level + 1}</div>
            </div>
          </article>

          <div className="hub-home-secondary-grid">
            <article className="card hub-stat-card">
              <span className="section-title__eyebrow">Level Track</span>
              <h3>Current growth lane</h3>
              <div className="garden-progress garden-progress--large">
                <div className="garden-progress__fill" style={{ width: Math.max(level.progress * 100, 6) + '%' }} />
              </div>
              <p>{level.xpIntoLevel} / {level.nextLevelXp} XP in this level. {level.remainingXp} XP left to bloom upward.</p>
            </article>

            <article className="card hub-stat-card">
              <span className="section-title__eyebrow">Recent Reward</span>
              <h3>{recentRewards ? `+${recentRewards.xpGained} XP from your last run` : 'Your next run will feed the board'}</h3>
              <p>
                {recentRewards
                  ? `${recentRewards.emeraldsGained} emeralds earned${recentRewards.reasonLabels.length ? ` from ${recentRewards.reasonLabels.join(', ')}` : ''}.`
                  : 'The loop is now simple: play, earn XP, finish targets, and spend emeralds on garden skins.'}
              </p>
            </article>

            <article className="card hub-stat-card">
              <span className="section-title__eyebrow">Market Hook</span>
              <h3>{skin.name} is equipped</h3>
              <p>{skin.preview}</p>
              <AppLink href="/market" navigate={navigate} className="hub-inline-link">Browse skin market</AppLink>
            </article>
          </div>
        </div>

        <div className="hub-home-grid__side">
          <article className="card daily-target-card daily-target-card--accent">
            <div className="daily-target-card__header">
              <div>
                <span className="section-title__eyebrow">Daily Targets</span>
                <h2>{Math.round(daily.percent * 100)}% complete</h2>
              </div>
              <strong>{daily.completed} / {daily.total}</strong>
            </div>
            <div className="garden-progress garden-progress--large">
              <div className="garden-progress__fill" style={{ width: Math.max(daily.percent * 100, 6) + '%' }} />
            </div>
            <div className="daily-target-list">
              {featuredTargets.map((target) => {
                const percent = target.goal > 0 ? Math.min((target.progress / target.goal) * 100, 100) : 0
                return (
                  <div className="daily-target-list__item" key={target.id}>
                    <div className="daily-target-list__copy">
                      <strong>{target.title}</strong>
                      <span>{target.progress} / {target.goal}</span>
                    </div>
                    <div className="garden-progress">
                      <div className="garden-progress__fill" style={{ width: Math.max(percent, target.progress > 0 ? 8 : 0) + '%' }} />
                    </div>
                    <p>{target.description} Reward: {target.rewardEmeralds} emeralds.</p>
                  </div>
                )
              })}
            </div>
          </article>

          <article className="card hub-side-card">
            <span className="section-title__eyebrow">Keeper Snapshot</span>
            <h3>Garden status at a glance</h3>
            <div className="hub-side-card__stats">
              <div>
                <span className="hud-label">Emeralds</span>
                <strong>{progression.emeralds}</strong>
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

          <article className="card hub-side-card">
            <span className="section-title__eyebrow">Rankings</span>
            <h3>Best run and repeat pressure</h3>
            <p>Your current best is <strong>{progression.stats.bestScore}</strong>. Return to Rankings for a full board view and a cleaner chase target.</p>
            <CTAButton label="Open Rankings" href="/rankings" navigate={navigate} variant="secondary" block />
          </article>
        </div>
      </section>
    </DashboardShell>
  )
}
