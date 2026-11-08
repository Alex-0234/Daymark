import { createContext, useContext } from 'react'
import type { List } from '../data'

type ListContextValue = {
  lists: List[]
  addItem: (listId: string) => void
  toggleItem: (listId: string, itemId: string) => void
  removeItem: (listId: string, itemId: string) => void
  resizeColumn: (listId: string, key: string, width: number) => void
}

export const ListContext = createContext<ListContextValue | null>(null)

export function useList(): ListContextValue {
  const context = useContext(ListContext)
  if (!context) throw new Error('useList must be used inside ListProvider')
  return context
}
