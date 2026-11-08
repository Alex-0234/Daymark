import { useState } from 'react'
import { day, sampleLists, type List } from '../data'
import { ListContext } from './useList'

export function ListProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [lists, setLists] = useState(sampleLists)

  const update = (listId: string, change: (list: List) => List): void =>
    setLists((prev) => prev.map((l) => (l.id === listId ? change(l) : l)))

  const addItem = (listId: string): void =>
    update(listId, (l) => ({
      ...l,
      items: [
        ...l.items,
        { id: crypto.randomUUID(), title: 'Untitled', date: day(0), done: false, values: {} }
      ]
    }))

  const toggleItem = (listId: string, itemId: string): void =>
    update(listId, (l) => ({
      ...l,
      items: l.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i))
    }))

  const removeItem = (listId: string, itemId: string): void =>
    update(listId, (l) => ({ ...l, items: l.items.filter((i) => i.id !== itemId) }))

  const resizeColumn = (listId: string, key: string, width: number): void =>
    update(listId, (l) => ({
      ...l,
      columns: l.columns.map((c) =>
        c.key === key ? { ...c, width: Math.min(c.max, Math.max(c.min, width)) } : c
      )
    }))

  return (
    <ListContext.Provider value={{ lists, addItem, toggleItem, removeItem, resizeColumn }}>
      {children}
    </ListContext.Provider>
  )
}
