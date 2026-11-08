import { CATEGORIES, type Exercise, type ExerciseMap, type Workout } from './utils'

export type StatKey = 'str' | 'hyp' | 'end' | 'pow' | 'bal' | 'ap'

export const STATS: { key: StatKey; abbr: string; name: string; hint: string; color: string }[] = [
  { key: 'str', abbr: 'STR', name: 'Strength', hint: 'Peak difficulty × reps', color: '#f87171' },
  {
    key: 'hyp',
    abbr: 'HYP',
    name: 'Hypertrophy',
    hint: 'Volume in the 6–12 range',
    color: '#fb923c'
  },
  {
    key: 'end',
    abbr: 'END',
    name: 'Endurance',
    hint: 'High reps and long holds',
    color: '#34d399'
  },
  { key: 'pow', abbr: 'POW', name: 'Power', hint: 'Explosive movements', color: '#fbbf24' },
  { key: 'bal', abbr: 'BAL', name: 'Balance', hint: 'Spread across categories', color: '#38bdf8' },
  {
    key: 'ap',
    abbr: 'AP',
    name: 'Adaptive Potential',
    hint: 'Acute : chronic load',
    color: '#a78bfa'
  }
]

const DAY = 86_400_000
const clamp = (value: number): number => Math.round(Math.min(1000, Math.max(10, value)))

type Entry = { exercise: Exercise; value: number; decay: number; age: number }

const entries = (workouts: Workout[], byId: ExerciseMap): Entry[] =>
  workouts.flatMap((w) => {
    const age = (Date.now() - Date.parse(w.finishedAt)) / DAY
    const decay = Math.pow(0.5, age / 60)
    return w.exercises.flatMap((e) => {
      const exercise = byId[e.exerciseId]
      return exercise ? e.sets.map((value) => ({ exercise, value, decay, age })) : []
    })
  })

const sum = (list: Entry[], fn: (e: Entry) => number): number =>
  list.reduce((total, e) => total + fn(e), 0)

export function calculateStats(workouts: Workout[], byId: ExerciseMap): Record<StatKey, number> {
  const all = entries(workouts, byId)
  const reps = all.filter((e) => e.exercise.unit === 'reps')

  const str = sum(reps, (e) => e.exercise.tier ** 2 * Math.min(e.value, 8) * e.decay) / 4
  const hyp =
    sum(
      reps.filter((e) => e.value >= 6 && e.value <= 12),
      (e) => e.value * e.exercise.tier * e.decay
    ) / 5
  const end =
    sum(
      all.filter((e) => e.value > 12 || e.exercise.unit === 'seconds'),
      (e) => e.value * Math.sqrt(e.exercise.tier) * e.decay
    ) / 6
  const pow =
    sum(reps, (e) =>
      e.exercise.branch === 'power'
        ? e.exercise.tier ** 2 * e.value * e.decay
        : e.exercise.tier >= 7
          ? e.exercise.tier * e.value * 0.3 * e.decay
          : 0
    ) / 4

  const perCategory = CATEGORIES.map((c) =>
    sum(
      all.filter((e) => e.exercise.category === c.id),
      (e) => e.value * e.decay
    )
  )
  const total = perCategory.reduce((a, b) => a + b, 0)
  const top = Math.max(...perCategory)
  const bal =
    total === 0 ? 0 : (Math.min(...perCategory) / top) * 0.6 * 1000 + Math.min(1, total / 600) * 400

  const acute = sum(
    all.filter((e) => e.age <= 7),
    (e) => e.value * e.exercise.tier
  )
  const chronic =
    sum(
      all.filter((e) => e.age <= 28),
      (e) => e.value * e.exercise.tier
    ) / 4
  const ratio = chronic === 0 ? 0 : acute / chronic
  const ap = chronic === 0 ? 0 : 1000 * Math.exp(-((ratio - 1.05) ** 2) / 0.18)

  return {
    str: clamp(10 + str),
    hyp: clamp(10 + hyp),
    end: clamp(10 + end),
    pow: clamp(10 + pow),
    bal: clamp(10 + bal),
    ap: clamp(10 + ap)
  }
}

export const workoutXp = (workout: Workout, byId: ExerciseMap): number =>
  Math.round(
    workout.exercises.reduce((total, e) => {
      const exercise = byId[e.exerciseId]
      if (!exercise) return total
      const factor = exercise.unit === 'seconds' ? 0.4 : 1
      return total + e.sets.reduce((a, v) => a + v * exercise.tier * factor, 0)
    }, 0)
  )

export function calculateLevel(
  workouts: Workout[],
  byId: ExerciseMap
): { level: number; xp: number; start: number; next: number } {
  const xp = workouts.reduce((total, w) => total + workoutXp(w, byId), 0)
  const level = Math.floor(Math.sqrt(xp / 100)) + 1
  return { level, xp, start: 100 * (level - 1) ** 2, next: 100 * level ** 2 }
}

export const calculateEp = (workouts: Workout[], byId: ExerciseMap): number =>
  Math.floor(workouts.reduce((total, w) => total + workoutXp(w, byId), 0) / 20)

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
