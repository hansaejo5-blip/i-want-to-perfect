type LeaderboardEntry = {
  playerId: string
  displayName: string
  score: number
  shotCount: number
  recordedAt: string
}

type LeaderboardStore = {
  totalRuns: number
  updatedAt: string | null
  scoreCounts: Record<string, number>
  leaderboard: LeaderboardEntry[]
  playerBestScores: Record<string, number>
  playerDisplayNames: Record<string, string>
}

type ScoreSubmissionBody = {
  playerId: string
  displayName?: string
  score: number
  shotCount: number
}

type ProfileSubmissionBody = {
  playerId: string
  displayName?: string
}

type StorageMode = 'vercel-kv' | 'upstash-redis' | 'memory'

type StorageConfig = {
  baseUrl: string
  token: string
  storage: Exclude<StorageMode, 'memory'>
}

type LeaderboardResponse = {
  leaderboard: LeaderboardEntry[]
  totalRuns: number
  playerBestScore: number | null
  playerDisplayName: string
  updatedAt: string | null
  storage: StorageMode
  rank?: number
  topPercent?: number
}

const STORE_KEY = 'perfect-drop-leaderboard-v2'
const DISPLAY_NAME_LIMIT = 24
const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PATCH, OPTIONS',
  'access-control-allow-headers': 'content-type',
} as const

function createEmptyStore(): LeaderboardStore {
  return {
    totalRuns: 0,
    updatedAt: null,
    scoreCounts: {},
    leaderboard: [],
    playerBestScores: {},
    playerDisplayNames: {},
  }
}

function getMemoryStore() {
  const runtime = globalThis as typeof globalThis & { __perfectDropLeaderboard?: LeaderboardStore }
  if (runtime.__perfectDropLeaderboard === undefined) {
    runtime.__perfectDropLeaderboard = createEmptyStore()
  }

  return runtime.__perfectDropLeaderboard
}

function getStorageConfig(): StorageConfig | null {
  if (typeof process.env.KV_REST_API_URL === 'string'
    && process.env.KV_REST_API_URL.length > 0
    && typeof process.env.KV_REST_API_TOKEN === 'string'
    && process.env.KV_REST_API_TOKEN.length > 0) {
    return {
      baseUrl: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
      storage: 'vercel-kv',
    }
  }

  if (typeof process.env.UPSTASH_REDIS_REST_URL === 'string'
    && process.env.UPSTASH_REDIS_REST_URL.length > 0
    && typeof process.env.UPSTASH_REDIS_REST_TOKEN === 'string'
    && process.env.UPSTASH_REDIS_REST_TOKEN.length > 0) {
    return {
      baseUrl: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
      storage: 'upstash-redis',
    }
  }

  return null
}

