import { getApiUrl } from '../site/router'

const SCORE_HISTORY_STORAGE_KEY = 'blip-perfect-score-history'
const LEADERBOARD_CACHE_STORAGE_KEY = 'blip-perfect-leaderboard-cache'
const PLAYER_ID_STORAGE_KEY = 'blip-perfect-player-id'
const PLAYER_DISPLAY_NAME_STORAGE_KEY = 'blip-perfect-player-display-name'
const MAX_STORED_RUNS = 300
const DISPLAY_NAME_LIMIT = 24

export type LeaderboardStorage = 'vercel-kv' | 'upstash-redis' | 'memory'
export type LeaderboardScope = 'all' | 'daily' | 'weekly'

type LocalRun = {
  score: number
  shotCount: number
  recordedAt: string
}

export interface RunEndedSummary {
  score: number
  bestScore: number
  shotCount: number
  mergeCount: number
  maxCombo: number
}

export interface LeaderboardEntry {
  playerId: string
  displayName: string
  score: number
  shotCount: number
  recordedAt: string
}

export interface LeaderboardSnapshot {
  leaderboard: LeaderboardEntry[]
  totalRuns: number
  playerBestScore: number | null
  playerDisplayName: string
  updatedAt: string | null
  source: 'remote' | 'local'
  storage: LeaderboardStorage
  scope: LeaderboardScope
}

export interface RecordedRunSummary extends RunEndedSummary {
  totalRuns: number
  rank: number
  topPercent: number
  leaderboard: LeaderboardEntry[]
  playerId: string
  playerDisplayName: string
  source: 'remote' | 'local'
  storage: LeaderboardStorage
  scope: LeaderboardScope
}

type LeaderboardApiResponse = {
  leaderboard: LeaderboardEntry[]
  totalRuns: number
  playerBestScore: number | null
  playerDisplayName: string
  updatedAt: string | null
  storage: LeaderboardStorage
  scope: LeaderboardScope
  rank?: number
  topPercent?: number
}

function getCacheKey(scope: LeaderboardScope) {
  return `${LEADERBOARD_CACHE_STORAGE_KEY}:${scope}`
}

function getScopeStart(scope: LeaderboardScope, now = Date.now()) {
  if (scope === 'all') {
    return null
  }

  const date = new Date(now)
  if (scope === 'daily') {
    date.setUTCHours(0, 0, 0, 0)
    return date.getTime()
  }

  return now - 7 * 24 * 60 * 60 * 1000
}

function filterRunsByScope(runs: LocalRun[], scope: LeaderboardScope) {
  const start = getScopeStart(scope)
  if (start === null) {
    return runs
  }

  return runs.filter((run) => new Date(run.recordedAt).getTime() >= start)
}

function createPlayerId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return 'player-' + Math.random().toString(36).slice(2, 10)
}

function normalizePlayerDisplayName(value: string) {
  return value.replace(/\s+/g, ' ').trim().slice(0, DISPLAY_NAME_LIMIT)
}

export function getPlayerId() {
  try {
    const existing = window.localStorage.getItem(PLAYER_ID_STORAGE_KEY)
    if (existing) {
      return existing
    }

    const nextId = createPlayerId()
    window.localStorage.setItem(PLAYER_ID_STORAGE_KEY, nextId)
    return nextId
  } catch {
    return createPlayerId()
  }
}

export function getPlayerDisplayName() {
  try {
    return normalizePlayerDisplayName(window.localStorage.getItem(PLAYER_DISPLAY_NAME_STORAGE_KEY) ?? '')
  } catch {
    return ''
  }
}

function writePlayerDisplayName(name: string) {
  const normalized = normalizePlayerDisplayName(name)

  try {
    if (normalized) {
      window.localStorage.setItem(PLAYER_DISPLAY_NAME_STORAGE_KEY, normalized)
    } else {
      window.localStorage.removeItem(PLAYER_DISPLAY_NAME_STORAGE_KEY)
    }
  } catch {
    // Ignore storage failures.
  }

  return normalized
}

function normalizeLocalRun(value: unknown): LocalRun | null {
  if (typeof value === 'number') {
    return {
      score: value,
      shotCount: 0,
      recordedAt: new Date(0).toISOString(),
    }
  }

  if (typeof value !== 'object' || value === null) {
    return null
  }

  const candidate = value as Partial<LocalRun>
  const score = Number(candidate.score)
  const shotCount = Number(candidate.shotCount ?? 0)
  const recordedAt = typeof candidate.recordedAt === 'string' ? candidate.recordedAt : new Date().toISOString()

  if (Number.isFinite(score) === false || score < 0) {
    return null
  }

  return {
    score,
    shotCount: Number.isFinite(shotCount) && shotCount >= 0 ? shotCount : 0,
    recordedAt,
  }
}

