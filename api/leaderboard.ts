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

export async function GET(request: Request) {
  const url = new URL(request.url)
  const playerId = url.searchParams.get('playerId') ?? ''
  const store = getMemoryStore()

  return json({
    leaderboard: store.leaderboard,
    totalRuns: store.totalRuns,
    playerBestScore: playerId ? store.playerBestScores[playerId] ?? null : null,
    updatedAt: store.updatedAt,
  })
}

export async function POST(request: Request) {
  const body = sanitizeSubmission(await request.json().catch(() => null))
  if (body === null) {
    return json({ error: 'Invalid score payload.' }, { status: 400 })
  }

  const store = getMemoryStore()
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