async function kvRequest(path: string, init?: RequestInit) {
  const config = getStorageConfig()
  if (!config) {
    return null
  }

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${config.token}`,
        ...init?.headers,
      },
      cache: 'no-store',
    })

    if (response.ok === false) {
      return null
    }

    return response
  } catch {
    return null
  }
}

function sortLeaderboard(entries: LeaderboardEntry[]) {
  return entries.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score
    }

    if (left.shotCount !== right.shotCount) {
      return left.shotCount - right.shotCount
    }

    return left.recordedAt.localeCompare(right.recordedAt)
  })
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

function collapseToBestEntries(entries: LeaderboardEntry[]) {
  const bestByPlayer = new Map<string, LeaderboardEntry>()

  for (const entry of entries) {
    if (!entry || typeof entry.playerId !== 'string' || entry.playerId.length === 0) {
      continue
    }

    const normalized: LeaderboardEntry = {
      playerId: entry.playerId,
      displayName: typeof entry.displayName === 'string' ? entry.displayName : '',
      score: Number(entry.score) || 0,
      shotCount: Number(entry.shotCount) || 0,
      recordedAt: typeof entry.recordedAt === 'string' ? entry.recordedAt : new Date().toISOString(),
    }

    const existing = bestByPlayer.get(normalized.playerId)
    if (!existing || isBetterEntry(normalized, existing)) {
      bestByPlayer.set(normalized.playerId, normalized)
    }
  }

  return sortLeaderboard(Array.from(bestByPlayer.values()))
}

function normalizeStore(parsed: Partial<LeaderboardStore> | null | undefined): LeaderboardStore {
  const leaderboard = collapseToBestEntries(Array.isArray(parsed?.leaderboard) ? parsed!.leaderboard : [])
  const playerBestScores: Record<string, number> = {
    ...(typeof parsed?.playerBestScores === 'object' && parsed?.playerBestScores !== null ? parsed.playerBestScores : {}),
  }

  for (const entry of leaderboard) {
    playerBestScores[entry.playerId] = Math.max(playerBestScores[entry.playerId] ?? 0, entry.score)
  }

  return {
    totalRuns: Number(parsed?.totalRuns) || 0,
    updatedAt: typeof parsed?.updatedAt === 'string' ? parsed.updatedAt : null,
    scoreCounts: typeof parsed?.scoreCounts === 'object' && parsed?.scoreCounts !== null ? parsed.scoreCounts : {},
    leaderboard,
    playerBestScores,
    playerDisplayNames: typeof parsed?.playerDisplayNames === 'object' && parsed?.playerDisplayNames !== null ? parsed.playerDisplayNames : {},
  }
}

async function readStore() {
  if (getStorageConfig() !== null) {
    const response = await kvRequest(`/get/${STORE_KEY}`)
    if (response) {
      const data = await response.json().catch(() => null) as { result?: string | null } | null
      const raw = typeof data?.result === 'string' ? data.result : null
      if (raw) {
        try {
          return normalizeStore(JSON.parse(raw) as Partial<LeaderboardStore>)
        } catch {
          return createEmptyStore()
        }
      }
    }
  }

  return normalizeStore(getMemoryStore())
}

async function writeStore(store: LeaderboardStore) {
  const normalized = normalizeStore(store)

  if (getStorageConfig() !== null) {
    const response = await kvRequest('/set', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        key: STORE_KEY,
        value: JSON.stringify(normalized),
      }),
    })

    if (response) {
      return {
        storage: getStorageConfig()?.storage ?? 'memory' satisfies StorageMode,
        store: normalized,
      }
    }
  }

  const runtime = globalThis as typeof globalThis & { __perfectDropLeaderboard?: LeaderboardStore }
  runtime.__perfectDropLeaderboard = normalized
  return {
    storage: 'memory' satisfies StorageMode,
    store: normalized,
  }
}

function calculateRank(score: number, leaderboard: LeaderboardEntry[], playerId: string) {
  const playerIndex = leaderboard.findIndex((entry) => entry.playerId === playerId)
  if (playerIndex >= 0) {
    return playerIndex + 1
  }

  let higherScores = 0
  for (const entry of leaderboard) {
    if (entry.score > score) {
      higherScores += 1
    }
  }

  return higherScores + 1
}

function normalizeDisplayName(value: unknown) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.replace(/\s+/g, ' ').trim().slice(0, DISPLAY_NAME_LIMIT)
}

function sanitizeScoreSubmission(value: unknown): ScoreSubmissionBody | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const candidate = value as Partial<ScoreSubmissionBody>
  const playerId = typeof candidate.playerId === 'string' ? candidate.playerId.trim() : ''
  const score = Number(candidate.score)
  const shotCount = Number(candidate.shotCount)

  if (playerId.length === 0) {
    return null
  }

  if (Number.isFinite(score) === false || score < 0) {
    return null
  }

  if (Number.isFinite(shotCount) === false || shotCount < 0) {
    return null
  }

  return {
    playerId,
    displayName: normalizeDisplayName(candidate.displayName),
    score,
    shotCount,
  }
}

function sanitizeProfileSubmission(value: unknown): ProfileSubmissionBody | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const candidate = value as Partial<ProfileSubmissionBody>
  const playerId = typeof candidate.playerId === 'string' ? candidate.playerId.trim() : ''
  if (playerId.length === 0) {
    return null
  }

  return {
    playerId,
    displayName: normalizeDisplayName(candidate.displayName),
  }
}

function decorateLeaderboard(store: LeaderboardStore) {
  return sortLeaderboard(store.leaderboard.map((entry) => ({
    ...entry,
    displayName: store.playerDisplayNames[entry.playerId] ?? entry.displayName ?? '',
  })))
}

function buildResponse(store: LeaderboardStore, playerId: string, storage: StorageMode): LeaderboardResponse {
  return {
    leaderboard: decorateLeaderboard(store),
    totalRuns: store.totalRuns,
    playerBestScore: playerId ? store.playerBestScores[playerId] ?? null : null,
    playerDisplayName: playerId ? store.playerDisplayNames[playerId] ?? '' : '',
    updatedAt: store.updatedAt,
    storage,
  }
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...CORS_HEADERS,
      ...init?.headers,
    },
  })
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const playerId = url.searchParams.get('playerId') ?? ''
  const store = await readStore()
  const storage: StorageMode = getStorageConfig()?.storage ?? 'memory'

  return json(buildResponse(store, playerId, storage))
}

export async function PATCH(request: Request) {
  const body = sanitizeProfileSubmission(await request.json().catch(() => null))
  if (body === null) {
    return json({ error: 'Invalid profile payload.' }, { status: 400 })
  }

  const store = await readStore()
  if (body.displayName) {
    store.playerDisplayNames[body.playerId] = body.displayName
  } else {
    delete store.playerDisplayNames[body.playerId]
  }

  const result = await writeStore(store)
  return json(buildResponse(result.store, body.playerId, result.storage))
}

export async function POST(request: Request) {
  const body = sanitizeScoreSubmission(await request.json().catch(() => null))
  if (body === null) {
    return json({ error: 'Invalid score payload.' }, { status: 400 })
  }

  const store = await readStore()
  const recordedAt = new Date().toISOString()

  if (body.displayName) {
    store.playerDisplayNames[body.playerId] = body.displayName
  }

  store.totalRuns += 1
  store.updatedAt = recordedAt
  store.scoreCounts[String(body.score)] = (store.scoreCounts[String(body.score)] ?? 0) + 1
  store.playerBestScores[body.playerId] = Math.max(store.playerBestScores[body.playerId] ?? 0, body.score)

  const nextEntry: LeaderboardEntry = {
    playerId: body.playerId,
    displayName: body.displayName ?? '',
    score: body.score,
    shotCount: body.shotCount,
    recordedAt,
  }
  const existingIndex = store.leaderboard.findIndex((entry) => entry.playerId === body.playerId)

  if (existingIndex >= 0) {
    const existingEntry = store.leaderboard[existingIndex]
    if (isBetterEntry(nextEntry, existingEntry)) {
      store.leaderboard[existingIndex] = nextEntry
    }
  } else {
    store.leaderboard.push(nextEntry)
  }

  const result = await writeStore(store)
  const rank = calculateRank(body.score, result.store.leaderboard, body.playerId)
  const topPercent = Math.max(1, Math.ceil((rank / Math.max(result.store.leaderboard.length, 1)) * 100))

  return json({
    ...buildResponse(result.store, body.playerId, result.storage),
    rank,
    topPercent,
  })
}
