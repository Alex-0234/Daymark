import type { Exercise, ExerciseMap, Workout } from '../modules/calisthenics/utils'

export type Progress = Record<string, { totalReps: number; personalBest: number }>

const TIER_BASE = 1.35
const ESTIMATE_REP_CAP = 50

export const estimateLowerTierReps = (reps: number, fromTier: number, toTier: number): number =>
  Math.min(Math.round(reps * Math.pow(TIER_BASE, fromTier - toTier)), ESTIMATE_REP_CAP)

const groupSets = (workout: Workout): Map<string, number[]> => {
  const grouped = new Map<string, number[]>()
  for (const e of workout.exercises)
    grouped.set(e.exerciseId, [...(grouped.get(e.exerciseId) ?? []), ...e.sets.map((s) => s.value)])
  return grouped
}

// Training an exercise also credits easier (lower or equal tier) exercises in its category.
export function buildProgress(
  workouts: Workout[],
  exercises: Exercise[],
  byId: ExerciseMap
): Progress {
  const progress: Progress = {}

  for (const workout of workouts)
    for (const [exerciseId, sets] of groupSets(workout)) {
      const source = byId[exerciseId]
      if (!source) continue
      const total = sets.reduce((a, b) => a + b, 0)
      const best = Math.max(0, ...sets)

      for (const target of exercises) {
        if (target.category !== source.category || target.tier > source.tier) continue
        const prev = progress[target.id] ?? { totalReps: 0, personalBest: 0 }
        progress[target.id] = {
          totalReps:
            prev.totalReps +
            (target.tier === source.tier
              ? total
              : estimateLowerTierReps(total, source.tier, target.tier)),
          personalBest:
            target.id === exerciseId ? Math.max(prev.personalBest, best) : prev.personalBest
        }
      }
    }

  return progress
}
