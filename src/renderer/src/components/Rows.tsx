import { useState } from 'react'
import { Check, MoreVertical, Trash2, Undo2 } from 'lucide-react'
import { formatDate, type Column, type Item, type List } from '../data'
import { useList } from '../context/useList'

type Props = {
  list: List
}

function Rows({ list }: Props): React.JSX.Element {
  const { toggleItem, removeItem, resizeColumn } = useList()
  const [menu, setMenu] = useState<string | null>(null)
  const sorted = [...list.items].sort((a, b) => a.date.localeCompare(b.date))

  const startResize = (column: Column, e: React.MouseEvent): void => {
    e.preventDefault()
    const startX = e.clientX
    const start = column.width
    document.body.classList.add('cursor-col-resize')
    const move = (ev: MouseEvent): void =>
      resizeColumn(list.id, column.key, start + ev.clientX - startX)
    const up = (): void => {
      document.body.classList.remove('cursor-col-resize')
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  const handle = (column: Column): React.JSX.Element => (
    <span
      onMouseDown={(e) => startResize(column, e)}
      className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize border-r border-line transition-colors hover:border-muted hover:bg-fg/10"
    />
  )

  const cell = (item: Item, key: string): string => {
    if (key === 'title') return item.title
    if (key === 'date') return formatDate(item.date)
    return item.values[key] ?? ''
  }

  return (
    <section className="overflow-x-auto rounded-xl bg-panel shadow-panel">
      <div className="min-w-fit">
        <div className="flex border-b border-line-strong text-[11px] font-medium tracking-wider text-subtle uppercase">
          {list.columns.map((c) => (
            <div
              key={c.key}
              style={{ width: c.width }}
              className="relative shrink-0 truncate px-3 py-2.5"
            >
              {c.label}
              {handle(c)}
            </div>
          ))}
          <div className="flex-1" />
          <div className="w-11 shrink-0" />
        </div>

        {sorted.map((item) => (
          <div
            key={item.id}
            className={`relative flex items-stretch border-b border-line transition-colors last:border-0 hover:bg-raised ${item.done ? 'opacity-50' : ''}`}
          >
            {list.columns.map((c) => (
              <div
                key={c.key}
                style={{ width: c.width }}
                className={`relative shrink-0 truncate px-3 py-3 text-sm ${
                  c.key === 'title' ? 'font-medium text-fg' : 'text-muted tabular-nums'
                } ${c.key === 'title' && item.done ? 'line-through' : ''}`}
              >
                {cell(item, c.key)}
                {handle(c)}
              </div>
            ))}
            <div className="flex-1" />

            {menu === item.id && (
              <div className="absolute top-1/2 right-12 z-10 flex -translate-y-1/2 gap-1 rounded-lg bg-panel p-1 shadow-pop">
                <button
                  onClick={() => {
                    toggleItem(list.id, item.id)
                    setMenu(null)
                  }}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted hover:bg-raised hover:text-fg"
                >
                  {item.done ? <Undo2 size={14} /> : <Check size={14} />}
                  {item.done ? 'Undo' : 'Done'}
                </button>
                <button
                  onClick={() => {
                    removeItem(list.id, item.id)
                    setMenu(null)
                  }}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-danger hover:bg-danger/10"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}

            <button
              onClick={() => setMenu(menu === item.id ? null : item.id)}
              className="flex w-11 shrink-0 items-center justify-center border-l border-line text-subtle transition-colors hover:bg-raised hover:text-fg"
            >
              <MoreVertical size={16} />
            </button>
          </div>
        ))}

        {sorted.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-subtle">Nothing here yet.</p>
        )}
      </div>
    </section>
  )
}

export default Rows
