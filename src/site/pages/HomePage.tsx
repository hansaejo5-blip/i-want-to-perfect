import { useEffect, useMemo, useState } from 'react'
import heroShot from '../../assets/hero-shot.png'
import { CTAButton } from '../components/CTAButton'
import { DashboardShell } from '../components/DashboardShell'
import {
  getActiveEventState,
  getDailyCompletion,
  getDailyRefreshCountdown,
  getLevelProgress,
  getTargetRewardAmount,
  type ProgressionState,
} from '../progression'
import type { Route } from '../router'

type HomePageProps = {
  navigate: (route: Route) => void
  progression: ProgressionState
}

const LOOP_STEPS = [
  { label: 'Play', icon: '◎' },
  { label: 'Score', icon: '▲' },
  { label: 'XP', icon: '◌' },
  { label: 'Reward', icon: '◆' },
  { label: 'Market', icon: '◔' },
]

export function HomePage({ navigate, progression }: HomePageProps) {
  const level = getLevelProgress(progression)
  const daily = getDailyCompletion(progression)
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
      description="Garden growth hub"
      actions={
        <div className="dashboard-hero-actions">
          <CTAButton label="Play Now" href="/play#game" navigate={navigate} />
          <CTAButton label="Open Market" href="/market" navigate={navigate} variant="secondary" />
        </div>
      }
    >
      <section className="hub-home-grid home-dashboard-grid">
        <div className="hub-home-grid__main home-dashboard-grid__main">
          <article className="card home-hero-card">
            <div className="home-hero-visual">
              <img className="home-hero-visual__image" src={heroShot} alt="Perfect Drop gameplay board" />
            </div>

            <div className="home-hero-copy">
              <h2>Perfect Drop</h2>
            </div>

            <div className="home-hero-metrics">
              <div className="card home-mini-card">
                <span className="home-metric-icon">◌</span>
                <strong>Lv.{progression.level}</strong>
                <span>{level.remainingXp} XP</span>
              </div>
              <div className="card home-mini-card home-mini-card--accent">
                <span className="home-metric-icon">◆</span>
                <strong>{Math.round(daily.percent * 100)}%</strong>
                <span>{daily.completed} / {daily.total}</span>
              </div>
              <div className="card home-mini-card">
                <span className="home-metric-icon">◔</span>
                <strong>{eventState.isActive ? 'Boost' : 'Standard'}</strong>
                <span>{eventState.isActive ? eventState.countdownLabel : 'Ended'}</span>
              </div>
            </div>
          </article>

          <section className="home-visual-grid">
            <article className="card home-loop-card">
              <div className="home-loop-diagram">
                {LOOP_STEPS.map((step, index) => (
                  <div className="home-loop-diagram__step" key={step.label}>
                    <span className="home-loop-diagram__chip">
                      <b>{step.icon}</b>
                      <small>{step.label}</small>
                    </span>
                    {index < LOOP_STEPS.length - 1 ? <i aria-hidden="true">→</i> : null}
                  </div>
                ))}
              </div>
            </article>

            <article className="card home-progress-card">
              <div className="home-progress-card__row home-progress-card__row--visual">
                <strong>{level.xpIntoLevel}</strong>
                <span>/ {level.nextLevelXp}</span>
              </div>
              <div className="garden-progress garden-progress--large">
                <div className="garden-progress__fill" style={{ width: Math.max(level.progress * 100, 6) + '%' }} />
              </div>
              <div className="home-progress-card__stats home-progress-card__stats--visual">
                <span><b>◆</b>{progression.emeralds}</span>
                <span><b>◎</b>{progression.stats.bestScore}</span>
                <span><b>×</b>{Math.max(progression.stats.bestCombo, 1)}</span>
              </div>
            </article>
          </section>
        </div>

        <div className="hub-home-grid__side home-dashboard-grid__side">
          <article className="card daily-target-card daily-target-card--accent home-daily-card">
            <div className="home-daily-card__top">
              <div>
                <span className="section-title__eyebrow">Daily Board</span>
                <h2>{Math.round(daily.percent * 100)}%</h2>
              </div>
              <strong>{dailyRefreshLabel}</strong>
            </div>
            <div className="garden-progress garden-progress--large">
              <div className="garden-progress__fill" style={{ width: Math.max(daily.percent * 100, 6) + '%' }} />
            </div>
            <div className="home-daily-stack">
              {featuredTargets.map((target) => {
                const percent = target.goal > 0 ? Math.min((target.progress / target.goal) * 100, 100) : 0
                const reward = getTargetRewardAmount(target.rewardEmeralds, eventState.dailyEmeraldMultiplier)
                return (
                  <div className="home-daily-stack__item" key={target.id}>
                    <div className="home-daily-stack__label">
                      <strong>{target.title}</strong>
                      <span>{reward}◆</span>
                    </div>
                    <div className="garden-progress">
                      <div className="garden-progress__fill" style={{ width: Math.max(percent, target.progress > 0 ? 8 : 0) + '%' }} />
                    </div>
                    <div className="home-daily-stack__meta">
                      <span>{target.progress} / {target.goal}</span>
                      <span>{target.completed ? 'Done' : 'Live'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </article>

          <article className={`card home-event-compact ${eventState.cardClassName}`}>
            <span className="section-title__eyebrow">Event</span>
            <strong>{eventState.isActive ? 'XP +20%' : 'Standard'}</strong>
            <div className="home-event-compact__chips">
              <span>◆ +10%</span>
              <span>{eventState.countdownLabel}</span>
            </div>
          </article>

          <article className="card home-reward-card">
            <span className="section-title__eyebrow">Reward Focus</span>
            <strong>{topRewardTarget ? topRewardTarget.title : 'Daily Board'}</strong>
            <div className="home-reward-card__stats">
              <span><b>XP</b>{recentRewards?.xpGained ?? 0}</span>
              <span><b>◆</b>{recentRewards?.emeraldsGained ?? 0}</span>
            </div>
            <div className="home-reward-card__footer">
              <span>Skin</span>
              <span>Board</span>
            </div>
          </article>
        </div>
      </section>
    </DashboardShell>
  )
}
