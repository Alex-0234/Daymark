import { Apple, CheckSquare, Dumbbell, Palette, Ruler, type LucideIcon } from 'lucide-react'

export type Feature = {
  id: string
  name: string
  icon: LucideIcon
  color: string
  text: string
}

export const features: Feature[] = [
  {
    id: 'tasks',
    name: 'Tasks',
    icon: CheckSquare,
    color: 'bg-indigo-400',
    text: 'text-indigo-400'
  },
  {
    id: 'hobbies',
    name: 'Hobbies',
    icon: Palette,
    color: 'bg-pink-400',
    text: 'text-pink-400'
  },
  {
    id: 'workout',
    name: 'Calisthenics',
    icon: Dumbbell,
    color: 'bg-orange-400',
    text: 'text-orange-400'
  },
  {
    id: 'metrics',
    name: 'Body metrics',
    icon: Ruler,
    color: 'bg-emerald-400',
    text: 'text-emerald-400'
  },
  {
    id: 'food',
    name: 'Food',
    icon: Apple,
    color: 'bg-lime-400',
    text: 'text-lime-400'
  }
]

export const coreFeatures = ['tasks', 'hobbies']
