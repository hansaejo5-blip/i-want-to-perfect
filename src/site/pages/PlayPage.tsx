import { useEffect, useMemo, useRef, useState } from "react"
import { GameScreen } from "../../game/GameScreen"
import { getBallDefinition } from "../../game/entities/fruits"
import {
  getCachedLeaderboardSnapshot,
  getPlayerDisplayName,
  getPlayerId,
  loadLeaderboard,
  recordRun,
  savePlayerProfile,
  type LeaderboardEntry,
  type LeaderboardSnapshot,
  type RecordedRunSummary,
} from "../../game/stats"
import { CTAButton } from "../components/CTAButton"
import { FinalStagePreviewArt } from '../components/FinalStagePreviewArt'
import { DashboardShell } from "../components/DashboardShell"
import { SectionTitle } from "../components/SectionTitle"
import { playPageCopy } from "../data/content"
import { getAbsoluteSiteUrl, type Route } from "../router"
import { getActiveEventState, getEquippedBackground, getEquippedSkin, type ProgressionRunSummary, type ProgressionState } from "../progression"

type PlayPageProps = {
  navigate: (route: Route) => void
  progression: ProgressionState
  onCompleteRun: (summary: ProgressionRunSummary) => void
}

type LeaderboardFilter = "all" | "weekly" | "daily"
type FlowerTier = "seed" | "sprout" | "bloom" | "rare-bloom" | "mythic-bloom"

type RankedLeaderboardEntry = LeaderboardEntry & {
  rank: number
  isCurrentPlayer: boolean
  label: string
  tier: FlowerTier
}

type GoalTarget = {
  label: string
  scoreNeeded: number
  rank: number
}

const leaderboardTimestampFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

const filterOptions: Array<{ key: LeaderboardFilter; label: string }> = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "all", label: "All Time" },
]

function getShareText(latestRun: RecordedRunSummary | null, bestScore: number, totalRuns: number) {
  if (latestRun) {
    return "I just scored " + latestRun.score + " in Perfect Drop and hit the top " + latestRun.topPercent + "% of the leaderboard. Beat my run."
  }

  if (bestScore > 0) {
    return "My best score in Perfect Drop is " + bestScore + ". See if you can beat it."
  }

  if (totalRuns > 0) {
    return "Perfect Drop already has " + totalRuns + " recorded runs. Jump in and try to climb the leaderboard."
  }

  return "Play Perfect Drop and challenge a friend for the higher score."
}

function getLeaderboardLabel(entry: LeaderboardEntry, currentPlayerId: string) {
  if (entry.displayName.trim()) {
    return entry.displayName
  }

  return entry.playerId === currentPlayerId ? "You" : "Anonymous Bloom"
}

function isReliableTimestamp(value: string | null) {
  if (!value) {
    return false
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) === false && date.getUTCFullYear() >= 2024
}

function getFlowerTier(percentile: number | null, rank: number | null): FlowerTier {
  if (rank === 1 || (percentile !== null && percentile <= 1)) {
    return "mythic-bloom"
  }

  if (percentile !== null && percentile <= 5) {
    return "rare-bloom"
  }

  if (percentile !== null && percentile <= 15) {
    return "bloom"
  }

  if (percentile !== null && percentile <= 35) {
    return "sprout"
  }

  return "seed"
}

function getTierLabel(tier: FlowerTier) {
  switch (tier) {
    case "mythic-bloom":
      return "Mythic Bloom"
    case "rare-bloom":
      return "Rare Bloom"
    case "bloom":
      return "Bloom"
    case "sprout":
      return "Sprout"
    default:
      return "Seed"
  }
}

function buildRankedEntries(entries: LeaderboardEntry[], currentPlayerId: string) {
  return entries
    .slice()
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      if (left.shotCount !== right.shotCount) {
        return left.shotCount - right.shotCount
      }

      return left.recordedAt.localeCompare(right.recordedAt)
    })
    .map((entry, index, sorted) => {
      const rank = index + 1
      const percentile = Math.max(1, Math.ceil((rank / Math.max(sorted.length, 1)) * 100))
      return {
        ...entry,
        rank,
        label: getLeaderboardLabel(entry, currentPlayerId),
        isCurrentPlayer: entry.playerId === currentPlayerId,
        tier: getFlowerTier(percentile, rank),
      }
    })
}

