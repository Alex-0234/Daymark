import { day, nextDate, toDay, weekday } from '../../shared/date'

export type { Column, Item, ItemPatch, List } from '../../shared/types'
export { day, nextDate, toDay, weekday }

export const week = [
  { day: 1, short: 'M', name: 'Mon' },
  { day: 2, short: 'T', name: 'Tue' },
  { day: 3, short: 'W', name: 'Wed' },
  { day: 4, short: 'T', name: 'Thu' },
  { day: 5, short: 'F', name: 'Fri' },
  { day: 6, short: 'S', name: 'Sat' },
  { day: 0, short: 'S', name: 'Sun' }
]

export const formatDate = (date: string): string => {
  if (date === day(0)) return 'Today'
  if (date === day(1)) return 'Tomorrow'
  return new Date(`${date}T00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}

export const formatRepeat = (repeat: number[]): string => {
  if (repeat.length === 0) return ''
  if (repeat.length === 7) return 'Daily'
  if (repeat.length === 5 && [1, 2, 3, 4, 5].every((d) => repeat.includes(d))) return 'Weekdays'
  if (repeat.length === 2 && repeat.includes(0) && repeat.includes(6)) return 'Weekends'
  return week
    .filter((w) => repeat.includes(w.day))
    .map((w) => w.name)
    .join(', ')
}
