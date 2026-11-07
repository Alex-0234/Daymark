export type Item = {
  id: string
  feature: string
  title: string
  date: string
  done: boolean
  values: Record<string, string>
}

export const day = (offset: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const formatDate = (date: string): string => {
  if (date === day(0)) return 'Today'
  if (date === day(1)) return 'Tomorrow'
  return new Date(`${date}T00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}

const item = (
  id: string,
  feature: string,
  title: string,
  offset: number,
  values: Record<string, string>,
  done = false
): Item => ({ id, feature, title, date: day(offset), done, values })

export const sampleItems: Item[] = [
  item('1', 'tasks', 'Set up SQLite tasks table', 0, { priority: 'High', project: 'Daymark' }),
  item('2', 'tasks', 'Buy groceries', 0, { priority: 'Medium', project: 'Home' }),
  item('3', 'tasks', 'Write export feature', 2, { priority: 'High', project: 'Daymark' }),
  item('4', 'tasks', 'Call the dentist', 4, { priority: 'Low', project: 'Personal' }),
  item('5', 'tasks', 'Clean the desk', -1, { priority: 'Low', project: 'Home' }, true),
  item('6', 'hobbies', 'Guitar practice', 1, { category: 'Music', duration: '45 min' }),
  item('7', 'hobbies', 'Sketching', 3, { category: 'Art', duration: '1 h' }),
  item('8', 'hobbies', 'Reading', 5, { category: 'Books', duration: '30 min' }),
  item('9', 'workout', 'Push day', 0, { sets: '12', duration: '50 min' }),
  item('10', 'workout', 'Pull day', 2, { sets: '10', duration: '45 min' }),
  item('11', 'metrics', 'Weight', 1, { value: '74.2 kg', change: '-0.3 kg' }),
  item('12', 'food', 'Oatmeal with berries', 0, { meal: 'Breakfast', kcal: '420' })
]
