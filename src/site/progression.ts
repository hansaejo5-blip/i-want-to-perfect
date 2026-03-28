import type { RunEndedSummary } from '../game/stats'

const PROGRESSION_STORAGE_KEY = 'blip-perfect-growth-v1'
const CURRENT_DATE_KEY = () => new Date().toISOString().slice(0, 10)
const PROGRESSION_SCHEMA_VERSION = 2

export type DailyTargetKind = 'runs' | 'score' | 'merges' | 'combo'
export type MarketItemTier = 'starter' | 'rare' | 'prestige'
export type MarketItemKind = 'background' | 'skin'

export interface ProgressionRunSummary extends RunEndedSummary {
  mergeCount: number
  maxCombo: number
}

export interface BaseCosmeticDefinition {
  id: string
  name: string
  description: string
  preview: string
  accent: string
  glow: string
  previewClass: string
}

export interface BackgroundDefinition extends BaseCosmeticDefinition {
  kind: 'background'
  boardGradient: [string, string]
  surfaceTint: string
}

export interface SkinDefinition extends BaseCosmeticDefinition {
  kind: 'skin'
  visualRules: string[]
}

export interface MarketItemDefinition extends BaseCosmeticDefinition {
  kind: MarketItemKind
  tier: MarketItemTier
  price: number
  unlockLevel: number
  supportingLine: string
  boardGradient?: [string, string]
  surfaceTint?: string
  visualRules?: string[]
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
  eventApplied: boolean
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
  schemaVersion: number
  totalXp: number
  level: number
  emeralds: number
  ownedItemIds: string[]
  equippedBackgroundId: string
  equippedSkinId: string
  daily: {
    dateKey: string
    metrics: DailyMetrics
    targets: DailyTargetProgress[]
  }
  stats: GrowthStats
  recentRewards: RecentRewardSummary | null
}

export interface EventDefinition {
  id: string
  title: string
  description: string
  bonusSummary: string
  ctaActive: string
  ctaEnded: string
  tagActive: string
  tagEnded: string
  endAt: string
}

export interface EventState {
  event: EventDefinition
  isActive: boolean
  remainingMs: number
  countdownLabel: string
  xpMultiplier: number
  dailyEmeraldMultiplier: number
  cardClassName: string
  tagLabel: string
  ctaLabel: string
}

export const ECONOMY_BALANCE_TABLE = {
  xp: {
    baseRun: 26,
    scoreRate: '1 XP per 24 score',
    mergeBonus: '4 XP per merge',
    comboBonus: '8 XP per max combo tier',
    eventBoost: '+20% XP during events',
  },
  emeralds: {
    personalBest: 12,
    levelRewardBase: '16 + level x 3',
    dailyTargetRange: '18 to 46 emeralds',
    eventDailyBoost: '+10% daily target emeralds during events',
  },
  pricing: {
    starter: '80 to 120 emeralds',
    rare: '140 to 240 emeralds',
    prestige: '320 to 520 emeralds',
  },
} as const

const DAILY_TARGET_BLUEPRINTS: Array<Omit<DailyTargetProgress, 'progress' | 'completed' | 'rewarded'>> = [
  {
    id: 'daily-runs',
    title: 'Morning Watering',
    description: 'Play 3 calm runs to keep the garden active.',
    kind: 'runs',
    goal: 3,
    rewardEmeralds: 18,
  },
  {
    id: 'daily-score',
    title: 'Petal Score Push',
    description: "Collect 720 score across today's sessions.",
    kind: 'score',
    goal: 720,
    rewardEmeralds: 34,
  },
  {
    id: 'daily-merges',
    title: 'Merge Tending',
    description: 'Create 14 merges in total today.',
    kind: 'merges',
    goal: 14,
    rewardEmeralds: 28,
  },
  {
    id: 'daily-combo',
    title: 'Combo Bloom',
    description: 'Reach a combo chain of 4 in one run.',
    kind: 'combo',
    goal: 4,
    rewardEmeralds: 46,
  },
]

