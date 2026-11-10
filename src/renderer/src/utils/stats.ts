import { toDay } from '../../../shared/date'
import type { Exercise, Workout } from '../modules/calisthenics/utils'
import { DEFAULT_BODYWEIGHT } from './level'
import type { Progress } from './workout'

export type StatKey = 'STR' | 'HYP' | 'END' | 'POW' | 'BAL' | 'AP'
export type ApState = 'adapting' | 'detraining' | 'overreaching'
export type PlayerStats = Record<StatKey, number> & { apState: ApState }

export const STATS: { key: StatKey; name: string; hint: string; color: string }[] = [
  { key: 'STR', name: 'Strength', hint: 'Hardest tier × reps toward 5', color: '#f87171' },
  { key: 'HYP', name: 'Hypertrophy', hint: 'Reps toward 12 per set', color: '#fb923c' },
  { key: 'END', name: 'Endurance', hint: 'Reps toward 30, holds toward 60s', color: '#34d399' },
  { key: 'POW', name: 'Power', hint: 'Explosive movements, partly strength', color: '#fbbf24' },
  { key: 'BAL', name: 'Balance', hint: 'Level and evenness across categories', color: '#38bdf8' },
  { key: 'AP', name: 'Adaptive Potential', hint: 'Acute : chronic load', color: '#a78bfa' }
]

export const AP_STATES: Record<ApState, string> = {
  adapting: 'Training load is in the optimal range for adaptation.',
  detraining: 'Recent load is too low. Increase training frequency.',
  overreaching: 'Acute load spike detected. Consider a rest day.'
}

const STAT_FLOOR = 10
const STAT_CEIL = 1000
const MAX_TIER = 11
const TIER_BASE = 1.35
const TIER_EXPONENT = { STR: 1, HYP: 0.75, END: 0.5, POW: 1 }
const POW_SPILLOVER = 0.35
const AP_REF_CHRONIC = 0.3
const AP_CALIBRATION_SETS = 10
const RECENCY_FULL_DAYS = 21
const RECENCY_FADE_DAYS = 90
const RECENCY_FLOOR = 0.35
const DAY = 86_400_000

type Observation = { amount: number; load: number; recency: number }

const tierFactor = (tier: number, exponent: number): number =>
  Math.pow(TIER_BASE, exponent * (tier - MAX_TIER))

const repFactors = (
  amount: number,
  unit: Exercise['unit']
): { STR: number; HYP: number; END: number } =>
  unit === 'seconds'
    ? { STR: 0.6 + 0.4 * Math.min(amount / 10, 1), HYP: 0, END: Math.min(amount / 60, 1) }
    : {
        STR: 0.6 + 0.4 * Math.min(amount / 5, 1),
        HYP: Math.min(amount / 12, 1),
        END: Math.min(amount / 30, 1)
      }

const recencyMultiplier = (daysAgo: number): number => {
  if (daysAgo <= RECENCY_FULL_DAYS) return 1
  if (daysAgo >= RECENCY_FULL_DAYS + RECENCY_FADE_DAYS) return RECENCY_FLOOR
  return 1 - ((daysAgo - RECENCY_FULL_DAYS) / RECENCY_FADE_DAYS) * (1 - RECENCY_FLOOR)
}

// Matches the old app, which bucketed workouts by "YYYY-MM-DD" parsed as UTC midnight.
const daysAgo = (workout: Workout, today: Date): number =>
  Math.max(
    0,
    Math.floor((today.getTime() - new Date(toDay(new Date(workout.finishedAt))).getTime()) / DAY)
  )

const scale = (raw: number): number =>
  Math.min(STAT_CEIL, Math.floor(STAT_FLOOR + (STAT_CEIL - STAT_FLOOR) * raw))

const loadFactor = (extraWeight: number, bodyweight: number): number => 1 + extraWeight / bodyweight

function collectObservations(
  workouts: Workout[],
  progress: Progress,
  bodyweight: number,
  today: Date
): Record<string, Observation[]> {
  const observations: Record<string, Observation[]> = {}
  const push = (id: string, obs: Observation): void => {
    ;(observations[id] ??= []).push(obs)
  }

  for (const [id, p] of Object.entries(progress))
    if (p.personalBest > 0) push(id, { amount: p.personalBest, load: 1, recency: 1 })

  for (const w of workouts) {
    const recency = recencyMultiplier(daysAgo(w, today))
    for (const e of w.exercises)
      for (const s of e.sets)
        if (s.value > 0)
          push(e.exerciseId, {
            amount: s.value,
            load: loadFactor(s.extraWeight, bodyweight),
            recency
          })
  }

  return observations
}

