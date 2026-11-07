import { useState } from 'react'
import { Check, MoreVertical, Trash2, Undo2 } from 'lucide-react'
import type { Feature } from '../features'
import { formatDate, type Item } from '../data'

type Props = {
  feature: Feature
  items: Item[]
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

function Rows({ feature, items, onToggle, onRemove }: Props): React.JSX.Element {
  const [widths, setWidths] = useState(feature.columns.map((c) => c.width))
  const [menu, setMenu] = useState<string | null>(null)
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date))

  const resize = (index: number, e: React.MouseEvent): void => {
    const startX = e.clientX
    const start = widths[index]
    const move = (ev: MouseEvent): void =>
      setWidths((w) =>
        w.map((x, i) => (i === index ? Math.max(60, start + ev.clientX - startX) : x))
      )
    const up = (): void => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  const cell = (item: Item, key: string): string => {
    if (key === 'title') return item.title
    if (key === 'date') return formatDate(item.date)
    return item.values[key] ?? ''
  }

  return (
    <section className="overflow-x-auto rounded-lg bg-[#2b2d31]">
      <div className="min-w-fit">
        <div className="flex border-b border-black/20 text-xs font-semibold text-zinc-400 uppercase">
          {feature.columns.map((c, i) => (
            <div key={c.key} style={{ width: widths[i] }} className="relative shrink-0 px-3 py-2">
              {c.label}
              <span
                onMouseDown={(e) => resize(i, e)}
                className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-indigo-500"
              />
            </div>
          ))}
          <div className="flex-1" />
          <div className="w-11 shrink-0" />
        </div>

        {sorted.map((item) => (
          <div
            key={item.id}
            className={`relative flex items-stretch border-b border-black/10 last:border-0 hover:bg-white/5 ${item.done ? 'opacity-50' : ''}`}
          >
            {feature.columns.map((c, i) => (
              <div
                key={c.key}
                style={{ width: widths[i] }}
                className={`shrink-0 truncate px-3 py-3 text-sm ${
                  c.key === 'title' ? 'font-medium text-white' : 'text-zinc-300'
                } ${c.key === 'title' && item.done ? 'line-through' : ''}`}
              >
                {cell(item, c.key)}
              </div>
            ))}
            <div className="flex-1" />

            {menu === item.id && (
              <div className="absolute top-1/2 right-12 z-10 flex -translate-y-1/2 gap-1 rounded-md bg-[#111214] p-1 shadow-xl">
                <button
                  onClick={() => {
                    onToggle(item.id)
                    setMenu(null)
                  }}
                  className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-zinc-200 hover:bg-indigo-500"
                >
                  {item.done ? <Undo2 size={14} /> : <Check size={14} />}
                  {item.done ? 'Undo' : 'Done'}
                </button>
                <button
                  onClick={() => {
                    onRemove(item.id)
                    setMenu(null)
                  }}
                  className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500 hover:text-white"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}

            <button
              onClick={() => setMenu(menu === item.id ? null : item.id)}
              className="flex w-11 shrink-0 items-center justify-center border-l border-black/20 text-zinc-400 hover:bg-white/10 hover:text-white"
            >
              <MoreVertical size={18} />
            </button>
          </div>
        ))}

        {sorted.length === 0 && (
          <p className="px-3 py-6 text-sm text-zinc-500">Nothing here yet.</p>
        )}
      </div>
    </section>
  )
}

export default Rows
