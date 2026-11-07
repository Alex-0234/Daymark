import { Apple, CheckSquare, Dumbbell, Palette, Ruler, type LucideIcon } from 'lucide-react'

export type Column = {
  key: string
  label: string
  width: number
}

export type Feature = {
  id: string
  name: string
  icon: LucideIcon
  color: string
  hover: string
  columns: Column[]
}

export const features: Feature[] = [
  {
    id: 'tasks',
    name: 'Tasks',
    icon: CheckSquare,
    color: 'bg-indigo-500',
    hover: 'hover:bg-indigo-500',
    columns: [
      { key: 'title', label: 'Task', width: 280 },
      { key: 'date', label: 'Due', width: 130 },
      { key: 'priority', label: 'Priority', width: 110 },
      { key: 'project', label: 'Project', width: 140 }
    ]
  },
  {
    id: 'hobbies',
    name: 'Hobbies',
    icon: Palette,
    color: 'bg-pink-500',
    hover: 'hover:bg-pink-500',
    columns: [
      { key: 'title', label: 'Hobby', width: 240 },
      { key: 'date', label: 'Next session', width: 130 },
      { key: 'category', label: 'Category', width: 140 },
      { key: 'duration', label: 'Duration', width: 110 }
    ]
  },
  {
    id: 'workout',
    name: 'Workout',
    icon: Dumbbell,
    color: 'bg-orange-500',
    hover: 'hover:bg-orange-500',
    columns: [
      { key: 'title', label: 'Session', width: 240 },
      { key: 'date', label: 'Date', width: 130 },
      { key: 'sets', label: 'Sets', width: 90 },
      { key: 'duration', label: 'Duration', width: 110 }
    ]
  },
  {
    id: 'metrics',
    name: 'Body metrics',
    icon: Ruler,
    color: 'bg-emerald-500',
    hover: 'hover:bg-emerald-500',
    columns: [
      { key: 'title', label: 'Metric', width: 220 },
      { key: 'date', label: 'Date', width: 130 },
      { key: 'value', label: 'Value', width: 120 },
      { key: 'change', label: 'Change', width: 110 }
    ]
  },
  {
    id: 'food',
    name: 'Food',
    icon: Apple,
    color: 'bg-lime-600',
    hover: 'hover:bg-lime-600',
    columns: [
      { key: 'title', label: 'Food', width: 240 },
      { key: 'date', label: 'Date', width: 130 },
      { key: 'meal', label: 'Meal', width: 110 },
      { key: 'kcal', label: 'Calories', width: 110 }
    ]
  }
]

export const coreFeatures = ['tasks', 'hobbies']