export const DEFAULT_BACKGROUND: BackgroundDefinition = {
  id: 'sunlit-workbench',
  kind: 'background',
  name: 'Sunlit Workbench',
  description: 'The familiar warm ivory board with soft greenhouse calm.',
  preview: 'Warm ivory light with the original Perfect Drop workbench clarity.',
  accent: '#0f7a5a',
  glow: 'rgba(15, 122, 90, 0.16)',
  previewClass: 'theme-preview--sunlit-workbench',
  boardGradient: ['#fff8ef', '#efe3cf'],
  surfaceTint: 'rgba(255, 252, 246, 0.88)',
}

export const DEFAULT_SKIN: SkinDefinition = {
  id: 'garden-classic',
  kind: 'skin',
  name: 'Garden Classic',
  description: 'The original bloom finish with soft petals and familiar warmth.',
  preview: 'Warm cream and sage orbs with the original flower detail language.',
  accent: '#4ea57f',
  glow: 'rgba(78, 165, 127, 0.18)',
  previewClass: 'theme-preview--garden-classic',
  visualRules: [
    'Small stages stay seed-like and warm.',
    'Mid stages keep the familiar petal ring.',
    'Large stages remain readable with the classic flower silhouette.',
  ],
}

export const MARKET_CATALOG: MarketItemDefinition[] = [
  {
    id: 'moonlit-greenhouse',
    kind: 'background',
    tier: 'starter',
    name: 'Moonlit Greenhouse',
    description: 'Calm moonlight through greenhouse glass for focused runs.',
    supportingLine: 'A cooler garden atmosphere that keeps text and bloom shapes readable.',
    preview: 'Deep sage glass framing, muted teal depth, warm ivory play surface, and soft plant silhouettes behind the board.',
    price: 96,
    unlockLevel: 2,
    accent: '#355f56',
    glow: 'rgba(53, 95, 86, 0.18)',
    previewClass: 'theme-preview--moonlit-greenhouse',
    boardGradient: ['#d8e6dd', '#eff0e6'],
    surfaceTint: 'rgba(245, 244, 236, 0.84)',
  },
  {
    id: 'dewdrop-seed-set',
    kind: 'skin',
    tier: 'rare',
    name: 'Dewdrop Seed Set',
    description: 'A reward-feeling drop skin with dewdrop translucency and a seed core.',
    supportingLine: 'Made for players who want a cooler, cleaner object finish without breaking the current board readability.',
    preview: 'Seed-centered early forms, brighter dew highlights in mid stages, and a subtle sprout edge in larger merges.',
    price: 148,
    unlockLevel: 4,
    accent: '#6ccfbb',
    glow: 'rgba(108, 207, 187, 0.24)',
    previewClass: 'theme-preview--dewdrop-seed-set',
    visualRules: [
      'Small stages: a compact seed core with a soft droplet shell.',
      'Mid stages: stronger dew highlight and mint-teal translucency.',
      'Large stages: subtle sprout-edge energy while keeping silhouettes clean.',
    ],
  },
]

export const FEATURED_EVENT: EventDefinition = {
  id: 'double-bloom-weekend',
  title: 'Double Bloom Weekend',
  description: 'This weekend, every run converts faster into growth. XP gains are boosted and completed daily targets pay extra emeralds.',
  bonusSummary: 'XP +20% and daily target emerald rewards +10% while the boost is active.',
  ctaActive: 'Play under bonus',
  ctaEnded: 'Weekend boost ended',
  tagActive: 'Weekend Boost Active',
  tagEnded: 'Boost Ended',
  endAt: '2026-03-30T23:59:59Z',
}

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
    schemaVersion: PROGRESSION_SCHEMA_VERSION,
    totalXp: 0,
    level: 1,
    emeralds: 52,
    ownedItemIds: [],
    equippedBackgroundId: DEFAULT_BACKGROUND.id,
    equippedSkinId: DEFAULT_SKIN.id,
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
  return 108 + (clampedLevel - 1) * 42 + Math.floor(Math.pow(clampedLevel - 1, 1.28) * 18)
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

export function formatCountdown(remainingMs: number) {
  const clamped = Math.max(0, Math.floor(remainingMs / 1000))
  const hours = Math.floor(clamped / 3600)
  const minutes = Math.floor((clamped % 3600) / 60)
  const seconds = clamped % 60
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}

