import type { Column, ListTemplate } from '../shared/types'

const col = (key: string, label: string, width: number, extra: Partial<Column> = {}): Column => ({
  key,
  label,
  width,
  min: 80,
  max: 480,
  type: 'text',
  ...extra
})

const title = (label: string): Column => col('title', label, 280, { min: 160, max: 600 })
const date = (label: string): Column =>
  col('date', label, 140, { min: 110, max: 200, type: 'date' })
export const repeatColumn = col('repeat', 'Repeat', 190, { min: 180, max: 280, type: 'repeat' })

export const templates: ListTemplate[] = [
  {
    id: 'list-tasks',
    feature: 'tasks',
    name: 'Tasks',
    columns: [
      title('Task'),
      date('Due'),
      repeatColumn,
      col('priority', 'Priority', 120, { type: 'select', options: ['Low', 'Medium', 'High'] }),
      col('project', 'Project', 160)
    ]
  },
  {
    id: 'list-hobbies',
    feature: 'hobbies',
    name: 'Hobbies',
    columns: [
      title('Hobby'),
      date('Next session'),
      repeatColumn,
      col('category', 'Category', 150),
      col('duration', 'Duration', 120)
    ]
  }
]