function readLocalRuns() {
  try {
    const raw = window.localStorage.getItem(SCORE_HISTORY_STORAGE_KEY)
    if (raw === null) {
      return [] as LocalRun[]
    }

    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) === false) {
      return [] as LocalRun[]
    }

    return parsed
      .map(normalizeLocalRun)
      .filter((value): value is LocalRun => value !== null)
      .slice(0, MAX_STORED_RUNS)
  } catch {
    return [] as LocalRun[]
  }
}

function writeLocalRuns(runs: LocalRun[]) {
  try {
    window.localStorage.setItem(SCORE_HISTORY_STORAGE_KEY, JSON.stringify(runs.slice(0, MAX_STORED_RUNS)))
  } catch {
    // Ignore storage failures.
  }
}

function readCachedLeaderboard(scope: LeaderboardScope) {
  try {
    const raw = window.localStorage.getItem(getCacheKey(scope))
    if (raw === null) {
      return null
    }

    const parsed = JSON.parse(raw) as LeaderboardSnapshot
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null
    }

    return {
      leaderboard: Array.isArray(parsed.leaderboard) ? parsed.leaderboard : [],
      totalRuns: Number(parsed.totalRuns) || 0,
      playerBestScore: typeof parsed.playerBestScore === 'number' ? parsed.playerBestScore : null,
      playerDisplayName: typeof parsed.playerDisplayName === 'string' ? parsed.playerDisplayName : '',
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
      source: parsed.source === 'remote' ? 'remote' : 'local',
      storage: parsed.storage === 'vercel-kv' || parsed.storage === 'upstash-redis' ? parsed.storage : 'memory',
      scope,
    } satisfies LeaderboardSnapshot
  } catch {
    return null
  }
}

function writeCachedLeaderboard(snapshot: LeaderboardSnapshot) {
  try {
    window.localStorage.setItem(getCacheKey(snapshot.scope), JSON.stringify(snapshot))
  } catch {
    // Ignore storage failures.
  }
}

function isBetterEntry(candidate: LeaderboardEntry, current: LeaderboardEntry) {
  if (candidate.score !== current.score) {
    return candidate.score > current.score
  }

  if (candidate.shotCount !== current.shotCount) {
    return candidate.shotCount < current.shotCount
  }

  return candidate.recordedAt < current.recordedAt
}

function buildLocalEntries(playerId: string, runs: LocalRun[], scope: LeaderboardScope) {
  const playerDisplayName = getPlayerDisplayName()
  const scopedRuns = filterRunsByScope(runs, scope)
  const bestRun = scopedRuns.reduce<LocalRun | null>((best, run) => {
    if (best === null) {
      return run
    }

    const candidate: LeaderboardEntry = {
      playerId,
      displayName: playerDisplayName,
      score: run.score,
      shotCount: run.shotCount,
      recordedAt: run.recordedAt,
    }
    const current: LeaderboardEntry = {
      playerId,
      displayName: playerDisplayName,
      score: best.score,
      shotCount: best.shotCount,
      recordedAt: best.recordedAt,
    }

    return isBetterEntry(candidate, current) ? run : best
  }, null)

  if (bestRun === null) {
    return [] as LeaderboardEntry[]
  }

  return [{
    playerId,
    displayName: playerDisplayName,
    score: bestRun.score,
    shotCount: bestRun.shotCount,
    recordedAt: bestRun.recordedAt,
  }]
}

function buildLocalSnapshot(playerId: string, scope: LeaderboardScope): LeaderboardSnapshot {
  const runs = readLocalRuns()
  const scopedRuns = filterRunsByScope(runs, scope)
  const entries = buildLocalEntries(playerId, runs, scope)
  const playerDisplayName = getPlayerDisplayName()
  const playerBestScore = entries[0]?.score ?? null

  const snapshot: LeaderboardSnapshot = {
    leaderboard: entries,
    totalRuns: scopedRuns.length,
    playerBestScore,
    playerDisplayName,
    updatedAt: scopedRuns[0]?.recordedAt ?? null,
    source: 'local',
    storage: 'memory',
    scope,
  }

  writeCachedLeaderboard(snapshot)
  return snapshot
}

async function requestLeaderboard<T>(input: RequestInfo, init?: RequestInit) {
  try {
    const response = await fetch(input, init)
    if (response.ok === false) {
      return null
    }

    return await response.json() as T
  } catch {
    return null
  }
}

