import { addDays, day, toDay, weekday } from '../../../shared/date'
import type { ExerciseMap, Workout } from '../modules/calisthenics/utils'

export type Series = { id: string; label: string; data: number[]; color: string }

// Movement groups for charts. Every exercise category belongs to exactly one.
export const MUSCLE_GROUPS: { id: string; label: string; color: string; categories: string[] }[] = [
  { id: 'push', label: 'Push', color: 'var(--series-1)', categories: ['pushups', 'dips'] },
  { id: 'pull', label: 'Pull', color: 'var(--series-2)', categories: ['pullups'] },
  { id: 'legs', label: 'Legs', color: 'var(--series-3)', categories: ['squats', 'bridges'] },
  { id: 'core', label: 'Core', color: 'var(--series-4)', categories: ['core'] }
]

// First day ("YYYY-MM-DD") of the week containing `date`.
export const weekStart = (date: string, startOnMonday = true): string => {
  const wd = weekday(date)
  return addDays(date, -(startOnMonday ? (wd + 6) % 7 : wd))
}

// Sets done per movement group, per week. data[weeks - 1] is the current week,
// data[0] the oldest. Weeks run Monday–Sunday unless startOnMonday is false.
export function setsPerGroup(
  workouts: Workout[],
  byId: ExerciseMap,
  { weeks = 4, startOnMonday = true, today = day() } = {}
): Series[] {
  const series = MUSCLE_GROUPS.map(({ id, label, color }) => ({
    id,
    label,
    color,
    data: Array<number>(weeks).fill(0)
  }))
  const groupOf = Object.fromEntries(
    MUSCLE_GROUPS.flatMap((g, i) => g.categories.map((c) => [c, i]))
  )
  const current = weekStart(today, startOnMonday)

  for (const w of workouts) {
    const start = weekStart(toDay(new Date(w.finishedAt)), startOnMonday)
    const weeksAgo = Math.round(
      (Date.parse(`${current}T00:00`) - Date.parse(`${start}T00:00`)) / (7 * 86_400_000)
    )
    if (weeksAgo < 0 || weeksAgo >= weeks) continue
    for (const e of w.exercises) {
      const group = groupOf[byId[e.exerciseId]?.category ?? '']
      if (group !== undefined) series[group].data[weeks - 1 - weeksAgo] += e.sets.length
    }
  }

  return series
}
