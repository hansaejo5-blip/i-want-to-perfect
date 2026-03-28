import { useEffect, useMemo, useState } from 'react'
import { CTAButton } from '../components/CTAButton'
import { DashboardShell } from '../components/DashboardShell'
import { AppLink } from '../components/AppLink'
import {
  getActiveEventState,
  getDailyCompletion,
  getDailyRefreshCountdown,
  getEquippedBackground,
  getEquippedSkin,
  getLevelProgress,
  getTargetRewardAmount,
  type ProgressionState,
} from '../progression'
import type { Route } from '../router'

type HomePageProps = {
  navigate: (route: Route) => void
  progression: ProgressionState
}

export function HomePage({ navigate, progression }: HomePageProps) {
  const level = getLevelProgress(progression)
  const daily = getDailyCompletion(progression)
  const skin = getEquippedSkin(progression)
  const background = getEquippedBackground(progression)
  const recentRewards = progression.recentRewards
  const featuredTargets = progression.daily.targets
  const topRewardTarget = useMemo(
    () => [...progression.daily.targets].sort((left, right) => right.rewardEmeralds - left.rewardEmeralds)[0],
    [progression.daily.targets],
  )
  const [eventState, setEventState] = useState(() => getActiveEventState())
  const [dailyRefreshLabel, setDailyRefreshLabel] = useState(() => getDailyRefreshCountdown())

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setEventState(getActiveEventState())
      setDailyRefreshLabel(getDailyRefreshCountdown())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <DashboardShell
      route="/"
      navigate={navigate}
      progression={progression}
      title="Perfect Drop"
      description="A softer garden hub where every run now feeds level growth, daily rewards, emerald income, and practical market choices."
      actions={
        <div className="dashboard-hero-actions">
          <CTAButton label="Play a Run" href="/play#game" navigate={navigate} />
          <CTAButton label="Open Market" href="/market" navigate={navigate} variant="secondary" />
        </div>
      }
    >
      <section className="hub-home-grid">
        <div className="hub-home-grid__main">
          <article className={`card growth-event-banner ${eventState.cardClassName}`}>
            <div>
              <span className="growth-event-banner__tag">{eventState.tagLabel}</span>
              <h2>{eventState.event.title}</h2>
              <p>{eventState.event.description}</p>
              <p className="growth-event-banner__bonus">{eventState.event.bonusSummary}</p>
            </div>
            <div className="growth-event-banner__timer">
              <strong>{eventState.countdownLabel}</strong>
              <span>{eventState.isActive ? 'remaining' : 'event closed'}</span>
              <button
                className="growth-event-banner__cta"
                type="button"
                disabled={!eventState.isActive}
                onClick={() => navigate('/play')}
              >
                {eventState.ctaLabel}
              </button>
            </div>
          </article>

          <article className="card home-play-entry-card">
            <div className="home-play-entry-card__header">
              <div>
                <span className="section-title__eyebrow">Ready to Drop</span>
                <h2>One more bloom run now feeds your whole garden.</h2>
                <p>Today&apos;s board, daily payout path, and current event bonus all connect directly to the same run, so the next match has immediate value.</p>
              </div>
              <div className="home-play-entry-card__meta">
                <div>
                  <span className="hud-label">Best Score</span>
                  <strong>{progression.stats.bestScore}</strong>
                </div>
                <div>
                  <span className="hud-label">Recent Run</span>
                  <strong>{recentRewards?.run.score ?? 0}</strong>
                </div>
              </div>
            </div>

            <div className={`home-play-stage-preview ${background.previewClass}`}>
              <div
                className="home-play-stage-preview__board"
                style={{ background: `linear-gradient(180deg, ${background.boardGradient[0]} 0%, ${background.boardGradient[1]} 100%)` }}
              >
                <div className="home-play-stage-preview__glass" />
                <div className="home-play-stage-preview__foliage" />
                <div className="home-orb home-orb--rose" />
                <div
                  className={`home-orb home-orb--mint ${skin.previewClass}`}
                  style={{ background: skin.accent, boxShadow: `0 18px 30px ${skin.glow}` }}
                >
                  <span className="home-orb__core" />
                </div>
                <div className="home-orb home-orb--seed" />
              </div>
            </div>

            <div className="home-play-entry-card__footer">
              <div className="home-highlight-pill home-highlight-pill--combo">x{Math.max(progression.stats.bestCombo, 4)} combo ceiling</div>
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
              <p>{level.xpIntoLevel} / {level.nextLevelXp} XP in this level. {level.remainingXp} XP left until the next reward lane opens.</p>
            </article>

            <article className="card hub-stat-card">
              <span className="section-title__eyebrow">Today&apos;s Best Payout</span>
              <h3>{topRewardTarget ? `${topRewardTarget.title} pays first` : 'Daily board rotates automatically'}</h3>
              <p>
                {topRewardTarget
                  ? `${topRewardTarget.description} Reward: ${getTargetRewardAmount(topRewardTarget.rewardEmeralds, eventState.dailyEmeraldMultiplier)} emeralds${eventState.isActive ? ' during the current event bonus.' : '.'}`
                  : `The next daily board refresh lands in ${dailyRefreshLabel}.`}
              </p>
            </article>

            <article className="card hub-stat-card">
              <span className="section-title__eyebrow">Run Finish</span>
              <h3>{skin.name}</h3>
              <p>{skin.preview}</p>
              <AppLink href="/market" navigate={navigate} className="hub-inline-link">Manage market choices</AppLink>
            </article>
          </div>
        </div>

        <div className="hub-home-grid__side">
          <article className="card daily-target-card daily-target-card--accent">
            <div className="daily-target-card__header">
              <div>
                <span className="section-title__eyebrow">Daily Targets</span>
                <h2>{Math.round(daily.percent * 100)}% complete</h2>
                <p>Refresh in {dailyRefreshLabel}. Today&apos;s four targets rotate automatically.</p>
              </div>
              <strong>{daily.completed} / {daily.total}</strong>
            </div>
            <div className="garden-progress garden-progress--large">
              <div className="garden-progress__fill" style={{ width: Math.max(daily.percent * 100, 6) + '%' }} />
            </div>
            <div className="daily-target-list">
              {featuredTargets.map((target) => {
                const percent = target.goal > 0 ? Math.min((target.progress / target.goal) * 100, 100) : 0
                const reward = getTargetRewardAmount(target.rewardEmeralds, eventState.dailyEmeraldMultiplier)
                return (
                  <div className="daily-target-list__item" key={target.id}>
                    <div className="daily-target-list__copy">
                      <strong>{target.title}</strong>
                      <span>{target.progress} / {target.goal}</span>
                    </div>
                    <div className="garden-progress">
                      <div className="garden-progress__fill" style={{ width: Math.max(percent, target.progress > 0 ? 8 : 0) + '%' }} />
                    </div>
                    <p>{target.description} Reward: {reward} emeralds{eventState.isActive ? ' with event boost.' : '.'}</p>
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
                <span className="hud-label">Runs</span>
                <strong>{progression.stats.totalRuns}</strong>
              </div>
              <div>
                <span className="hud-label">Merges</span>
                <strong>{progression.stats.totalMerges}</strong>
              </div>
            </div>
          </article>

          <article className="card hub-side-card">
            <span className="section-title__eyebrow">Savings Path</span>
            <h3>Use dailies before passive grinding</h3>
            <p>A starter board unlock is still close enough to chase, but the premium skin now needs multiple daily clears and event windows to feel worth the spend.</p>
            <CTAButton label="Open Market" href="/market" navigate={navigate} variant="secondary" block />
          </article>
        </div>
      </section>
    </DashboardShell>
  )
}
