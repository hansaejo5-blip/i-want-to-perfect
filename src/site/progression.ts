import type { RunEndedSummary } from '../game/stats'

const PROGRESSION_STORAGE_KEY = 'blip-perfect-growth-v1'
const CURRENT_DATE_KEY = () => new Date().toISOString().slice(0, 10)

export type DailyTargetKind = 'runs' | 'score' | 'merges' | 'combo'

export interface ProgressionRunSummary extends RunEndedSummary {
  mergeCount: number
  maxCombo: number
}

export interface SkinDefinition {
  id: string
  name: string
  description: string
  price: number
  unlockLevel: number
  accent: string
  glow: string
  preview: string
  category: 'orb' | 'trail' | 'theme'
}

export interface DailyTargetProgress {
  id: string
  title: string
  description: string
  kind: DailyTargetKind
  goal: number
  rewardEmeralds: number
  progress: number
  completed: boolean
  rewarded: boolean
}

export interface DailyMetrics {
  runs: number
  totalScore: number
  totalMerges: number
  bestCombo: number
}

export interface RecentRewardSummary {
  xpGained: number
  emeraldsGained: number
  reasonLabels: string[]
  leveledUp: boolean
  newLevel: number
  run: ProgressionRunSummary
  receivedAt: string
}

export interface GrowthStats {
  totalRuns: number
  totalScore: number
  totalMerges: number
  bestScore: number
  bestCombo: number
}

export interface ProgressionState {
  totalXp: number
  level: number
  emeralds: number
  ownedSkinIds: string[]
  equippedSkinId: string
  daily: {
    dateKey: string
    metrics: DailyMetrics
    targets: DailyTargetProgress[]
  }
  stats: GrowthStats
  recentRewards: RecentRewardSummary | null
}

const DAILY_TARGET_BLUEPRINTS: Array<Omit<DailyTargetProgress, 'progress' | 'completed' | 'rewarded'>> = [
  {
    id: 'daily-runs',
    title: 'Morning Watering',
    description: 'Play 4 bloom runs today.',
    kind: 'runs',
    goal: 4,
    rewardEmeralds: 24,
  },
  {
    id: 'daily-score',
    title: 'Petal Score Push',
    description: "Collect 900 score across today's runs.",
    kind: 'score',
    goal: 900,
    rewardEmeralds: 42,
  },
  {
    id: 'daily-merges',
    title: 'Merge Tending',
    description: 'Trigger 18 merges in total today.',
    kind: 'merges',
    goal: 18,
    rewardEmeralds: 36,
  },
  {
    id: 'daily-combo',
    title: 'Combo Bloom',
    description: 'Reach a combo of 4 or more.',
    kind: 'combo',
    goal: 4,
    rewardEmeralds: 28,
  },
]

export const SKIN_CATALOG: SkinDefinition[] = [
  {
    id: 'classic-garden',
    name: 'Classic Garden',
    description: 'The original warm cream and sage garden finish.',
    price: 0,
    unlockLevel: 1,
    accent: '#0f7a5a',
    glow: 'rgba(15, 122, 90, 0.14)',
    preview: 'Cream bloom orbs with the familiar garden calm.',
    category: 'theme',
  },
  {
    id: 'mint-sprout',
    name: 'Mint Sprout',
    description: 'Fresh mint highlights for orb trims and drop trails.',
    price: 80,
    unlockLevel: 2,
    accent: '#4ea57f',
    glow: 'rgba(78, 165, 127, 0.18)',
    preview: 'Bright mint orb shell and soft greenhouse trail.',
    category: 'trail',
  },
  {
    id: 'rose-dawn',
    name: 'Rose Dawn',
    description: 'Blush petal lighting for calmer morning garden boards.',
    price: 120,
    unlockLevel: 3,
    accent: '#d8828f',
    glow: 'rgba(216, 130, 143, 0.18)',
    preview: 'Rosy orb bloom with a warmer score flash.',
    category: 'orb',
  },
  {
    id: 'emerald-mist',
    name: 'Emerald Mist',
    description: 'Deeper green energy wash for late-run focus.',
    price: 160,
    unlockLevel: 4,
    accent: '#2f8f78',
    glow: 'rgba(47, 143, 120, 0.22)',
    preview: 'Richer green gradients and a denser landing glow.',
    category: 'theme',
  },
  {
    id: 'moon-petal',
    name: 'Moon Petal',
    description: 'Luminous ivory petals with a moonlit drop shimmer.',
    price: 220,
    unlockLevel: 5,
    accent: '#9f8cc7',
    glow: 'rgba(159, 140, 199, 0.18)',
    preview: 'Soft moon-petal finish with cool combo sparkles.',
    category: 'orb',
  },
]

function getMetricValue(kind: DailyTargetKind, metrics: DailyMetrics) {
  switch (kind) {
    case 'runs':
      return metrics.runs
    case 'score':
      return metrics.totalScore
    case 'merges':
      return metrics.totalMerges
    case 'combo':
      return metrics.bestCombo
    default:
      return 0
  }
}