function getGoalTargets(entries: RankedLeaderboardEntry[], currentScore: number) {
  const createGoal = (label: string, rank: number): GoalTarget => {
    const targetEntry = entries[rank - 1]
    if (!targetEntry) {
      return { label, rank, scoreNeeded: 0 }
    }

    return {
      label,
      rank,
      scoreNeeded: Math.max(targetEntry.score + 1 - currentScore, 0),
    }
  }

  return [
    createGoal("Top 10", 10),
    createGoal("Top 100", 100),
    createGoal("Top 10%", Math.max(1, Math.ceil(entries.length * 0.1))),
  ]
}

function getMotivationMessages(
  currentEntry: RankedLeaderboardEntry | null,
  previousEntry: RankedLeaderboardEntry | null,
  goals: GoalTarget[],
  filter: LeaderboardFilter,
  totalEntries: number,
) {
  if (!currentEntry) {
    return [
      "Play one strong run to claim your first spot on the board.",
      filter === "daily"
        ? "Daily runs reset at midnight UTC, so a clean run matters more."
        : filter === "weekly"
          ? "Weekly standings favor steady high scores across the last seven days."
          : "All-time board tracks the strongest bloom runs across the full field.",
    ]
  }

  const messages = [
    previousEntry
      ? "Only " + Math.max(previousEntry.score + 1 - currentEntry.score, 0) + " points to beat #" + previousEntry.rank
      : "You are holding the top spot right now.",
    "You are in the top " + Math.max(1, Math.ceil((currentEntry.rank / Math.max(totalEntries, 1)) * 100)) + "% of this board.",
  ]

  const reachableGoal = goals.find((goal) => goal.scoreNeeded > 0)
  if (reachableGoal) {
    messages.push("One more strong run could push you into the " + reachableGoal.label + ".")
  }

  return messages.slice(0, 3)
}

function getFilterCopy(filter: LeaderboardFilter) {
  switch (filter) {
    case "weekly":
      return "Weekly board uses your best run from the last seven days."
    case "daily":
      return "Daily board resets at midnight UTC and only counts today's best run."
    default:
      return "All-time board tracks the strongest bloom runs across the full field."
  }
}

const PLAY_FULLSCREEN_FLAG = 'perfect-drop-enter-fullscreen'

