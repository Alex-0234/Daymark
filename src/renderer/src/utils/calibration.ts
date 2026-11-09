import type { CalibrationResult } from '../../../shared/cali'
import type { Exercise, ExerciseMap, Workout } from '../modules/calisthenics/utils'
import { calculateWorkoutRating, getUnlockCost, prereqMinimum } from './progression'
import { estimateLowerTierReps, type Progress } from './workout'

// Onboarding asks "can you do one rep?" up each ladder, easiest first.
export const EVALUATION_STAGES: { category: string; name: string; ladder: string[] }[] = [
  {
    category: 'pushups',
    name: 'Push-ups',
    ladder: [
      'pushup_knee',
      'pushup_standard',
      'pushup_diamond',
      'pushup_archer',
      'pushup_onearm_assisted',
      'pushup_onearm'
    ]
  },
  {
    category: 'squats',
    name: 'Squats',
    ladder: [
      'squat_half',
      'squat_standard',
      'squat_bulgarian',
      'squat_pistol_assisted',
      'squat_pistol',
      'squat_pistol_dragon'
    ]
  },
  {
    category: 'core',
    name: 'Core',
    ladder: [
      'core_crunch',
      'core_leg_raise',
      'core_knee_raise_hanging',
      'core_leg_raise_hanging',
      'core_toes_to_bar'
    ]
  },
  {
    category: 'pullups',
    name: 'Pull-ups',
    ladder: [
      'pullup_australian',
      'pullup_jackknife',
      'pullup_negative',
      'pullup_chin',
      'pullup_standard',
      'pullup_archer'
    ]
  }
]

// Everything at or below the tested tier in that category counts as trained, with a
// best estimated from the tested result (easier variations -> more reps, capped).
export function calibrationProgress(results: CalibrationResult[], exercises: Exercise[]): Progress {
  const progress: Progress = {}
  const byId = Object.fromEntries(exercises.map((e) => [e.id, e]))

  for (const { exerciseId, value } of results) {
    const tested = byId[exerciseId]
    if (!tested) continue
    for (const e of exercises) {
      if (e.category !== tested.category || e.tier > tested.tier) continue
      const best =
        e.tier === tested.tier ? value : estimateLowerTierReps(value, tested.tier, e.tier)
      const prev = progress[e.id]?.personalBest ?? 0
      if (best > prev) progress[e.id] = { totalReps: best, personalBest: best }
    }
  }

  return progress
}

// The closer a result is to the prerequisite minimum, the more of the cheapest next
// unlock it pays for up front.
export function calibrationBonusEp(results: CalibrationResult[], exercises: Exercise[]): number {
  let bonus = 0
  for (const { exerciseId, value } of results) {
    const tested = exercises.find((e) => e.id === exerciseId)
    if (!tested) continue
    const nextCosts = exercises.filter((e) => e.requires.includes(exerciseId)).map(getUnlockCost)
    if (nextCosts.length === 0) continue
    const proximity = Math.min(value / prereqMinimum(tested), 1)
    bonus += Math.round(Math.min(...nextCosts) * proximity)
  }
  return bonus
}

// Starting rating: the benchmark scored as if it were one workout (one set per category).
export function calibrationRating(results: CalibrationResult[], byId: ExerciseMap): number {
  if (results.length === 0) return 0
  const benchmark: Workout = {
    id: 'calibration',
    name: 'Calibration',
    startedAt: '',
    finishedAt: '',
    duration: 0,
    completion: 1,
    exercises: results.map((r) => ({
      exerciseId: r.exerciseId,
      sets: [{ value: r.value, extraWeight: 0 }]
    }))
  }
  return calculateWorkoutRating(benchmark, byId)
}
