import type { Draft, Exercise, LoggedSet, Workout } from '../../../../shared/cali'

export type {
  Draft,
  Exercise,
  LoggedSet,
  Routine,
  SessionExercise,
  SetEntry,
  Workout
} from '../../../../shared/cali'

export type ExerciseMap = Record<string, Exercise>

export const CATEGORIES = [
  { id: 'pushups', name: 'Push-ups' },
  { id: 'pullups', name: 'Pull-ups' },
  { id: 'squats', name: 'Squats' },
  { id: 'dips', name: 'Dips' },
  { id: 'core', name: 'Core' },
  { id: 'bridges', name: 'Bridges' }
]

export const REST_SECONDS = 90

export const uid = (): string => crypto.randomUUID()

export const categoryName = (id: string): string => CATEGORIES.find((c) => c.id === id)?.name ?? id

export const unitLabel = (exercise?: Exercise): string =>
  exercise?.unit === 'seconds' ? 'sec' : 'reps'

export const formatValue = (value: number, exercise?: Exercise): string =>
  exercise?.unit === 'seconds' ? `${value}s` : `${value}`

export const formatSet = (set: LoggedSet, exercise?: Exercise): string =>
  formatValue(set.value, exercise) + (set.extraWeight > 0 ? ` +${set.extraWeight}kg` : '')

export const formatClock = (seconds: number): string => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`
}

export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}

export const formatDay = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })

export const totalSets = (workout: Workout): number =>
  workout.exercises.reduce((sum, e) => sum + e.sets.length, 0)

export const totalReps = (workout: Workout, byId: ExerciseMap): number =>
  workout.exercises.reduce(
    (sum, e) =>
      byId[e.exerciseId]?.unit === 'seconds' ? sum : sum + e.sets.reduce((a, s) => a + s.value, 0),
    0
  )

const completion = (draft: Draft): number => {
  const planned = draft.exercises.reduce((sum, e) => sum + e.sets.length, 0)
  const done = draft.exercises.reduce(
    (sum, e) => sum + e.sets.filter((s) => s.done && s.value).length,
    0
  )
  return planned > 0 ? done / planned : 1
}

export const draftToWorkout = (draft: Draft, finishedAt: string): Workout => ({
  id: draft.id,
  name: draft.name.trim() || 'Workout',
  startedAt: draft.startedAt,
  finishedAt,
  duration: Math.max(0, Math.round((Date.parse(finishedAt) - Date.parse(draft.startedAt)) / 1000)),
  completion: completion(draft),
  exercises: draft.exercises
    .map((e) => ({
      exerciseId: e.exerciseId,
      sets: e.sets
        .filter((s) => s.done && s.value)
        .map((s) => ({ value: s.value as number, extraWeight: s.extraWeight ?? 0 }))
    }))
    .filter((e) => e.sets.length > 0)
})