function buildDailyTargets(metrics: DailyMetrics): DailyTargetProgress[] {
  return DAILY_TARGET_BLUEPRINTS.map((target) => {
    const progress = Math.min(getMetricValue(target.kind, metrics), target.goal)
    return {
      ...target,
      progress,
      completed: progress >= target.goal,
      rewarded: false,
    }
  })
}

function createDefaultState(): ProgressionState {
  const metrics: DailyMetrics = {
    runs: 0,
    totalScore: 0,
    totalMerges: 0,
    bestCombo: 0,
  }

  return syncProgressionState({
    totalXp: 0,
    level: 1,
    emeralds: 140,
    ownedSkinIds: ['classic-garden'],
    equippedSkinId: 'classic-garden',
    daily: {
      dateKey: CURRENT_DATE_KEY(),
      metrics,
      targets: buildDailyTargets(metrics),
    },
    stats: {
      totalRuns: 0,
      totalScore: 0,
      totalMerges: 0,
      bestScore: 0,
      bestCombo: 0,
    },
    recentRewards: null,
  })
}

export function getXpForNextLevel(level: number) {
  const clampedLevel = Math.max(level, 1)
  return 120 + (clampedLevel - 1) * 48 + Math.floor(Math.pow(clampedLevel - 1, 1.35) * 18)
}

export function getLevelFromXp(totalXp: number) {
  let level = 1
  let xpRemaining = Math.max(0, Math.floor(totalXp))
  let nextLevelXp = getXpForNextLevel(level)

  while (xpRemaining >= nextLevelXp) {
    xpRemaining -= nextLevelXp
    level += 1
    nextLevelXp = getXpForNextLevel(level)
  }

  return {
    level,
    xpIntoLevel: xpRemaining,
    nextLevelXp,
    remainingXp: Math.max(nextLevelXp - xpRemaining, 0),
    progress: nextLevelXp > 0 ? xpRemaining / nextLevelXp : 0,
  }
}

export function getLevelProgress(state: ProgressionState) {
  return getLevelFromXp(state.totalXp)
}

export function getEquippedSkin(state: ProgressionState) {
  return SKIN_CATALOG.find((skin) => skin.id === state.equippedSkinId) ?? SKIN_CATALOG[0]
}

export function getSkinById(skinId: string) {
  return SKIN_CATALOG.find((skin) => skin.id === skinId) ?? null
}

export function getOwnedSkins(state: ProgressionState) {
  return SKIN_CATALOG.filter((skin) => state.ownedSkinIds.includes(skin.id))
}

export function getDailyCompletion(state: ProgressionState) {
  const completed = state.daily.targets.filter((target) => target.completed).length
  const total = state.daily.targets.length
  return {
    completed,
    total,
    percent: total > 0 ? completed / total : 0,
  }
}

function normalizeDailyMetrics(input: unknown): DailyMetrics {
  const candidate = typeof input === 'object' && input !== null ? input : {}
  return {
    runs: Number((candidate as DailyMetrics).runs) || 0,
    totalScore: Number((candidate as DailyMetrics).totalScore) || 0,
    totalMerges: Number((candidate as DailyMetrics).totalMerges) || 0,
    bestCombo: Number((candidate as DailyMetrics).bestCombo) || 0,
  }
}

function normalizeState(input: unknown): ProgressionState {
  const fallback = createDefaultState()
  if (typeof input !== 'object' || input === null) {
    return fallback
  }

  const candidate = input as Partial<ProgressionState>
  const dailyMetrics = normalizeDailyMetrics(candidate.daily?.metrics)
  const ownedSkinIds = Array.isArray(candidate.ownedSkinIds)
    ? candidate.ownedSkinIds.filter((skinId): skinId is string => typeof skinId === 'string' && SKIN_CATALOG.some((skin) => skin.id === skinId))
    : fallback.ownedSkinIds

  const next: ProgressionState = {
    totalXp: Number(candidate.totalXp) || 0,
    level: Number(candidate.level) || 1,
    emeralds: Number(candidate.emeralds) || 0,
    ownedSkinIds: ownedSkinIds.length ? Array.from(new Set(['classic-garden', ...ownedSkinIds])) : fallback.ownedSkinIds,
    equippedSkinId: typeof candidate.equippedSkinId === 'string' ? candidate.equippedSkinId : fallback.equippedSkinId,
    daily: {
      dateKey: typeof candidate.daily?.dateKey === 'string' ? candidate.daily.dateKey : CURRENT_DATE_KEY(),
      metrics: dailyMetrics,
      targets: Array.isArray(candidate.daily?.targets) && candidate.daily?.targets.length
        ? candidate.daily.targets.map((target) => ({
            ...target,
            progress: Number(target.progress) || 0,
            completed: Boolean(target.completed),
            rewarded: Boolean(target.rewarded),
          }))
        : buildDailyTargets(dailyMetrics),
    },
    stats: {
      totalRuns: Number(candidate.stats?.totalRuns) || 0,
      totalScore: Number(candidate.stats?.totalScore) || 0,
      totalMerges: Number(candidate.stats?.totalMerges) || 0,
      bestScore: Number(candidate.stats?.bestScore) || 0,
      bestCombo: Number(candidate.stats?.bestCombo) || 0,
    },
    recentRewards: candidate.recentRewards ?? null,
  }

  return syncProgressionState(next)
}

