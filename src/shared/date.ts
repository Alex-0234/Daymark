export const toDay = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const day = (offset = 0): string => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return toDay(d)
}

export const weekday = (date: string): number => new Date(`${date}T00:00`).getDay()

export const addDays = (date: string, days: number): string => {
  const d = new Date(`${date}T00:00`)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const nextDate = (date: string, repeat: number[]): string => {
  const base = date > day() ? date : day()
  for (let i = 1; i <= 7; i++) {
    const next = addDays(base, i)
    if (repeat.includes(weekday(next))) return next
  }
  return base
}
