import { createContext, useContext } from 'react'
import type { Item, ItemPatch, List } from '../data'

type ListContextValue = {
  lists: List[]
  loaded: boolean
  reload: () => Promise<void>
  addItem: (listId: string) => Promise<Item>
  updateItem: (listId: string, itemId: string, patch: ItemPatch) => void
  completeItem: (listId: string, itemId: string) => void
  removeItem: (listId: string, itemId: string) => void
  resizeColumn: (listId: string, key: string, width: number) => void
  saveColumns: (listId: string) => void
}

export const ListContext = createContext<ListContextValue | null>(null)

export function useList(): ListContextValue {
  const context = useContext(ListContext)
  if (!context) throw new Error('useList must be used inside ListProvider')
  return context
}
