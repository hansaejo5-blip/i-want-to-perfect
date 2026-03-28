import type { RunEndedSummary } from '../game/stats'

const PROGRESSION_STORAGE_KEY = 'blip-perfect-growth-v1'
const CURRENT_DATE_KEY = () => new Date().toISOString().slice(0, 10)
const PROGRESSION_SCHEMA_VERSION = 4

export type DailyTargetKind = 'runs' | 'score' | 'merges' | 'combo'
export type MarketItemTier = 'starter' | 'rare' | 'prestige'
export type MarketItemKind = 'background' | 'skin'
export type SkinRenderVariant = 'classic' | 'dewdrop'

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
  renderVariant: SkinRenderVariant
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
  renderVariant?: SkinRenderVariant
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
    baseRun: 24,
    scoreRate: '1 XP per 28 score',
    mergeBonus: '3 XP per merge',
    comboBonus: '7 XP per max combo tier',
    eventBoost: '+20% XP during events',
  },
  emeralds: {
    personalBest: 8,
    levelRewardBase: '14 + level x 3',
    dailyTargetRange: '22 to 58 emeralds',
    eventDailyBoost: '+10% daily target emeralds during events',
  },
  pricing: {
    starter: '110 to 160 emeralds',
    rare: '180 to 280 emeralds',
    prestige: '360 to 620 emeralds',
  },
} as const

type DailyTargetBlueprint = Omit<DailyTargetProgress, 'progress' | 'completed' | 'rewarded'>

const DAILY_TARGET_ORDER: DailyTargetKind[] = ['runs', 'score', 'merges', 'combo']

