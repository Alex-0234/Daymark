import { useState } from 'react'
import { Check, Search } from 'lucide-react'
import { useCali } from './useCali'
import { Button, Modal, TierBadge } from './ui'
import { CATEGORIES } from './utils'

type Props = {
  onPick: (ids: string[]) => void
  onClose: () => void
  added?: string[]
}

function ExercisePicker({ onPick, onClose, added = [] }: Props): React.JSX.Element {
  const { exercises } = useCali()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [selected, setSelected] = useState<string[]>([])

  const matches = exercises.filter(
    (e) =>
      (category === 'all' || e.category === category) &&
      e.name.toLowerCase().includes(query.trim().toLowerCase())
  )

  const toggle = (id: string): void =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const chip = (id: string, name: string): React.JSX.Element => (
    <button
      key={id}
      onClick={() => setCategory(id)}
      className={`shrink-0 rounded-full px-3 py-1 text-xs transition-colors ${
        category === id ? 'bg-accent text-accent-fg' : 'bg-raised text-muted hover:text-fg'
      }`}
    >
      {name}
    </button>
  )

  return (
    <Modal
      title="Add exercises"
      onClose={onClose}
      className="h-[80vh] w-[36rem]"
      footer={
        <>
          <span className="mr-auto text-xs text-subtle">{selected.length} selected</span>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={selected.length === 0}
            onClick={() => {
              onPick(selected)
              onClose()
            }}
          >
            Add {selected.length > 0 ? selected.length : ''}
          </Button>
        </>
      }
    >
      <div className="sticky top-0 z-10 space-y-3 border-b border-line bg-panel px-5 py-3">
        <label className="flex items-center gap-2 rounded-lg border border-line-strong bg-bg px-3 focus-within:border-muted">
          <Search size={14} className="text-subtle" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises"
            className="h-9 flex-1 bg-transparent text-sm text-fg outline-none select-text placeholder:text-subtle"
          />
        </label>
        <div className="flex gap-1.5 overflow-x-auto">
          {chip('all', 'All')}
          {CATEGORIES.map((c) => chip(c.id, c.name))}
        </div>
      </div>

      <div className="px-2 py-2">
        {CATEGORIES.map((c) => {
          const list = matches.filter((e) => e.category === c.id)
          if (list.length === 0) return null
          return (
            <div key={c.id} className="mb-2">
              <p className="px-3 py-2 text-[11px] font-medium tracking-wider text-subtle uppercase">
                {c.name}
              </p>
              {list.map((e) => {
                const isSelected = selected.includes(e.id)
                return (
                  <button
                    key={e.id}
                    onClick={() => toggle(e.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                      isSelected ? 'bg-raised' : 'hover:bg-raised/60'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        isSelected ? 'border-accent bg-accent text-accent-fg' : 'border-line-strong'
                      }`}
                    >
                      {isSelected && <Check size={11} strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-fg">{e.name}</span>
                      <span className="block text-xs text-subtle capitalize">
                        {e.branch} · {e.unit}
                        {added.includes(e.id) && ' · in list'}
                      </span>
                    </span>
                    <TierBadge tier={e.tier} />
                  </button>
                )
              })}
            </div>
          )
        })}
        {matches.length === 0 && (
          <p className="py-12 text-center text-sm text-subtle">No exercises match.</p>
        )}
      </div>
    </Modal>
  )
}

export default ExercisePicker
