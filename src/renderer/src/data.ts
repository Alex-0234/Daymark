export type Column = {
  key: string
  label: string
  width: number
  min: number
  max: number
}

export type Item = {
  id: string
  title: string
  date: string
  done: boolean
  values: Record<string, string>
}

export type List = {
  id: string
  feature: string
  name: string
  columns: Column[]
  items: Item[]
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

const col = (key: string, label: string, width: number, min = 80, max = 480): Column => ({
  key,
  label,
  width,
  min,
  max
})

const item = (
  id: string,
  title: string,
  offset: number,
  values: Record<string, string>,
  done = false
): Item => ({ id, title, date: day(offset), done, values })

export const sampleLists: List[] = [
  {
    id: 'list-tasks',
    feature: 'tasks',
    name: 'Tasks',
    columns: [
      col('title', 'Task', 280, 160, 600),
      col('date', 'Due', 130, 100, 200),
      col('priority', 'Priority', 110),
      col('project', 'Project', 140)
    ],
    items: [
      item('1', 'Set up SQLite tasks table', 0, { priority: 'High', project: 'Daymark' }),
      item('2', 'Buy groceries', 0, { priority: 'Medium', project: 'Home' }),
      item('3', 'Write export feature', 2, { priority: 'High', project: 'Daymark' }),
      item('4', 'Call the dentist', 4, { priority: 'Low', project: 'Personal' }),
      item('5', 'Clean the desk', -1, { priority: 'Low', project: 'Home' }, true)
    ]
  },
  {
    id: 'list-hobbies',
    feature: 'hobbies',
    name: 'Hobbies',
    columns: [
      col('title', 'Hobby', 240, 160, 600),
      col('date', 'Next session', 130, 100, 200),
      col('category', 'Category', 140),
      col('duration', 'Duration', 110)
    ],
    items: [
      item('6', 'Guitar practice', 1, { category: 'Music', duration: '45 min' }),
      item('7', 'Sketching', 3, { category: 'Art', duration: '1 h' }),
      item('8', 'Reading', 5, { category: 'Books', duration: '30 min' })
    ]
  },
  {
    id: 'list-workout',
    feature: 'workout',
    name: 'Workout',
    columns: [
      col('title', 'Session', 240, 160, 600),
      col('date', 'Date', 130, 100, 200),
      col('sets', 'Sets', 90, 60, 200),
      col('duration', 'Duration', 110)
    ],
    items: [
      item('9', 'Push day', 0, { sets: '12', duration: '50 min' }),
      item('10', 'Pull day', 2, { sets: '10', duration: '45 min' })
    ]
  },
  {
    id: 'list-metrics',
    feature: 'metrics',
    name: 'Body metrics',
    columns: [
      col('title', 'Metric', 220, 160, 600),
      col('date', 'Date', 130, 100, 200),
      col('value', 'Value', 120),
      col('change', 'Change', 110)
    ],
    items: [item('11', 'Weight', 1, { value: '74.2 kg', change: '-0.3 kg' })]
  },
  {
    id: 'list-food',
    feature: 'food',
    name: 'Food',
    columns: [
      col('title', 'Food', 240, 160, 600),
      col('date', 'Date', 130, 100, 200),
      col('meal', 'Meal', 110),
      col('kcal', 'Calories', 110)
    ],
    items: [item('12', 'Oatmeal with berries', 0, { meal: 'Breakfast', kcal: '420' })]
  }
]
