const SCORE_HISTORY_STORAGE_KEY = 'blip-perfect-score-history'
const MAX_STORED_RUNS = 300

export interface RunEndedSummary {
  score: number
  bestScore: number
  shotCount: number
}

export interface RecordedRunSummary extends RunEndedSummary {
  totalRuns: number
  rank: number
  topPercent: number
}

function readHistory() {
  try {
    const raw = window.localStorage.getItem(SCORE_HISTORY_STORAGE_KEY)
    if (raw === null) {
      return [] as number[]
    }

    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) === false) {
      return [] as number[]
    }

    return parsed
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value >= 0)
  } catch {
    return [] as number[]
  }
}

function writeHistory(history: number[]) {
  try {
    window.localStorage.setItem(
      SCORE_HISTORY_STORAGE_KEY,
      JSON.stringify(history.slice(0, MAX_STORED_RUNS)),
    )
  } catch {
    // Ignore storage failures in sandboxed/private contexts.
  }
}

export function recordRun(summary: RunEndedSummary): RecordedRunSummary {
  const history = [summary.score, ...readHistory()].slice(0, MAX_STORED_RUNS)
  writeHistory(history)

  const higherScores = history.filter((score) => score > summary.score).length
  const rank = higherScores + 1
  const totalRuns = history.length
  const topPercent = Math.max(1, Math.round((rank / Math.max(totalRuns, 1)) * 100))

  return {
    ...summary,
    totalRuns,
    rank,
    topPercent,
  }
}