export function PlayPage({ navigate, progression, onCompleteRun }: PlayPageProps) {
  const [sessionKey, setSessionKey] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [latestRun, setLatestRun] = useState<RecordedRunSummary | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardSnapshot | null>(() => getCachedLeaderboardSnapshot("daily"))
  const [shareLabel, setShareLabel] = useState("Share Your Run")
  const [instagramLabel, setInstagramLabel] = useState("Copy for Instagram")
  const [playerNameInput, setPlayerNameInput] = useState(() => getPlayerDisplayName())
  const [nameActionLabel, setNameActionLabel] = useState("Save name")
  const [activeFilter, setActiveFilter] = useState<LeaderboardFilter>("daily")
  const [autoEnterFullscreenSignal] = useState(() => {
    try {
      if (window.sessionStorage.getItem(PLAY_FULLSCREEN_FLAG) === '1') {
        window.sessionStorage.removeItem(PLAY_FULLSCREEN_FLAG)
        return 1
      }
    } catch {
      // Ignore storage failures.
    }

    return 0
  })
  const frameRef = useRef<HTMLDivElement | null>(null)
  const shareResetRef = useRef<number | null>(null)
  const instagramResetRef = useRef<number | null>(null)
  const nameResetRef = useRef<number | null>(null)
  const currentPlayerId = useMemo(() => getPlayerId(), [])

  useEffect(() => {
    const jumpToGame = (behavior: ScrollBehavior) => {
      frameRef.current?.scrollIntoView({ block: 'start', behavior })
    }

    const shouldJumpToGame =
      window.location.hash === '#game' ||
      window.matchMedia('(max-width: 960px) and (pointer: coarse)').matches

    if (shouldJumpToGame) {
      window.requestAnimationFrame(() => {
        window.setTimeout(() => jumpToGame('auto'), 40)
      })
    }

    const handleHashChange = () => {
      if (window.location.hash === '#game') {
        jumpToGame('smooth')
      }
    }

    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      if (shareResetRef.current !== null) {
        window.clearTimeout(shareResetRef.current)
      }
      if (instagramResetRef.current !== null) {
        window.clearTimeout(instagramResetRef.current)
      }
      if (nameResetRef.current !== null) {
        window.clearTimeout(nameResetRef.current)
      }
    }
  }, [])

  useEffect(() => {
    void loadLeaderboard(activeFilter).then((snapshot) => {
      setLeaderboard(snapshot)
      setPlayerNameInput(snapshot.playerDisplayName)
    })
  }, [activeFilter])

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

  const scopedLatestRun = latestRun?.scope === activeFilter ? latestRun : null
  const totalRuns = scopedLatestRun?.totalRuns ?? leaderboard?.totalRuns ?? 0
  const bestScore = leaderboard?.playerBestScore ?? scopedLatestRun?.bestScore ?? 0

  const handleShare = async (mode: "default" | "instagram" = "default") => {
    const shareText = getShareText(latestRun, bestScore, totalRuns)
    const shareUrl = getAbsoluteSiteUrl("/play")
    const sharePayload = shareText + " " + shareUrl

    if (mode === "instagram") {
      try {
        await navigator.clipboard.writeText(sharePayload)
        setInstagramLabel("Copied")
      } catch {
        setInstagramLabel("Open Instagram Web")
      }

      if (instagramResetRef.current !== null) {
        window.clearTimeout(instagramResetRef.current)
      }
      instagramResetRef.current = window.setTimeout(() => setInstagramLabel("Copy for Instagram"), 2200)
      window.open("https://www.instagram.com/direct/inbox/", "_blank", "noopener,noreferrer")
      return
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Perfect Drop",
          text: shareText,
          url: shareUrl,
        })
        return
      }

      await navigator.clipboard.writeText(sharePayload)
      setShareLabel("Copied")
      if (shareResetRef.current !== null) {
        window.clearTimeout(shareResetRef.current)
      }
      shareResetRef.current = window.setTimeout(() => setShareLabel("Share Your Run"), 1800)
    } catch {
      // Ignore cancelled shares and clipboard failures.
    }
  }

  const handleSaveName = async () => {
    const snapshot = await savePlayerProfile(playerNameInput, activeFilter)
    setLeaderboard(snapshot)
    setPlayerNameInput(snapshot.playerDisplayName)
    setLatestRun((current) => {
      if (current === null) {
        return current
      }

      return {
        ...current,
        playerDisplayName: snapshot.playerDisplayName,
        leaderboard: snapshot.leaderboard,
      }
    })
    setNameActionLabel(snapshot.playerDisplayName ? "Saved" : "Cleared")
    if (nameResetRef.current !== null) {
      window.clearTimeout(nameResetRef.current)
    }
    nameResetRef.current = window.setTimeout(() => setNameActionLabel("Save name"), 1800)
  }

  const displayedLeaderboard = useMemo(
    () => (scopedLatestRun?.leaderboard.length ? scopedLatestRun.leaderboard : leaderboard?.leaderboard ?? []),
    [scopedLatestRun, leaderboard],
  )
  const leaderboardStatus = scopedLatestRun?.source ?? leaderboard?.source ?? "local"
  const leaderboardStorage = scopedLatestRun?.storage ?? leaderboard?.storage ?? "memory"
  const isLeaderboardReady = leaderboard?.scope === activeFilter
  const updatedAt = isReliableTimestamp(leaderboard?.updatedAt ?? null)
    ? leaderboardTimestampFormatter.format(new Date(leaderboard?.updatedAt ?? ""))
    : null

  const activeEntries = useMemo(() => {
    return buildRankedEntries(displayedLeaderboard, currentPlayerId)
  }, [currentPlayerId, displayedLeaderboard])

  const currentEntry = activeEntries.find((entry) => entry.playerId === currentPlayerId) ?? null
  const previousEntry = currentEntry && currentEntry.rank > 1 ? activeEntries[currentEntry.rank - 2] ?? null : null
  const aroundEntries = currentEntry
    ? activeEntries.slice(Math.max(0, currentEntry.rank - 3), currentEntry.rank + 2)
    : activeEntries.slice(0, 5)
  const podiumEntries = activeEntries.slice(0, 3)
  const topEntries = activeEntries.slice(0, 10)
  const goals = getGoalTargets(activeEntries, currentEntry?.score ?? bestScore)
  const percentile = currentEntry
    ? Math.max(1, Math.ceil((currentEntry.rank / Math.max(activeEntries.length, 1)) * 100))
    : scopedLatestRun?.topPercent ?? null
  const tier = getFlowerTier(percentile, currentEntry?.rank ?? scopedLatestRun?.rank ?? null)
  const motivationMessages = getMotivationMessages(currentEntry, previousEntry, goals, activeFilter, activeEntries.length)
  const nextBeatScore = previousEntry && currentEntry ? Math.max(previousEntry.score + 1 - currentEntry.score, 0) : 0
  const finalStageBall = getBallDefinition(7)
  const topTenCutoff = activeEntries[9]?.score ?? 240
  const dailyChallengeTarget = Math.max(180, Math.ceil(topTenCutoff / 10) * 10)
  const shareChallengeCopy = currentEntry
    ? "Share your score and challenge others to beat #" + currentEntry.rank + "."
    : "Post your best run and challenge others to beat your score."
  const equippedSkin = getEquippedSkin(progression)
  const equippedBackground = getEquippedBackground(progression)
  const [eventState, setEventState] = useState(() => getActiveEventState())

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setEventState(getActiveEventState())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <DashboardShell
      route="/play"
      navigate={navigate}
      progression={progression}
      title="Play"
      description="Stay in the focused game view, but keep your level, dailies, emeralds, and equipped skin visible while you play."
    >
      <section className="page-section play-live-grid" aria-label="Live play view">
        <div className={'play-live-grid__board card ' + equippedBackground.previewClass} ref={frameRef} id="game">
          <div className="play-live-grid__board-topbar">
            <div>
              <span className="hud-label">Live Board</span>
              <strong>{playPageCopy.heading}</strong>
            </div>
            <div className="play-live-grid__board-badges">
              <span className="play-mini-badge">Lv.{progression.level}</span>
              <span className="play-mini-badge">{progression.emeralds}◆</span>
              <span className={'play-mini-badge ' + eventState.cardClassName}>{eventState.isActive ? 'XP +20%' : 'Standard rewards'}</span>
            </div>
          </div>
          <div className="play-live-grid__board-stage">
            <GameScreen
              key={sessionKey}
              isMuted={isMuted}
              backgroundGradient={equippedBackground.boardGradient}
              skinVariant={equippedSkin.renderVariant}
              autoEnterFullscreenSignal={autoEnterFullscreenSignal}
              onRunEnded={(summary) => {
                onCompleteRun(summary)
                void recordRun(summary, activeFilter).then((result) => {
                  setLatestRun(result)
                  setPlayerNameInput(result.playerDisplayName)
                  setLeaderboard({
                    leaderboard: result.leaderboard,
                    totalRuns: result.totalRuns,
                    playerBestScore: result.leaderboard.find((entry) => entry.playerId === result.playerId)?.score ?? result.bestScore,
                    playerDisplayName: result.playerDisplayName,
                    updatedAt: new Date().toISOString(),
                    source: result.source,
                    storage: result.storage,
                    scope: result.scope,
                  })
                })
              }}
            />
          </div>
        </div>
        <div className="play-live-grid__side">
          <section className="card control-card">
            <SectionTitle eyebrow="Controls" title="Game controls" />
            <div className="control-stack">
              <CTAButton label="Restart" navigate={navigate} onClick={() => setSessionKey((value) => value + 1)} block />
              <CTAButton label="Fullscreen" navigate={navigate} variant="secondary" onClick={() => void toggleFullscreen()} block />
              <CTAButton label={isMuted ? "Unmute" : "Mute"} navigate={navigate} variant="ghost" onClick={() => setIsMuted((value) => !value)} block />
            </div>
            <div className="final-stage-preview" aria-label="Final stage preview">
              <div className="final-stage-preview__copy">
                <span className="hud-label">Final stage</span>
                <strong>{finalStageBall.name}</strong>
              </div>
              <div className="final-stage-preview__art">
                <FinalStagePreviewArt
                  level={finalStageBall.level}
                  size={136}
                  silhouette
                  className="final-stage-preview__canvas"
                  label="Final stage silhouette preview"
                />
              </div>
            </div>
          </section>
        </div>
      </section>

      <section className="page-section play-page__hero card">
        <SectionTitle eyebrow="Play" title={playPageCopy.heading} />
        <p>{playPageCopy.description}</p>
      </section>

      <section className="page-section play-hype-row" aria-label="Challenge and sharing prompts">
        <article className="play-hype-card play-hype-card--accent">
          <span className="hud-label">Daily Target</span>
          <strong>{dailyChallengeTarget}</strong>
          <p>Hit this score today, then send the challenge link to a friend.</p>
        </article>
        <article className="play-hype-card">
          <span className="hud-label">Share Hook</span>
          <strong>{currentEntry ? "Rank #" + currentEntry.rank : "First Run"}</strong>
          <p>{shareChallengeCopy}</p>
        </article>
        <article className="play-hype-card">
          <span className="hud-label">Top 10 Cutoff</span>
          <strong>{topTenCutoff}</strong>
          <p>{currentEntry ? "Only " + nextBeatScore + " points to the next spot." : "Set one strong run and start the chase."}</p>
        </article>
      </section>

      <section className="page-section play-toolbar">
        <div className="play-toolbar__actions">
          <CTAButton label={instagramLabel} navigate={navigate} variant="ghost" onClick={() => void handleShare("instagram")} />
          <CTAButton label={shareLabel} navigate={navigate} variant="secondary" onClick={() => void handleShare()} />
        </div>
      </section>

      <section className="page-section play-layout play-layout--supporting">
        <div className="play-layout__side">
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

      <section className="page-section card run-stats-section leaderboard-redesign">
        <SectionTitle eyebrow="Leaderboard" title="Daily challenge and leaderboard race" />
        <p className="run-stats-copy">
          {currentEntry
            ? (
              <>
                Your bloom cannon is currently <strong>#{currentEntry.rank}</strong> with a best of <strong>{currentEntry.score}</strong>. {previousEntry ? "Only " + nextBeatScore + " more points to pass #" + previousEntry.rank + "." : "You are setting the pace at the very top."}
              </>
            )
            : isLeaderboardReady
              ? (
                <>
                  The leaderboard is live and ready. Lock in one strong run to claim your place and start climbing.
                </>
              )
              : (
                <>
                  Loading previous records...
                </>
              )}
        </p>

        <div className="leaderboard-shell">
          <section className="rank-summary">
            <div className="rank-summary__hero">
              <div>
                <span className="leaderboard-eyebrow">Your Rank</span>
                <div className="rank-summary__headline">
                  <strong>{currentEntry ? "#" + currentEntry.rank : "Unranked"}</strong>
                  <span className={"tier-badge tier-badge--" + tier}>{getTierLabel(tier)}</span>
                </div>
                <p>
                  {currentEntry
                    ? "You are in the top " + percentile + "% of this board."
                    : "Play a run to lock in a global position and reveal your chase targets."}
                </p>
              </div>
              <button className="share-run-button rank-summary__share" type="button" onClick={() => void handleShare()}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 8a3 3 0 1 0-2.82-4H12a3 3 0 0 0 .18 1.01L7.91 7.27a3 3 0 0 0-1.91-.69 3 3 0 1 0 1.91 5.31l4.27 2.26A3 3 0 0 0 12 15a3 3 0 1 0 .18 1.01l-4.27-2.26A3 3 0 0 0 8 12c0-.35-.06-.69-.18-1.01l4.27-2.26c.53.52 1.25.84 2.01.84Z" />
                </svg>
                <span>{shareLabel}</span>
              </button>
            </div>

            <div className="rank-summary__stats">
              <div className="rank-stat-card">
                <span className="hud-label">Best score</span>
                <strong>{bestScore}</strong>
              </div>
              <div className="rank-stat-card">
                <span className="hud-label">Percentile</span>
                <strong>{currentEntry ? "Top " + percentile + "%" : "Waiting"}</strong>
              </div>
              <div className="rank-stat-card">
                <span className="hud-label">Beat next</span>
                <strong>{currentEntry && previousEntry ? nextBeatScore + " pts" : "Set a run"}</strong>
              </div>
              <div className="rank-stat-card">
                <span className="hud-label">Total runs</span>
                <strong>{totalRuns}</strong>
              </div>
            </div>

            <div className="rank-goals">
              {goals.map((goal) => (
                <div className="rank-goal-card" key={goal.label}>
                  <span className="hud-label">{goal.label}</span>
                  <strong>{goal.scoreNeeded === 0 ? "Reached" : goal.scoreNeeded + " pts"}</strong>
                  <p>{goal.scoreNeeded === 0 ? "Already inside this cutoff." : "Needed to break into #" + goal.rank + "."}</p>
                </div>
              ))}
            </div>

            <div className="motivation-row">
              {motivationMessages.map((message) => (
                <span className="motivation-chip" key={message}>{message}</span>
              ))}
            </div>
          </section>

          <div className="leaderboard-tabs" role="tablist" aria-label="Leaderboard scopes">
            {filterOptions.map((option) => (
              <button
                key={option.key}
                className={"leaderboard-tab " + (activeFilter === option.key ? "is-active" : "")}
                type="button"
                onClick={() => setActiveFilter(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="leaderboard-status-bar">
            <div>
              <strong>{filterOptions.find((option) => option.key === activeFilter)?.label} Leaderboard</strong>
              <p>
                {getFilterCopy(activeFilter)}
                {leaderboardStatus === "remote"
                  ? (leaderboardStorage === "memory" ? " Shared leaderboard is live with temporary server storage." : " Shared leaderboard is persistent.")
                  : " Showing cached local competition data."}
                {updatedAt ? " Updated " + updatedAt + "." : ""}
              </p>
            </div>
            {currentEntry ? <span className="leaderboard-badge">Current rank #{currentEntry.rank}</span> : null}
          </div>

          <div className="leaderboard-main-grid">
            <section className="leaderboard-panel podium-panel">
              <div className="leaderboard-panel__top">
                <div>
                  <strong>Top 3 Podium</strong>
                  <p>The rarest blooms in the current competition window.</p>
                </div>
              </div>
              {podiumEntries.length ? (
                <div className="podium-grid">
                  {[1, 0, 2].map((index) => {
                    const entry = podiumEntries[index]
                    if (!entry) {
                      return null
                    }

                    return (
                      <article
                        key={entry.playerId + "-podium-" + entry.rank}
                        className={"podium-card podium-card--" + entry.rank + (entry.isCurrentPlayer ? " is-current-player" : "")}
                      >
                        <span className="podium-card__place">#{entry.rank}</span>
                        <strong>{entry.label}</strong>
                        <span className={"tier-badge tier-badge--" + entry.tier}>{getTierLabel(entry.tier)}</span>
                        <div className="podium-card__score">{entry.score}</div>
                        <p>{entry.shotCount} blooms launched</p>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <p className="leaderboard-empty">No runs have been recorded yet.</p>
              )}
            </section>

            <section className="leaderboard-panel around-panel">
              <div className="leaderboard-panel__top">
                <div>
                  <strong>Around You</strong>
                  <p>{currentEntry ? "See the players directly above and below your current spot." : "Your local rivalry snapshot will appear here after your first run."}</p>
                </div>
              </div>
              {aroundEntries.length ? (
                <div className="around-list">
                  {aroundEntries.map((entry) => {
                    const scoreDelta = currentEntry ? entry.score - currentEntry.score : 0
                    return (
                      <div key={entry.playerId + "-around-" + entry.rank} className={"around-row " + (entry.isCurrentPlayer ? "is-current-player" : "") }>
                        <span className="around-row__rank">#{entry.rank}</span>
                        <div className="around-row__player">
                          <strong>{entry.label}</strong>
                          <span className={"tier-badge tier-badge--" + entry.tier}>{getTierLabel(entry.tier)}</span>
                        </div>
                        <div className="around-row__score">
                          <strong>{entry.score}</strong>
                          <span>{entry.isCurrentPlayer || !currentEntry ? "Current pace" : (scoreDelta > 0 ? "+" : "") + scoreDelta + " vs you"}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="leaderboard-empty">Finish a run to unlock your rivalry lane.</p>
              )}
            </section>
          </div>

          <section className="leaderboard-panel">
            <div className="leaderboard-panel__top">
              <div>
                <strong>Top 10 Table</strong>
                <p>Rank, score, flower tier, and current player highlight in one quick scan.</p>
              </div>
            </div>
            {topEntries.length ? (
              <div className="competitive-table" role="table" aria-label="Leaderboard">
                <div className="competitive-table__head" role="row">
                  <span>Rank</span>
                  <span>Player</span>
                  <span>Tier</span>
                  <span>Score</span>
                  <span>Blooms</span>
                </div>
                {topEntries.map((entry) => (
                  <div
                    key={entry.playerId + "-top-" + entry.rank}
                    className={"competitive-table__row " + (entry.isCurrentPlayer ? "is-current-player" : "")}
                    role="row"
                  >
                    <span className="competitive-table__rank">#{entry.rank}</span>
                    <div className="competitive-table__player">
                      <strong>{entry.label}</strong>
                      {entry.isCurrentPlayer ? <span className="competitive-table__self">You</span> : null}
                    </div>
                    <span className={"tier-badge tier-badge--" + entry.tier}>{getTierLabel(entry.tier)}</span>
                    <strong className="competitive-table__score">{entry.score}</strong>
                    <span>{entry.shotCount}</span>
                  </div>
                ))}
              </div>
            ) : isLeaderboardReady ? (
              <p className="leaderboard-empty">No runs have been recorded yet.</p>
            ) : (
              <p className="leaderboard-empty">Loading previous records...</p>
            )}
          </section>

          <section className="leaderboard-panel leaderboard-identity-panel">
            <div className="leaderboard-panel__top">
              <div>
                <strong>Leaderboard identity</strong>
                <p>Keep your name synced across shared leaderboard runs. Existing share actions remain unchanged.</p>
              </div>
            </div>
            <form
              className="leaderboard-name-form"
              onSubmit={(event) => {
                event.preventDefault()
                void handleSaveName()
              }}
            >
              <label className="leaderboard-name-form__field">
                <span>Name on leaderboard (optional)</span>
                <input
                  type="text"
                  maxLength={24}
                  value={playerNameInput}
                  onChange={(event) => setPlayerNameInput(event.target.value)}
                  placeholder="Leave blank to stay anonymous"
                />
              </label>
              <div className="leaderboard-name-form__actions">
                <button className="leaderboard-name-button" type="submit">{nameActionLabel}</button>
                <button
                  className="leaderboard-name-button leaderboard-name-button--ghost"
                  type="button"
                  onClick={() => {
                    setPlayerNameInput("")
                    void savePlayerProfile("", activeFilter).then((snapshot) => {
                      setLeaderboard(snapshot)
                      setLatestRun((current) => current ? { ...current, playerDisplayName: "", leaderboard: snapshot.leaderboard } : current)
                      setNameActionLabel("Cleared")
                      if (nameResetRef.current !== null) {
                        window.clearTimeout(nameResetRef.current)
                      }
                      nameResetRef.current = window.setTimeout(() => setNameActionLabel("Save name"), 1800)
                    })
                  }}
                >
                  Stay anonymous
                </button>
              </div>
            </form>
          </section>
        </div>
      </section>

      <section className="page-section card cta-row-section">
        <SectionTitle eyebrow="Next Step" title="After the run" />
        <div className="cta-row">
          <CTAButton label="Play Again" navigate={navigate} onClick={() => setSessionKey((value) => value + 1)} />
          <CTAButton label="Share Your Run" navigate={navigate} variant="secondary" onClick={() => void handleShare()} />
          <CTAButton label="Read Guide" href="/guide" navigate={navigate} variant="ghost" />
        </div>
      </section>
    </DashboardShell>
  )
}
