import type { CaliApi } from './cali'

export type ColumnType = 'text' | 'date' | 'select' | 'repeat'

export type Column = {
  key: string
  label: string
  width: number
  min: number
  max: number
  type?: ColumnType
  options?: string[]
}

export type Item = {
  id: string
  listId: string
  title: string
  date: string
  done: boolean
  repeat: number[]
  values: Record<string, string>
}

export type List = {
  id: string
  feature: string
  name: string
  columns: Column[]
  items: Item[]
}

export type ListTemplate = Omit<List, 'items'>

export type ItemPatch = Partial<Pick<Item, 'title' | 'date' | 'done' | 'repeat' | 'values'>>

export type Api = {
  modules: {
    enabled: () => Promise<string[]>
    enable: (id: string) => Promise<void>
  }
  cali: CaliApi
  lists: {
    all: () => Promise<List[]>
    setColumns: (listId: string, columns: Column[]) => Promise<void>
  }
  items: {
    create: (listId: string) => Promise<Item>
    update: (id: string, patch: ItemPatch) => Promise<Item>
    remove: (id: string) => Promise<void>
  }
}
