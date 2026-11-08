import { useState } from 'react'
import { Check, MoreVertical, Pencil, Plus, Repeat, Trash2, Undo2 } from 'lucide-react'
import {
  formatDate,
  formatRepeat,
  week,
  type Column,
  type Item,
  type ItemPatch,
  type List
} from '../data'
import { useList } from '../context/useList'

type Props = {
  list: List
}

function Rows({ list }: Props): React.JSX.Element {
  const { addItem, updateItem, completeItem, removeItem, resizeColumn, saveColumns } = useList()
  const [menu, setMenu] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ id: string; key: string } | null>(null)
  const sorted = [...list.items].sort((a, b) => a.date.localeCompare(b.date))

  const startResize = (column: Column, e: React.MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const start = column.width
    document.body.classList.add('cursor-col-resize')
    const move = (ev: MouseEvent): void =>
      resizeColumn(list.id, column.key, start + ev.clientX - startX)
    const up = (): void => {
      document.body.classList.remove('cursor-col-resize')
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      saveColumns(list.id)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  const handle = (column: Column): React.JSX.Element => (
    <span
      onMouseDown={(e) => startResize(column, e)}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize border-r border-line transition-colors hover:border-muted hover:bg-fg/10"
    />
  )

  const raw = (item: Item, key: string): string => {
    if (key === 'title') return item.title
    if (key === 'date') return item.date
    return item.values[key] ?? ''
  }

  const display = (item: Item, column: Column): React.ReactNode => {
    if (column.key === 'date') return formatDate(item.date)
    if (column.type === 'repeat')
      return item.repeat.length > 0 ? (
        <span className="flex items-center gap-1.5 text-fg">
          <Repeat size={13} className="shrink-0 text-muted" />
          <span className="truncate">{formatRepeat(item.repeat)}</span>
        </span>
      ) : (
        <span className="text-subtle">—</span>
      )
    return raw(item, column.key)
  }

  const toggleDay = (item: Item, value: number): void =>
    updateItem(list.id, item.id, {
      repeat: item.repeat.includes(value)
        ? item.repeat.filter((d) => d !== value)
        : [...item.repeat, value]
    })

  const commit = (item: Item, column: Column, value: string): void => {
    setEditing(null)
    if (value === raw(item, column.key)) return
    const patch: ItemPatch =
      column.key === 'title'
        ? { title: value.trim() || 'Untitled' }
        : column.key === 'date'
          ? { date: value || item.date }
          : { values: { ...item.values, [column.key]: value } }
    updateItem(list.id, item.id, patch)
  }

  const input =
    'h-8 w-full rounded-md border border-line-strong bg-bg px-1.5 text-sm text-fg outline-none select-text focus:border-muted'

  const editor = (item: Item, column: Column): React.JSX.Element =>
    column.type === 'repeat' ? (
      <div
        tabIndex={-1}
        ref={(el) => el?.focus()}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setEditing(null)
        }}
        className="flex h-8 w-full gap-0.5 rounded-md border border-line-strong bg-bg p-0.5 outline-none"
      >
        {week.map((w) => (
          <button
            key={w.day}
            title={w.name}
            onClick={() => toggleDay(item, w.day)}
            className={`flex-1 rounded text-[11px] font-medium transition-colors ${
              item.repeat.includes(w.day)
                ? 'bg-accent text-accent-fg'
                : 'text-subtle hover:bg-raised hover:text-fg'
            }`}
          >
            {w.short}
          </button>
        ))}
      </div>
    ) : column.type === 'select' ? (
      <select
        autoFocus
        defaultValue={raw(item, column.key)}
        onChange={(e) => commit(item, column, e.target.value)}
        onBlur={() => setEditing(null)}
        className={input}
      >
        {['', ...(column.options ?? [])].map((o) => (
          <option key={o} value={o}>
            {o || '—'}
          </option>
        ))}
      </select>
    ) : (
      <input
        autoFocus
        type={column.type === 'date' ? 'date' : 'text'}
        defaultValue={raw(item, column.key)}
        onFocus={(e) => e.target.select()}
        onBlur={(e) => commit(item, column, e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            e.currentTarget.value = raw(item, column.key)
            e.currentTarget.blur()
          }
        }}
        className={input}
      />
    )

  const create = async (): Promise<void> => {
    const item = await addItem(list.id)
    setEditing({ id: item.id, key: 'title' })
  }

  return (
    <section className="overflow-x-auto rounded-xl bg-panel shadow-panel">
      <div className="min-w-fit">
        <div className="flex border-b border-line-strong text-[11px] font-medium tracking-wider text-subtle uppercase">
          <div className="w-11 shrink-0" />
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
            className={`relative flex items-stretch border-b border-line transition-colors hover:bg-raised ${item.done ? 'opacity-50' : ''}`}
          >
            <button
              onClick={() => completeItem(list.id, item.id)}
              title={item.repeat.length > 0 ? 'Done, move to next repeat' : 'Done'}
              className="group/check flex w-11 shrink-0 items-center justify-center"
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                  item.done
                    ? 'border-accent bg-accent text-accent-fg'
                    : 'border-line-strong group-hover/check:border-muted'
                }`}
              >
                {item.done && <Check size={12} strokeWidth={3} />}
              </span>
            </button>
            {list.columns.map((c) => {
              const isEditing = editing?.id === item.id && editing.key === c.key
              return (
                <div
                  key={c.key}
                  style={{ width: c.width }}
                  onClick={() => setEditing({ id: item.id, key: c.key })}
                  className={`relative shrink-0 cursor-text truncate text-sm ${
                    isEditing ? 'px-1.5 py-1.5' : 'px-3 py-3'
                  } ${c.key === 'title' ? 'font-medium text-fg' : 'text-muted tabular-nums'} ${
                    c.key === 'title' && item.done ? 'line-through' : ''
                  }`}
                >
                  {isEditing ? editor(item, c) : display(item, c)}
                  {handle(c)}
                </div>
              )
            })}
            <div className="flex-1" />

            {menu === item.id && (
              <div className="absolute top-1/2 right-12 z-10 flex -translate-y-1/2 gap-1 rounded-lg bg-panel p-1 shadow-pop">
                <button
                  onClick={() => {
                    setEditing({ id: item.id, key: 'title' })
                    setMenu(null)
                  }}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted hover:bg-raised hover:text-fg"
                >
                  <Pencil size={14} />
                  Edit
                </button>
                <button
                  onClick={() => {
                    completeItem(list.id, item.id)
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

        <button
          onClick={create}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-subtle transition-colors hover:bg-raised hover:text-fg"
        >
          <Plus size={14} />
          New
        </button>
      </div>
    </section>
  )
}

export default Rows
