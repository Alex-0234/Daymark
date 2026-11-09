import type { Exercise, ExerciseMap, Workout } from '../modules/calisthenics/utils'
import type { Unlocks } from '../../../shared/cali'
import type { Progress } from './workout'

const TIER_BASE = 1.35
const MAX_TIER = 11

const tierFactor = (tier = 0): number => Math.pow(TIER_BASE, tier - MAX_TIER)

// 0..1 difficulty of one set: tier sets the ceiling, reps/seconds fill the last half of it.
function setScore(exercise: Exercise | undefined, value: number): number {
  if (!exercise || !(value > 0)) return 0
  const saturation = exercise.unit === 'seconds' ? 30 : 10
  return tierFactor(exercise.tier) * (0.5 + 0.5 * Math.min(value / saturation, 1))
}

// ── Rating ──────────────────────────────────────────────────────────────────

const RATING_FLOOR = 0
const RATING_SCALE = 400
const K_FACTOR = 32
const DIFFICULTY_RATING_CEIL = 5000
const MIN_EFFORT_SETS = 3 // fewer sets than this and peak effort isn't credited in full
const VOLUME_BONUS_MAX = 0.25 // extra volume beyond the hardest set can add at most this much
const VOLUME_HALF_LIFE = 4 // extra hardest-set-equivalent sets needed to reach half of the bonus

export function calculateWorkoutRating(workout: Workout, byId: ExerciseMap): number {
  let hardestSet = 0
  let volume = 0
  let setCount = 0

  for (const e of workout.exercises)
    for (const s of e.sets) {
      const score = setScore(byId[e.exerciseId], s.value)
      hardestSet = Math.max(hardestSet, score)
      volume += score
      setCount += 1
    }

  if (hardestSet === 0) return 0

  // Peak effort (hardestSet) drives the score, not how the session was structured -
  // no assumption that a "full" workout looks like any particular number of sets.
  const effortFactor = Math.min(setCount / MIN_EFFORT_SETS, 1)
  const extraSets = Math.max(0, volume / hardestSet - 1)
  const volumeBonus = VOLUME_BONUS_MAX * (extraSets / (extraSets + VOLUME_HALF_LIFE))

  return Math.round(DIFFICULTY_RATING_CEIL * hardestSet * effortFactor * (1 + volumeBonus))
}

// completion: 0..1, fraction of the planned workout actually finished.
export function updateRating(currentRating: number, workoutRating: number, completion = 1): number {
  const expected = 1 / (1 + Math.pow(10, (workoutRating - currentRating) / RATING_SCALE))
  const next = currentRating + K_FACTOR * (completion - expected)
  return Math.max(RATING_FLOOR, Math.round(next))
}

const chronological = (workouts: Workout[]): Workout[] =>
  [...workouts].sort((a, b) => a.startedAt.localeCompare(b.startedAt))

// The player's rating, replayed from every logged workout in order, starting from the
// onboarding benchmark (if any).
export const calculatePlayerRating = (
  workouts: Workout[],
  byId: ExerciseMap,
  start = RATING_FLOOR
): number =>
  chronological(workouts).reduce(
    (rating, w) => updateRating(rating, calculateWorkoutRating(w, byId), w.completion ?? 1),
    start
  )

// ── EP & unlocks ────────────────────────────────────────────────────────────

const EP_SCALE = 15
const SET_DECAY = 0.8
const UNLOCK_BASE_COST = 20
const UNLOCK_TIER_BASE = 1.6
const PREREQ_MIN_REPS = 8
const PREREQ_MIN_SECONDS = 20

// Later sets of the same exercise are worth less, so EP rewards variety over grinding.
export function calculateWorkoutEP(workout: Workout, byId: ExerciseMap): number {
  let ep = 0
  for (const e of workout.exercises)
    e.sets.forEach((s, i) => {
      ep += setScore(byId[e.exerciseId], s.value) * EP_SCALE * Math.pow(SET_DECAY, i)
    })
  return Math.ceil(ep)
}

export const getUnlockCost = (exercise: Exercise): number =>
  Math.round(UNLOCK_BASE_COST * Math.pow(UNLOCK_TIER_BASE, exercise.tier))

export const prereqMinimum = (exercise: Exercise): number =>
  exercise.unit === 'seconds' ? PREREQ_MIN_SECONDS : PREREQ_MIN_REPS

// Unlocked: a starting exercise (no prerequisites), bought with EP, already trained,
// or covered by the onboarding benchmark (`baseline`).
export function getUnlocked(
  exercises: Exercise[],
  unlocks: Unlocks,
  workouts: Workout[],
  baseline: Progress = {}
): Set<string> {
  const unlocked = new Set([...Object.keys(unlocks), ...Object.keys(baseline)])
  for (const e of exercises) if (e.requires.length === 0) unlocked.add(e.id)
  for (const w of workouts) for (const e of w.exercises) unlocked.add(e.exerciseId)
  return unlocked
}

export type UnlockCheck =
  { ok: true; cost: number } | { ok: false; reason: string; exercises?: string[] }

export function canUnlockExercise(
  exercise: Exercise,
  unlocked: Set<string>,
  progress: Progress,
  byId: ExerciseMap
): UnlockCheck {
  if (unlocked.has(exercise.id)) return { ok: false, reason: 'Already unlocked' }

  const locked = exercise.requires.filter((id) => !unlocked.has(id))
  if (locked.length > 0) return { ok: false, reason: 'Prerequisites locked', exercises: locked }

  const weak = exercise.requires.filter((id) => {
    const prereq = byId[id]
    return !prereq || (progress[id]?.personalBest ?? 0) < prereqMinimum(prereq)
  })
  if (weak.length > 0)
    return { ok: false, reason: 'Prerequisite proficiency too low', exercises: weak }

  return { ok: true, cost: getUnlockCost(exercise) }
}

// The cheapest exercise the player could unlock right now (prereqs already met), or null.
export function getCheapestUnlockable(
  exercises: Exercise[],
  unlocked: Set<string>,
  progress: Progress,
  byId: ExerciseMap
): (Exercise & { cost: number }) | null {
  let best: (Exercise & { cost: number }) | null = null
  for (const exercise of exercises) {
    const check = canUnlockExercise(exercise, unlocked, progress, byId)
    if (check.ok && (!best || check.cost < best.cost)) best = { ...exercise, cost: check.cost }
  }
  return best
}

// EP balance: everything earned from workouts minus everything spent on unlocks.
export function calculateEpBalance(
  workouts: Workout[],
  byId: ExerciseMap,
  unlocks: Unlocks,
  bonus = 0
): number {
  const earned = bonus + workouts.reduce((sum, w) => sum + calculateWorkoutEP(w, byId), 0)
  const spent = Object.values(unlocks).reduce((sum, cost) => sum + cost, 0)
  return Math.max(0, earned - spent)
}
