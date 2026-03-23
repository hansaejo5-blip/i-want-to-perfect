const SCORE_HISTORY_STORAGE_KEY = 'blip-perfect-score-history'
const LEADERBOARD_CACHE_STORAGE_KEY = 'blip-perfect-leaderboard-cache'
const PLAYER_ID_STORAGE_KEY = 'blip-perfect-player-id'
const MAX_STORED_RUNS = 300
const LEADERBOARD_PREVIEW_SIZE = 8

type LocalRun = {
  score: number
  shotCount: number
  recordedAt: string
}

export interface RunEndedSummary {
  score: number
  bestScore: number
  shotCount: number
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
  updatedAt: string | null
  source: 'remote' | 'local'
}

export interface RecordedRunSummary extends RunEndedSummary {
  totalRuns: number
  rank: number
  topPercent: number
  leaderboard: LeaderboardEntry[]
  playerId: string
  playerDisplayName: string
  source: 'remote' | 'local'
}

type LeaderboardApiResponse = {
  leaderboard: LeaderboardEntry[]
  totalRuns: number
  playerBestScore: number | null
  updatedAt: string | null
  rank?: number
  topPercent?: number
}

type CachedLeaderboard = LeaderboardSnapshot

function createPlayerId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `player-${Math.random().toString(36).slice(2, 10)}`
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

export function formatPlayerName(playerId: string) {
  return `Player ${playerId.replace(/[^a-z0-9]/gi, '').slice(-4).toUpperCase().padStart(4, '0')}`
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
    window.localStorage.setItem(
      SCORE_HISTORY_STORAGE_KEY,
      JSON.stringify(runs.slice(0, MAX_STORED_RUNS)),
    )
  } catch {
    // Ignore storage failures in sandboxed/private contexts.
  }
}

function readCachedLeaderboard() {
  try {
    const raw = window.localStorage.getItem(LEADERBOARD_CACHE_STORAGE_KEY)
    if (raw === null) {
      return null
    }

    const parsed = JSON.parse(raw) as CachedLeaderboard
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null
    }

    return {
      leaderboard: Array.isArray(parsed.leaderboard) ? parsed.leaderboard : [],
      totalRuns: Number(parsed.totalRuns) || 0,
      playerBestScore:
        typeof parsed.playerBestScore === 'number' && Number.isFinite(parsed.playerBestScore)
          ? parsed.playerBestScore
          : null,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
      source: parsed.source === 'remote' ? 'remote' : 'local',
    } satisfies CachedLeaderboard
  } catch {
    return null
  }
}

function writeCachedLeaderboard(snapshot: LeaderboardSnapshot) {
  try {
    window.localStorage.setItem(LEADERBOARD_CACHE_STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // Ignore storage failures in sandboxed/private contexts.
  }
}

function buildLocalEntries(playerId: string, runs: LocalRun[]) {
  const playerName = formatPlayerName(playerId)

  return runs
    .slice()
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      return left.recordedAt.localeCompare(right.recordedAt)
    })
    .slice(0, LEADERBOARD_PREVIEW_SIZE)
    .map((run) => ({
      playerId,
      displayName: playerName,
      score: run.score,
      shotCount: run.shotCount,
      recordedAt: run.recordedAt,
    }))
}

function buildLocalSnapshot(playerId: string): LeaderboardSnapshot {
  const runs = readLocalRuns()
  const playerBestScore = runs.reduce<number | null>((best, run) => {
    if (best === null || run.score > best) {
      return run.score
    }

    return best
  }, null)

  const snapshot: LeaderboardSnapshot = {
    leaderboard: buildLocalEntries(playerId, runs),
    totalRuns: runs.length,
    playerBestScore,
    updatedAt: runs[0]?.recordedAt ?? null,
    source: 'local',
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

export function getCachedLeaderboardSnapshot() {
  return readCachedLeaderboard()
}

export async function loadLeaderboard() {
  const playerId = getPlayerId()
  const remote = await requestLeaderboard<LeaderboardApiResponse>(`/api/leaderboard?playerId=${encodeURIComponent(playerId)}`)

  if (remote) {
    const snapshot: LeaderboardSnapshot = {
      leaderboard: remote.leaderboard,
      totalRuns: remote.totalRuns,
      playerBestScore: remote.playerBestScore,
      updatedAt: remote.updatedAt,
      source: 'remote',
    }

    writeCachedLeaderboard(snapshot)
    return snapshot
  }

  return readCachedLeaderboard() ?? buildLocalSnapshot(playerId)
}

function buildLocalRecordedSummary(summary: RunEndedSummary, playerId: string, runs: LocalRun[]): RecordedRunSummary {
  const higherScores = runs.filter((run) => run.score > summary.score).length
  const rank = higherScores + 1
  const totalRuns = runs.length
  const topPercent = Math.max(1, Math.ceil((rank / Math.max(totalRuns, 1)) * 100))

  return {
    ...summary,
    totalRuns,
    rank,
    topPercent,
    leaderboard: buildLocalEntries(playerId, runs),
    playerId,
    playerDisplayName: formatPlayerName(playerId),
    source: 'local',
  }
}

export async function recordRun(summary: RunEndedSummary): Promise<RecordedRunSummary> {
  const playerId = getPlayerId()
  const nextRun: LocalRun = {
    score: summary.score,
    shotCount: summary.shotCount,
    recordedAt: new Date().toISOString(),
  }
  const localRuns = [nextRun, ...readLocalRuns()].slice(0, MAX_STORED_RUNS)
  writeLocalRuns(localRuns)

  const localResult = buildLocalRecordedSummary(summary, playerId, localRuns)
  writeCachedLeaderboard({
    leaderboard: localResult.leaderboard,
    totalRuns: localResult.totalRuns,
    playerBestScore: summary.bestScore,
    updatedAt: nextRun.recordedAt,
    source: 'local',
  })

  const remote = await requestLeaderboard<LeaderboardApiResponse>('/api/leaderboard', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      playerId,
      displayName: formatPlayerName(playerId),
      score: summary.score,
      shotCount: summary.shotCount,
    }),
  })

  if (remote === null || typeof remote.rank !== 'number' || typeof remote.topPercent !== 'number') {
    return localResult
  }

  const snapshot: LeaderboardSnapshot = {
    leaderboard: remote.leaderboard,
    totalRuns: remote.totalRuns,
    playerBestScore: remote.playerBestScore,
    updatedAt: remote.updatedAt,
    source: 'remote',
  }
  writeCachedLeaderboard(snapshot)

  return {
    ...summary,
    totalRuns: remote.totalRuns,
    rank: remote.rank,
    topPercent: remote.topPercent,
    leaderboard: remote.leaderboard,
    playerId,
    playerDisplayName: formatPlayerName(playerId),
    source: 'remote',
  }
}
