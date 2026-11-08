import { useEffect, useRef, useState } from 'react'
import { nextDate, type Item, type ItemPatch, type List } from '../data'
import { ListContext } from './useList'

export function ListProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [lists, setLists] = useState<List[]>([])
  const [loaded, setLoaded] = useState(false)
  const latest = useRef(lists)

  useEffect(() => {
    latest.current = lists
  }, [lists])

  useEffect(() => {
    window.api.lists.all().then((data) => {
      setLists(data)
      setLoaded(true)
    })
  }, [])

  const update = (listId: string, change: (list: List) => List): void =>
    setLists((prev) => prev.map((l) => (l.id === listId ? change(l) : l)))

  const addItem = async (listId: string): Promise<Item> => {
    const item = await window.api.items.create(listId)
    update(listId, (l) => ({ ...l, items: [...l.items, item] }))
    return item
  }

  const updateItem = (listId: string, itemId: string, patch: ItemPatch): void => {
    update(listId, (l) => ({
      ...l,
      items: l.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i))
    }))
    window.api.items.update(itemId, patch)
  }

  const completeItem = (listId: string, itemId: string): void => {
    const item = latest.current.find((l) => l.id === listId)?.items.find((i) => i.id === itemId)
    if (!item) return
    updateItem(
      listId,
      itemId,
      item.repeat.length > 0 && !item.done
        ? { date: nextDate(item.date, item.repeat) }
        : { done: !item.done }
    )
  }

  const removeItem = (listId: string, itemId: string): void => {
    update(listId, (l) => ({ ...l, items: l.items.filter((i) => i.id !== itemId) }))
    window.api.items.remove(itemId)
  }

  const resizeColumn = (listId: string, key: string, width: number): void =>
    update(listId, (l) => ({
      ...l,
      columns: l.columns.map((c) =>
        c.key === key ? { ...c, width: Math.min(c.max, Math.max(c.min, width)) } : c
      )
    }))

  const saveColumns = (listId: string): void => {
    const list = latest.current.find((l) => l.id === listId)
    if (list) window.api.lists.setColumns(listId, list.columns)
  }

  return (
    <ListContext.Provider
      value={{
        lists,
        loaded,
        addItem,
        updateItem,
        completeItem,
        removeItem,
        resizeColumn,
        saveColumns
      }}
    >
      {children}
    </ListContext.Provider>
  )
}