export function getActiveEventState(now = Date.now()): EventState {
  const endAtMs = new Date(FEATURED_EVENT.endAt).getTime()
  const remainingMs = Math.max(endAtMs - now, 0)
  const isActive = remainingMs > 0

  return {
    event: FEATURED_EVENT,
    isActive,
    remainingMs,
    countdownLabel: formatCountdown(remainingMs),
    xpMultiplier: isActive ? 1.2 : 1,
    dailyEmeraldMultiplier: isActive ? 1.1 : 1,
    cardClassName: isActive ? 'is-active' : 'is-ended',
    tagLabel: isActive ? FEATURED_EVENT.tagActive : FEATURED_EVENT.tagEnded,
    ctaLabel: isActive ? FEATURED_EVENT.ctaActive : FEATURED_EVENT.ctaEnded,
  }
}

export function getTargetRewardAmount(baseReward: number, multiplier = getActiveEventState().dailyEmeraldMultiplier) {
  return Math.round(baseReward * multiplier)
}

export function getEquippedBackground(state: ProgressionState): BackgroundDefinition {
  const item = MARKET_CATALOG.find((entry): entry is MarketItemDefinition & { kind: 'background' } => entry.kind === 'background' && entry.id === state.equippedBackgroundId)
  if (!item) {
    return DEFAULT_BACKGROUND
  }

  return {
    id: item.id,
    kind: 'background',
    name: item.name,
    description: item.description,
    preview: item.preview,
    accent: item.accent,
    glow: item.glow,
    previewClass: item.previewClass,
    boardGradient: item.boardGradient ?? DEFAULT_BACKGROUND.boardGradient,
    surfaceTint: item.surfaceTint ?? DEFAULT_BACKGROUND.surfaceTint,
  }
}

export function getEquippedSkin(state: ProgressionState): SkinDefinition {
  const item = MARKET_CATALOG.find((entry): entry is MarketItemDefinition & { kind: 'skin' } => entry.kind === 'skin' && entry.id === state.equippedSkinId)
  if (!item) {
    return DEFAULT_SKIN
  }

  return {
    id: item.id,
    kind: 'skin',
    name: item.name,
    description: item.description,
    preview: item.preview,
    accent: item.accent,
    glow: item.glow,
    previewClass: item.previewClass,
    visualRules: item.visualRules ?? DEFAULT_SKIN.visualRules,
  }
}

export function getMarketItemById(itemId: string) {
  return MARKET_CATALOG.find((item) => item.id === itemId) ?? null
}

