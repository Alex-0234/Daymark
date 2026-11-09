import { addDays, day, toDay, weekday } from '../../../shared/date'
import type { Workout } from '../modules/calisthenics/utils'

export type Streak = {
  current: number
  highest: number
  // Today is a scheduled day and nothing is logged yet.
  dueToday: boolean
}

// Every training day adds 1. Missing a scheduled day (the calisthenics hobby's repeat days)
// resets it to 0. Unscheduled days are rest days and never break it. Today only counts
// against the streak once it's over.
// Note: the current schedule is applied to the whole history.
export function calculateStreak(workouts: Workout[], schedule: number[], today = day()): Streak {
  const trained = new Set(workouts.map((w) => toDay(new Date(w.finishedAt))))
  const scheduled = (d: string): boolean => schedule.length === 0 || schedule.includes(weekday(d))
  const dueToday = scheduled(today) && !trained.has(today)

  if (trained.size === 0) return { current: 0, highest: 0, dueToday }

  let current = 0
  let highest = 0
  for (let d = [...trained].sort()[0]; d <= today; d = addDays(d, 1)) {
    if (trained.has(d)) current += 1
    else if (scheduled(d) && d !== today) current = 0
    highest = Math.max(highest, current)
  }

  return { current, highest, dueToday }
}