const DAILY_TARGET_VARIANTS: Record<DailyTargetKind, DailyTargetBlueprint[]> = {
  runs: [
    {
      id: 'daily-runs-steady',
      title: 'Steady Watering',
      description: 'Play 3 measured runs and keep the garden active.',
      kind: 'runs',
      goal: 3,
      rewardEmeralds: 24,
    },
    {
      id: 'daily-runs-volume',
      title: 'Long Bed Sweep',
      description: 'Play 5 runs to build a fuller reward chain today.',
      kind: 'runs',
      goal: 5,
      rewardEmeralds: 34,
    },
    {
      id: 'daily-runs-rhythm',
      title: 'Keeper Rhythm',
      description: 'Complete 4 runs so XP, dailies, and score gains all move together.',
      kind: 'runs',
      goal: 4,
      rewardEmeralds: 28,
    },
  ],
  score: [
    {
      id: 'daily-score-quick',
      title: 'Petal Score Push',
      description: "Collect 760 total score across today's sessions.",
      kind: 'score',
      goal: 760,
      rewardEmeralds: 34,
    },
    {
      id: 'daily-score-deep',
      title: 'Glasshouse Pressure',
      description: 'Push through 1040 total score for the larger daily payout.',
      kind: 'score',
      goal: 1040,
      rewardEmeralds: 44,
    },
    {
      id: 'daily-score-peak',
      title: 'Evening Bloom Total',
      description: 'Reach 920 score before the board rolls over.',
      kind: 'score',
      goal: 920,
      rewardEmeralds: 40,
    },
  ],
  merges: [
    {
      id: 'daily-merges-clean',
      title: 'Merge Tending',
      description: 'Create 14 merges in total today.',
      kind: 'merges',
      goal: 14,
      rewardEmeralds: 30,
    },
    {
      id: 'daily-merges-stretch',
      title: 'Canopy Stack',
      description: 'Hit 20 total merges to cash in on a longer board session.',
      kind: 'merges',
      goal: 20,
      rewardEmeralds: 38,
    },
    {
      id: 'daily-merges-focus',
      title: 'Garden Sorting',
      description: 'Create 17 merges with cleaner placements and fewer wasted drops.',
      kind: 'merges',
      goal: 17,
      rewardEmeralds: 34,
    },
  ],
  combo: [
    {
      id: 'daily-combo-light',
      title: 'Combo Bloom',
      description: 'Reach a combo chain of 4 in one run.',
      kind: 'combo',
      goal: 4,
      rewardEmeralds: 46,
    },
    {
      id: 'daily-combo-rare',
      title: 'Combo Crest',
      description: 'Find one run with a combo chain of 6 for the biggest daily premium.',
      kind: 'combo',
      goal: 6,
      rewardEmeralds: 58,
    },
    {
      id: 'daily-combo-balanced',
      title: 'Bloom Chain',
      description: 'Reach a combo chain of 5 before reset to keep the event loop efficient.',
      kind: 'combo',
      goal: 5,
      rewardEmeralds: 52,
    },
  ],
}

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
  renderVariant: 'classic',
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
    supportingLine: 'A cooler garden atmosphere that keeps text and bloom shapes readable during longer sessions.',
    preview: 'Deep sage framing, muted teal depth, warm ivory board light, and soft foliage silhouettes behind the bowl.',
    price: 136,
    unlockLevel: 3,
    accent: '#355f56',
    glow: 'rgba(53, 95, 86, 0.18)',
    previewClass: 'theme-preview--moonlit-greenhouse',
    boardGradient: ['#d6e3db', '#eff0e7'],
    surfaceTint: 'rgba(245, 244, 236, 0.84)',
  },
  {
    id: 'dewdrop-seed-set',
    kind: 'skin',
    tier: 'rare',
    name: 'Dewdrop Seed Set',
    description: 'A soft seed-core drop with gentle dew highlights.',
    supportingLine: 'A calmer, more premium look for focused bloom runs that feels earned without breaking readability.',
    preview: 'Seed-centered early forms, cleaner dew highlights in mid tiers, and a faint growth ring in larger blooms.',
    price: 1980,
    unlockLevel: 4,
    accent: '#74cfbe',
    glow: 'rgba(116, 207, 190, 0.26)',
    previewClass: 'theme-preview--dewdrop-seed-set',
    renderVariant: 'dewdrop',
    visualRules: [
      'Small stages: clearer seed core with a softer droplet shell.',
      'Mid stages: layered dew highlight and cooler mint-teal translucency.',
      'Large stages: subtle outer growth ring with a restrained sprout-like lift.',
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

function getDailySeed(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map((value) => Number(value) || 0)
  return year * 372 + month * 31 + day
}

function getTargetVariant(kind: DailyTargetKind, dateKey: string, index: number) {
  const variants = DAILY_TARGET_VARIANTS[kind]
  return variants[(getDailySeed(dateKey) + index * 5) % variants.length]
}

function buildDailyTargets(metrics: DailyMetrics, dateKey = CURRENT_DATE_KEY()): DailyTargetProgress[] {
  return DAILY_TARGET_ORDER.map((kind, index) => {
    const target = getTargetVariant(kind, dateKey, index)
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
    emeralds: 24,
    ownedItemIds: [],
    equippedBackgroundId: DEFAULT_BACKGROUND.id,
    equippedSkinId: DEFAULT_SKIN.id,
    daily: {
      dateKey: CURRENT_DATE_KEY(),
      metrics,
      targets: buildDailyTargets(metrics, CURRENT_DATE_KEY()),
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
  return 116 + (clampedLevel - 1) * 48 + Math.floor(Math.pow(clampedLevel - 1, 1.3) * 20)
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

export function getDailyRefreshCountdown(now = Date.now()) {
  const nextReset = new Date(now)
  nextReset.setUTCHours(24, 0, 0, 0)
  return formatCountdown(nextReset.getTime() - now)
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
    renderVariant: item.renderVariant ?? DEFAULT_SKIN.renderVariant,
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
  const migrationBonus = candidate.schemaVersion === PROGRESSION_SCHEMA_VERSION ? 0 : legacyPaidCount * 96

  const next: ProgressionState = {
    schemaVersion: PROGRESSION_SCHEMA_VERSION,
    totalXp: Number(candidate.totalXp) || 0,
    level: Number(candidate.level) || 1,
    emeralds: Math.max(0, (Number(candidate.emeralds) || 0) + migrationBonus),
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
        : buildDailyTargets(dailyMetrics, typeof candidate.daily?.dateKey === 'string' ? candidate.daily.dateKey : CURRENT_DATE_KEY()),
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

  const targets = buildDailyTargets(metrics, todayKey).map((target) => {
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
  const baseXp = ECONOMY_BALANCE_TABLE.xp.baseRun + Math.floor(summary.score / 28) + summary.mergeCount * 3 + summary.maxCombo * 7
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
      const levelReward = 14 + level * 3
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

export function unequipSkin(state: ProgressionState) {
  const synced = syncProgressionState(state)

  return syncProgressionState({
    ...synced,
    equippedSkinId: DEFAULT_SKIN.id,
  })
}