function buildRemoteSnapshot(remote: LeaderboardApiResponse): LeaderboardSnapshot {
  return {
    leaderboard: remote.leaderboard,
    totalRuns: remote.totalRuns,
    playerBestScore: remote.playerBestScore,
    playerDisplayName: remote.playerDisplayName,
    updatedAt: remote.updatedAt,
    source: 'remote',
    storage: remote.storage,
    scope: remote.scope,
  }
}

export function getCachedLeaderboardSnapshot(scope: LeaderboardScope = 'all') {
  return readCachedLeaderboard(scope)
}

export async function loadLeaderboard(scope: LeaderboardScope = 'all') {
  const playerId = getPlayerId()
  const remote = await requestLeaderboard<LeaderboardApiResponse>(
    getApiUrl(`/api/leaderboard?playerId=${encodeURIComponent(playerId)}&scope=${scope}`),
  )

  if (remote) {
    writePlayerDisplayName(remote.playerDisplayName)
    const snapshot = buildRemoteSnapshot(remote)
    writeCachedLeaderboard(snapshot)
    return snapshot
  }

  return readCachedLeaderboard(scope) ?? buildLocalSnapshot(playerId, scope)
}

function buildLocalRecordedSummary(summary: RunEndedSummary, playerId: string, runs: LocalRun[], scope: LeaderboardScope): RecordedRunSummary {
  const playerDisplayName = getPlayerDisplayName()
  const scopedRuns = filterRunsByScope(runs, scope)
  const leaderboard = buildLocalEntries(playerId, runs, scope)
  const rank = leaderboard.length ? 1 : 0
  const totalRuns = scopedRuns.length
  const topPercent = rank === 0 ? 100 : 1

  return {
    ...summary,
    totalRuns,
    rank,
    topPercent,
    leaderboard,
    playerId,
    playerDisplayName,
    source: 'local',
    storage: 'memory',
    scope,
  }
}

export async function savePlayerProfile(name: string, scope: LeaderboardScope = 'all') {
  const playerId = getPlayerId()
  const playerDisplayName = writePlayerDisplayName(name)

  const remote = await requestLeaderboard<LeaderboardApiResponse>(getApiUrl(`/api/leaderboard?scope=${scope}`), {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      playerId,
      displayName: playerDisplayName,
    }),
  })

  if (remote) {
    writePlayerDisplayName(remote.playerDisplayName)
    const snapshot = buildRemoteSnapshot(remote)
    writeCachedLeaderboard(snapshot)
    return snapshot
  }

  const fallback = readCachedLeaderboard(scope) ?? buildLocalSnapshot(playerId, scope)
  const snapshot: LeaderboardSnapshot = {
    ...fallback,
    playerDisplayName,
    leaderboard: fallback.leaderboard.map((entry) => (
      entry.playerId === playerId
        ? { ...entry, displayName: playerDisplayName }
        : entry
    )),
  }
  writeCachedLeaderboard(snapshot)
  return snapshot
}

export async function recordRun(summary: RunEndedSummary, scope: LeaderboardScope = 'all'): Promise<RecordedRunSummary> {
  const playerId = getPlayerId()
  const playerDisplayName = getPlayerDisplayName()
  const nextRun: LocalRun = {
    score: summary.score,
    shotCount: summary.shotCount,
    recordedAt: new Date().toISOString(),
  }
  const localRuns = [nextRun, ...readLocalRuns()].slice(0, MAX_STORED_RUNS)
  writeLocalRuns(localRuns)

  const localResult = buildLocalRecordedSummary(summary, playerId, localRuns, scope)
  writeCachedLeaderboard({
    leaderboard: localResult.leaderboard,
    totalRuns: localResult.totalRuns,
    playerBestScore: localResult.leaderboard[0]?.score ?? null,
    playerDisplayName,
    updatedAt: nextRun.recordedAt,
    source: 'local',
    storage: 'memory',
    scope,
  })

  const remote = await requestLeaderboard<LeaderboardApiResponse>(getApiUrl(`/api/leaderboard?scope=${scope}`), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      playerId,
      displayName: playerDisplayName,
      score: summary.score,
      shotCount: summary.shotCount,
    }),
  })

  if (remote === null || typeof remote.rank !== 'number' || typeof remote.topPercent !== 'number') {
    return localResult
  }

  writePlayerDisplayName(remote.playerDisplayName)
  const snapshot = buildRemoteSnapshot(remote)
  writeCachedLeaderboard(snapshot)

  return {
    ...summary,
    totalRuns: remote.totalRuns,
    rank: remote.rank,
    topPercent: remote.topPercent,
    leaderboard: remote.leaderboard,
    playerId,
    playerDisplayName: remote.playerDisplayName,
    source: 'remote',
    storage: remote.storage,
    scope: remote.scope,
  }
}
