import type { Exercise, ExerciseMap, LoggedSet, Workout } from '../modules/calisthenics/utils'

export const MAX_LEVEL = 100
const BASE_XP = 10
const XP_PER_LEVEL = BASE_XP * 1.5

const TIER_XP_REWARDS: Record<number, number> = {
  0: 0.5,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 10,
  7: 20,
  8: 40,
  9: 80,
  10: 100,
  11: 200,
  12: 400
}

export const xpNeededForLevel = (level: number): number => BASE_XP + XP_PER_LEVEL * level

export const DEFAULT_BODYWEIGHT = 80

export const setXp = (
  exercise: Exercise,
  set: LoggedSet,
  bodyweight = DEFAULT_BODYWEIGHT
): number =>
  Math.sqrt(TIER_XP_REWARDS[exercise.tier] ?? 0) * set.value * (1 + set.extraWeight / bodyweight)

// bodyweight: the player's current weight (latest logged, else calibrated, else default).
// Added weight is worth more the lighter you are, so every workout is scored against it.
export const workoutXp = (
  workout: Workout,
  byId: ExerciseMap,
  bodyweight = DEFAULT_BODYWEIGHT
): number =>
  workout.exercises.reduce((total, e) => {
    const exercise = byId[e.exerciseId]
    return exercise
      ? total + e.sets.reduce((sum, s) => sum + setXp(exercise, s, bodyweight), 0)
      : total
  }, 0)

export type Level = { level: number; xp: number; needed: number; total: number; progress: number }

export function calculateLevel(
  workouts: Workout[],
  byId: ExerciseMap,
  bodyweight = DEFAULT_BODYWEIGHT
): Level {
  const total = workouts.reduce((sum, w) => sum + workoutXp(w, byId, bodyweight), 0)
  let level = 0
  let xp = total
  while (level < MAX_LEVEL && xp >= xpNeededForLevel(level)) {
    xp -= xpNeededForLevel(level)
    level += 1
  }
  const needed = xpNeededForLevel(level)
  return { level, xp, needed, total, progress: level >= MAX_LEVEL ? 1 : xp / needed }
}

const RANKS: [number, string][] = [
  [80, 'Ascendant'],
  [55, 'Master'],
  [35, 'Elite'],
  [20, 'Vanguard'],
  [10, 'Adept'],
  [5, 'Apprentice'],
  [1, 'Initiate']
]

export const rankTitle = (level: number): string =>
  RANKS.find(([min]) => level >= min)?.[1] ?? 'Initiate'
