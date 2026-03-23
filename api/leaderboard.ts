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

type StorageMode = 'vercel-kv' | 'memory'

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
const MAX_LEADERBOARD_SIZE = 12
const DISPLAY_NAME_LIMIT = 24

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

function hasKvConfig() {
  return typeof process.env.KV_REST_API_URL === 'string'
    && process.env.KV_REST_API_URL.length > 0
    && typeof process.env.KV_REST_API_TOKEN === 'string'
    && process.env.KV_REST_API_TOKEN.length > 0
}

async function kvRequest(path: string, init?: RequestInit) {
  const baseUrl = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!baseUrl || !token) {
    return null
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${token}`,
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

async function readStore() {
  if (hasKvConfig()) {
    const response = await kvRequest(`/get/${STORE_KEY}`)
    if (response) {
      const data = await response.json().catch(() => null) as { result?: string | null } | null
      const raw = typeof data?.result === 'string' ? data.result : null
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<LeaderboardStore>
          return {
            totalRuns: Number(parsed.totalRuns) || 0,
            updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
            scoreCounts: typeof parsed.scoreCounts === 'object' && parsed.scoreCounts !== null ? parsed.scoreCounts : {},
            leaderboard: Array.isArray(parsed.leaderboard) ? parsed.leaderboard : [],
            playerBestScores: typeof parsed.playerBestScores === 'object' && parsed.playerBestScores !== null ? parsed.playerBestScores : {},
            playerDisplayNames: typeof parsed.playerDisplayNames === 'object' && parsed.playerDisplayNames !== null ? parsed.playerDisplayNames : {},
          } satisfies LeaderboardStore
        } catch {
          return createEmptyStore()
        }
      }
    }
  }

  return getMemoryStore()
}

async function writeStore(store: LeaderboardStore) {
  if (hasKvConfig()) {
    const response = await kvRequest('/set', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        key: STORE_KEY,
        value: JSON.stringify(store),
      }),
    })

    if (response) {
      return 'vercel-kv' satisfies StorageMode
    }
  }

  const runtime = globalThis as typeof globalThis & { __perfectDropLeaderboard?: LeaderboardStore }
  runtime.__perfectDropLeaderboard = store
  return 'memory' satisfies StorageMode
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

function calculateRank(score: number, scoreCounts: Record<string, number>) {
  let higherScores = 0

  for (const [scoreValue, count] of Object.entries(scoreCounts)) {
    if (Number(scoreValue) > score) {
      higherScores += count
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
  return store.leaderboard.map((entry) => ({
    ...entry,
    displayName: store.playerDisplayNames[entry.playerId] ?? entry.displayName ?? '',
  }))
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
      ...init?.headers,
    },
  })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const playerId = url.searchParams.get('playerId') ?? ''
  const store = await readStore()
  const storage: StorageMode = hasKvConfig() ? 'vercel-kv' : 'memory'

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

  const storage = await writeStore(store)
  return json(buildResponse(store, body.playerId, storage))
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

  store.leaderboard = sortLeaderboard([
    ...store.leaderboard,
    {
      playerId: body.playerId,
      displayName: body.displayName ?? '',
      score: body.score,
      shotCount: body.shotCount,
      recordedAt,
    },
  ]).slice(0, MAX_LEADERBOARD_SIZE)

  const storage = await writeStore(store)
  const rank = calculateRank(body.score, store.scoreCounts)
  const topPercent = Math.max(1, Math.ceil((rank / Math.max(store.totalRuns, 1)) * 100))

  return json({
    ...buildResponse(store, body.playerId, storage),
    rank,
    topPercent,
  })
}