export function syncProgressionState(state: ProgressionState): ProgressionState {
  const levelState = getLevelFromXp(state.totalXp)
  const todayKey = CURRENT_DATE_KEY()
  const isCurrentDay = state.daily.dateKey === todayKey
  const metrics = isCurrentDay
    ? state.daily.metrics
    : {
        runs: 0,
        totalScore: 0,
        totalMerges: 0,
        bestCombo: 0,
      }

  const targets = buildDailyTargets(metrics).map((target) => {
    const existing = isCurrentDay
      ? state.daily.targets.find((item) => item.id === target.id)
      : null

    return {
      ...target,
      rewarded: existing?.rewarded ?? false,
    }
  })

  const equippedSkin = state.ownedSkinIds.includes(state.equippedSkinId) ? state.equippedSkinId : 'classic-garden'

  return {
    ...state,
    level: levelState.level,
    emeralds: Math.max(0, Math.floor(state.emeralds)),
    equippedSkinId: equippedSkin,
    daily: {
      dateKey: todayKey,
      metrics,
      targets,
    },
  }
}

export function loadProgressionState() {
  try {
    const raw = window.localStorage.getItem(PROGRESSION_STORAGE_KEY)
    if (!raw) {
      return createDefaultState()
    }

    return normalizeState(JSON.parse(raw))
  } catch {
    return createDefaultState()
  }
}

export function saveProgressionState(state: ProgressionState) {
  try {
    window.localStorage.setItem(PROGRESSION_STORAGE_KEY, JSON.stringify(syncProgressionState(state)))
  } catch {
    // Ignore private browsing and sandbox failures.
  }
}

export function applyRunProgression(current: ProgressionState, summary: ProgressionRunSummary): ProgressionState {
  const state = syncProgressionState(current)
  const xpGained = 36 + Math.floor(summary.score / 18) + summary.mergeCount * 6 + summary.maxCombo * 10
  const previousLevel = state.level
  const wasPersonalBest = summary.score > state.stats.bestScore

  const metrics: DailyMetrics = {
    runs: state.daily.metrics.runs + 1,
    totalScore: state.daily.metrics.totalScore + summary.score,
    totalMerges: state.daily.metrics.totalMerges + summary.mergeCount,
    bestCombo: Math.max(state.daily.metrics.bestCombo, summary.maxCombo),
  }

  let emeraldsGained = 0
  const reasonLabels: string[] = []

  if (wasPersonalBest) {
    emeraldsGained += 14
    reasonLabels.push('New best +14')
  }

  const totalXp = state.totalXp + xpGained
  const levelState = getLevelFromXp(totalXp)

  if (levelState.level > previousLevel) {
    for (let level = previousLevel + 1; level <= levelState.level; level += 1) {
      const levelReward = 18 + level * 4
      emeraldsGained += levelReward
      reasonLabels.push('Level ' + level + ' +' + levelReward)
    }
  }

  const nextTargets = buildDailyTargets(metrics).map((target) => {
    const existing = state.daily.targets.find((item) => item.id === target.id)
    const rewarded = existing?.rewarded ?? false
    const hasJustCompleted = target.completed && rewarded === false

    if (hasJustCompleted) {
      emeraldsGained += target.rewardEmeralds
      reasonLabels.push(target.title + ' +' + target.rewardEmeralds)
    }

    return {
      ...target,
      rewarded: rewarded || hasJustCompleted,
    }
  })

  return syncProgressionState({
    ...state,
    totalXp,
    level: levelState.level,
    emeralds: state.emeralds + emeraldsGained,
    daily: {
      dateKey: state.daily.dateKey,
      metrics,
      targets: nextTargets,
    },
    stats: {
      totalRuns: state.stats.totalRuns + 1,
      totalScore: state.stats.totalScore + summary.score,
      totalMerges: state.stats.totalMerges + summary.mergeCount,
      bestScore: Math.max(state.stats.bestScore, summary.score),
      bestCombo: Math.max(state.stats.bestCombo, summary.maxCombo),
    },
    recentRewards: {
      xpGained,
      emeraldsGained,
      reasonLabels,
      leveledUp: levelState.level > previousLevel,
      newLevel: levelState.level,
      run: summary,
      receivedAt: new Date().toISOString(),
    },
  })
}

export function purchaseSkin(state: ProgressionState, skinId: string) {
  const synced = syncProgressionState(state)
  const skin = getSkinById(skinId)
  if (!skin || synced.ownedSkinIds.includes(skinId) || synced.level < skin.unlockLevel || synced.emeralds < skin.price) {
    return synced
  }

  return {
    ...synced,
    emeralds: synced.emeralds - skin.price,
    ownedSkinIds: [...synced.ownedSkinIds, skinId],
  }
}

export function equipSkin(state: ProgressionState, skinId: string) {
  const synced = syncProgressionState(state)
  if (!synced.ownedSkinIds.includes(skinId)) {
    return synced
  }

  return {
    ...synced,
    equippedSkinId: skinId,
  }
}
