type Env = {
  LEADERBOARD?: KVNamespace
}

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
}

type SubmissionBody = {
  playerId: string
  displayName: string
  score: number
  shotCount: number
}

const STORE_KEY = 'perfect-drop-leaderboard-v1'
const MAX_LEADERBOARD_SIZE = 12

function createEmptyStore(): LeaderboardStore {
  return {
    totalRuns: 0,
    updatedAt: null,
    scoreCounts: {},
    leaderboard: [],
    playerBestScores: {},
  }
}

function getMemoryStore() {
  const runtime = globalThis as typeof globalThis & { __perfectDropLeaderboard?: LeaderboardStore }
  if (runtime.__perfectDropLeaderboard === undefined) {
    runtime.__perfectDropLeaderboard = createEmptyStore()
  }

  return runtime.__perfectDropLeaderboard
}

async function readStore(env: Env) {
  if (env.LEADERBOARD) {
    const stored = await env.LEADERBOARD.get<LeaderboardStore>(STORE_KEY, 'json')
    return stored ?? createEmptyStore()
  }

  return getMemoryStore()
}

async function writeStore(env: Env, store: LeaderboardStore) {
  if (env.LEADERBOARD) {
    await env.LEADERBOARD.put(STORE_KEY, JSON.stringify(store))
    return
  }

  const runtime = globalThis as typeof globalThis & { __perfectDropLeaderboard?: LeaderboardStore }
  runtime.__perfectDropLeaderboard = store
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

function sanitizeSubmission(value: unknown): SubmissionBody | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const candidate = value as Partial<SubmissionBody>
  const playerId = typeof candidate.playerId === 'string' ? candidate.playerId.trim() : ''
  const displayName = typeof candidate.displayName === 'string' ? candidate.displayName.trim() : ''
  const score = Number(candidate.score)
  const shotCount = Number(candidate.shotCount)

  if (playerId.length === 0 || displayName.length === 0) {
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
    displayName: displayName.slice(0, 32),
    score,
    shotCount,
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

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url)
  const playerId = url.searchParams.get('playerId') ?? ''
  const store = await readStore(env)

  return json({
    leaderboard: store.leaderboard,
    totalRuns: store.totalRuns,
    playerBestScore: playerId ? store.playerBestScores[playerId] ?? null : null,
    updatedAt: store.updatedAt,
  })
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const body = sanitizeSubmission(await request.json().catch(() => null))
  if (body === null) {
    return json({ error: 'Invalid score payload.' }, { status: 400 })
  }

  const store = await readStore(env)
  const recordedAt = new Date().toISOString()

  store.totalRuns += 1
  store.updatedAt = recordedAt
  store.scoreCounts[String(body.score)] = (store.scoreCounts[String(body.score)] ?? 0) + 1
  store.playerBestScores[body.playerId] = Math.max(store.playerBestScores[body.playerId] ?? 0, body.score)

  store.leaderboard = sortLeaderboard([
    ...store.leaderboard,
    {
      playerId: body.playerId,
      displayName: body.displayName,
      score: body.score,
      shotCount: body.shotCount,
      recordedAt,
    },
  ]).slice(0, MAX_LEADERBOARD_SIZE)

  await writeStore(env, store)

  const rank = calculateRank(body.score, store.scoreCounts)
  const topPercent = Math.max(1, Math.ceil((rank / Math.max(store.totalRuns, 1)) * 100))

  return json({
    leaderboard: store.leaderboard,
    totalRuns: store.totalRuns,
    playerBestScore: store.playerBestScores[body.playerId] ?? body.score,
    updatedAt: store.updatedAt,
    rank,
    topPercent,
  })
}
