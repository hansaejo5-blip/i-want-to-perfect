import { getApiUrl } from '../site/router'

const SCORE_HISTORY_STORAGE_KEY = "blip-perfect-score-history"
const LEADERBOARD_CACHE_STORAGE_KEY = "blip-perfect-leaderboard-cache"
const PLAYER_ID_STORAGE_KEY = "blip-perfect-player-id"
const PLAYER_DISPLAY_NAME_STORAGE_KEY = "blip-perfect-player-display-name"
const MAX_STORED_RUNS = 300
const LEADERBOARD_PREVIEW_SIZE = 8
const DISPLAY_NAME_LIMIT = 24

export type LeaderboardStorage = "vercel-kv" | "upstash-redis" | "memory"

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
  source: "remote" | "local"
  storage: LeaderboardStorage
}

export interface RecordedRunSummary extends RunEndedSummary {
  totalRuns: number
  rank: number
  topPercent: number
  leaderboard: LeaderboardEntry[]
  playerId: string
  playerDisplayName: string
  source: "remote" | "local"
  storage: LeaderboardStorage
}

type LeaderboardApiResponse = {
  leaderboard: LeaderboardEntry[]
  totalRuns: number
  playerBestScore: number | null
  playerDisplayName: string
  updatedAt: string | null
  storage: LeaderboardStorage
  rank?: number
  topPercent?: number
}

type CachedLeaderboard = LeaderboardSnapshot

function createPlayerId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return "player-" + Math.random().toString(36).slice(2, 10)
}

function normalizePlayerDisplayName(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, DISPLAY_NAME_LIMIT)
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
    return normalizePlayerDisplayName(window.localStorage.getItem(PLAYER_DISPLAY_NAME_STORAGE_KEY) ?? "")
  } catch {
    return ""
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
    // Ignore storage failures in sandboxed/private contexts.
  }

  return normalized
}

function normalizeLocalRun(value: unknown): LocalRun | null {
  if (typeof value === "number") {
    return {
      score: value,
      shotCount: 0,
      recordedAt: new Date(0).toISOString(),
    }
  }

  if (typeof value !== "object" || value === null) {
    return null
  }

  const candidate = value as Partial<LocalRun>
  const score = Number(candidate.score)
  const shotCount = Number(candidate.shotCount ?? 0)
  const recordedAt = typeof candidate.recordedAt === "string" ? candidate.recordedAt : new Date().toISOString()

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
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null
    }

    return {
      leaderboard: Array.isArray(parsed.leaderboard) ? parsed.leaderboard : [],
      totalRuns: Number(parsed.totalRuns) || 0,
      playerBestScore:
        typeof parsed.playerBestScore === "number" && Number.isFinite(parsed.playerBestScore)
          ? parsed.playerBestScore
          : null,
      playerDisplayName: typeof parsed.playerDisplayName === "string" ? parsed.playerDisplayName : "",
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
      source: parsed.source === "remote" ? "remote" : "local",
      storage: parsed.storage === "vercel-kv" || parsed.storage === "upstash-redis" ? parsed.storage : "memory",
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
  const playerDisplayName = getPlayerDisplayName()

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
      displayName: playerDisplayName,
      score: run.score,
      shotCount: run.shotCount,
      recordedAt: run.recordedAt,
    }))
}

function buildLocalSnapshot(playerId: string): LeaderboardSnapshot {
  const runs = readLocalRuns()
  const playerDisplayName = getPlayerDisplayName()
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
    playerDisplayName,
    updatedAt: runs[0]?.recordedAt ?? null,
    source: "local",
    storage: "memory",
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
    source: "remote",
    storage: remote.storage,
  }
}

export function getCachedLeaderboardSnapshot() {
  return readCachedLeaderboard()
}

export async function loadLeaderboard() {
  const playerId = getPlayerId()
  const remote = await requestLeaderboard<LeaderboardApiResponse>(getApiUrl("/api/leaderboard?playerId=" + encodeURIComponent(playerId)))

  if (remote) {
    writePlayerDisplayName(remote.playerDisplayName)
    const snapshot = buildRemoteSnapshot(remote)
    writeCachedLeaderboard(snapshot)
    return snapshot
  }

  return readCachedLeaderboard() ?? buildLocalSnapshot(playerId)
}

function buildLocalRecordedSummary(summary: RunEndedSummary, playerId: string, runs: LocalRun[]): RecordedRunSummary {
  const playerDisplayName = getPlayerDisplayName()
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
    playerDisplayName,
    source: "local",
    storage: "memory",
  }
}

export async function savePlayerProfile(name: string) {
  const playerId = getPlayerId()
  const playerDisplayName = writePlayerDisplayName(name)

  const remote = await requestLeaderboard<LeaderboardApiResponse>(getApiUrl("/api/leaderboard"), {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
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

  const fallback = readCachedLeaderboard() ?? buildLocalSnapshot(playerId)
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

export async function recordRun(summary: RunEndedSummary): Promise<RecordedRunSummary> {
  const playerId = getPlayerId()
  const playerDisplayName = getPlayerDisplayName()
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
    playerDisplayName,
    updatedAt: nextRun.recordedAt,
    source: "local",
    storage: "memory",
  })

  const remote = await requestLeaderboard<LeaderboardApiResponse>(getApiUrl("/api/leaderboard"), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      playerId,
      displayName: playerDisplayName,
      score: summary.score,
      shotCount: summary.shotCount,
    }),
  })

  if (remote === null || typeof remote.rank !== "number" || typeof remote.topPercent !== "number") {
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
    source: "remote",
    storage: remote.storage,
  }
}