// Acute:chronic workload ratio. 0.8–1.3 is adapting, above 1.5 overreaching.
function calculateAP(
  workouts: Workout[],
  byId: Record<string, Exercise>,
  bodyweight: number,
  today: Date
): { value: number; state: ApState } {
  let acuteSum = 0
  let chronicSum = 0
  let loggedSets = 0

  for (const w of workouts) {
    const age = daysAgo(w, today)
    for (const e of w.exercises) {
      loggedSets += e.sets.length
      const exercise = byId[e.exerciseId]
      if (!exercise || age > 27) continue
      for (const s of e.sets) {
        if (s.value <= 0) continue
        const load =
          tierFactor(exercise.tier, 1) *
          repFactors(s.value, exercise.unit).STR *
          loadFactor(s.extraWeight, bodyweight)
        chronicSum += load
        if (age <= 6) acuteSum += load
      }
    }
  }

  const acuteLoad = acuteSum / 7
  const chronicLoad = chronicSum / 28
  const acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : acuteLoad > 0 ? 2.0 : 0

  let acwrScore: number
  if (acwr <= 0) acwrScore = 0
  else if (acwr < 0.5) acwrScore = (acwr / 0.5) * 0.3
  else if (acwr < 0.8) acwrScore = 0.3 + ((acwr - 0.5) / 0.3) * 0.7
  else if (acwr <= 1.3) acwrScore = 1.0
  else if (acwr < 1.8) acwrScore = 1.0 - ((acwr - 1.3) / 0.5) * 0.8
  else acwrScore = 0.2
    
  const chronicFactor = Math.min(1, chronicLoad / AP_REF_CHRONIC)

  let state: ApState = 'adapting'
  if (loggedSets >= AP_CALIBRATION_SETS) {
    if (acwr > 1.5) state = 'overreaching'
    else if (chronicLoad < AP_REF_CHRONIC * 0.2) state = 'detraining'
  }

  return { value: scale(chronicFactor * acwrScore), state }
}

export function calculatePlayerStats(
  workouts: Workout[],
  exercises: Exercise[],
  progress: Progress,
  bodyweight = DEFAULT_BODYWEIGHT
): PlayerStats {
  const today = new Date()
  const byId = Object.fromEntries(exercises.map((e) => [e.id, e]))
  const observations = collectObservations(workouts, progress, bodyweight, today)
  const categories = [...new Set(exercises.map((e) => e.category))]

  const totals = { STR: 0, HYP: 0, END: 0, POW: 0 }
  const categoryScores: number[] = []

  for (const category of categories) {
    const best = { STR: 0, HYP: 0, END: 0, POW: 0 }

    for (const exercise of exercises) {
      if (exercise.category !== category) continue
      for (const obs of observations[exercise.id] ?? []) {
        const reps = repFactors(obs.amount, exercise.unit)
        const score = (stat: keyof typeof TIER_EXPONENT, repFactor: number): number =>
          Math.min(1, tierFactor(exercise.tier, TIER_EXPONENT[stat]) * repFactor * obs.load) *
          obs.recency

        best.STR = Math.max(best.STR, score('STR', reps.STR))
        best.HYP = Math.max(best.HYP, score('HYP', reps.HYP))
        best.END = Math.max(best.END, score('END', reps.END))
        const pow = score('POW', reps.STR)
        best.POW = Math.max(best.POW, exercise.isExplosive ? pow : pow * POW_SPILLOVER)
      }
    }

    totals.STR += best.STR
    totals.HYP += best.HYP
    totals.END += best.END
    totals.POW += best.POW
    categoryScores.push(best.STR * 0.5 + best.HYP * 0.25 + best.END * 0.25)
  }

  const n = categories.length || 1

  // BAL = mean × evenness, where evenness falls with the coefficient of variation.
  const mean = categoryScores.reduce((a, b) => a + b, 0) / n
  const variance = categoryScores.reduce((acc, s) => acc + (s - mean) ** 2, 0) / n
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 1
  const evenness = Math.max(0, 1 - Math.min(cv, 1.5) / 1.5)

  const ap = calculateAP(workouts, byId, bodyweight, today)

  return {
    STR: scale(totals.STR / n),
    HYP: scale(totals.HYP / n),
    END: scale(totals.END / n),
    POW: scale(totals.POW / n),
    BAL: scale(mean * evenness),
    AP: ap.value,
    apState: ap.state
  }
}