export function getOwnedCosmetics(state: ProgressionState) {
  const entries: Array<BackgroundDefinition | SkinDefinition | MarketItemDefinition> = [DEFAULT_BACKGROUND, DEFAULT_SKIN]
  return entries.concat(MARKET_CATALOG.filter((item) => state.ownedItemIds.includes(item.id)))
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

  const candidate = input as Partial<ProgressionState> & {
    ownedSkinIds?: string[]
    schemaVersion?: number
  }
  const dailyMetrics = normalizeDailyMetrics(candidate.daily?.metrics)
  const marketIds = new Set(MARKET_CATALOG.map((item) => item.id))
  const ownedItemIds = Array.isArray(candidate.ownedItemIds)
    ? candidate.ownedItemIds.filter((itemId): itemId is string => typeof itemId === 'string' && marketIds.has(itemId))
    : []

  const legacyOwnedSkinIds = Array.isArray(candidate.ownedSkinIds)
    ? candidate.ownedSkinIds.filter((itemId): itemId is string => typeof itemId === 'string')
    : []
  const legacyPaidCount = legacyOwnedSkinIds.filter((itemId) => itemId !== 'classic-garden').length
  const migrationBonus = candidate.schemaVersion === PROGRESSION_SCHEMA_VERSION ? 0 : legacyPaidCount * 70

  const next: ProgressionState = {
    schemaVersion: PROGRESSION_SCHEMA_VERSION,
    totalXp: Number(candidate.totalXp) || 0,
    level: Number(candidate.level) || 1,
    emeralds: (Number(candidate.emeralds) || 0) + migrationBonus,
    ownedItemIds,
    equippedBackgroundId: typeof candidate.equippedBackgroundId === 'string' ? candidate.equippedBackgroundId : DEFAULT_BACKGROUND.id,
    equippedSkinId: typeof candidate.equippedSkinId === 'string' ? candidate.equippedSkinId : DEFAULT_SKIN.id,
    daily: {
      dateKey: typeof candidate.daily?.dateKey === 'string' ? candidate.daily.dateKey : CURRENT_DATE_KEY(),
      metrics: dailyMetrics,
      targets: Array.isArray(candidate.daily?.targets) && candidate.daily.targets.length
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

  const ownedItemIds = Array.from(new Set(state.ownedItemIds.filter((itemId) => getMarketItemById(itemId) !== null)))
  const equippedBackgroundId = state.equippedBackgroundId === DEFAULT_BACKGROUND.id || ownedItemIds.includes(state.equippedBackgroundId)
    ? state.equippedBackgroundId
    : DEFAULT_BACKGROUND.id
  const equippedSkinId = state.equippedSkinId === DEFAULT_SKIN.id || ownedItemIds.includes(state.equippedSkinId)
    ? state.equippedSkinId
    : DEFAULT_SKIN.id

  return {
    ...state,
    schemaVersion: PROGRESSION_SCHEMA_VERSION,
    level: levelState.level,
    emeralds: Math.max(0, Math.floor(state.emeralds)),
    ownedItemIds,
    equippedBackgroundId,
    equippedSkinId,
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
  const eventState = getActiveEventState()
  const baseXp = ECONOMY_BALANCE_TABLE.xp.baseRun + Math.floor(summary.score / 24) + summary.mergeCount * 4 + summary.maxCombo * 8
  const xpGained = Math.max(12, Math.round(baseXp * eventState.xpMultiplier))
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
    emeraldsGained += ECONOMY_BALANCE_TABLE.emeralds.personalBest
    reasonLabels.push('New best +' + ECONOMY_BALANCE_TABLE.emeralds.personalBest)
  }

  const totalXp = state.totalXp + xpGained
  const levelState = getLevelFromXp(totalXp)

  if (levelState.level > previousLevel) {
    for (let level = previousLevel + 1; level <= levelState.level; level += 1) {
      const levelReward = 16 + level * 3
      emeraldsGained += levelReward
      reasonLabels.push('Level ' + level + ' +' + levelReward)
    }
  }

  const nextTargets = buildDailyTargets(metrics).map((target) => {
    const existing = state.daily.targets.find((item) => item.id === target.id)
    const rewarded = existing?.rewarded ?? false
    const hasJustCompleted = target.completed && rewarded === false

    if (hasJustCompleted) {
      const reward = getTargetRewardAmount(target.rewardEmeralds, eventState.dailyEmeraldMultiplier)
      emeraldsGained += reward
      reasonLabels.push(target.title + ' +' + reward)
    }

    return {
      ...target,
      rewarded: rewarded || hasJustCompleted,
    }
  })

  if (eventState.isActive) {
    reasonLabels.unshift('Weekend XP +20%')
  }

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
      eventApplied: eventState.isActive,
      run: summary,
      receivedAt: new Date().toISOString(),
    },
  })
}

export function purchaseSkin(state: ProgressionState, itemId: string) {
  const synced = syncProgressionState(state)
  const item = getMarketItemById(itemId)
  if (!item || synced.ownedItemIds.includes(itemId) || synced.level < item.unlockLevel || synced.emeralds < item.price) {
    return synced
  }

  return syncProgressionState({
    ...synced,
    emeralds: synced.emeralds - item.price,
    ownedItemIds: [...synced.ownedItemIds, itemId],
  })
}

export function equipSkin(state: ProgressionState, itemId: string) {
  const synced = syncProgressionState(state)
  const item = getMarketItemById(itemId)
  if (!item || !synced.ownedItemIds.includes(itemId)) {
    return synced
  }

  if (item.kind === 'background') {
    return syncProgressionState({
      ...synced,
      equippedBackgroundId: itemId,
    })
  }

  return syncProgressionState({
    ...synced,
    equippedSkinId: itemId,
  })
}
