import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react'
import { useCali } from './useCali'
import { Button, Label, Modal, TierBadge } from './ui'
import ExercisePicker from './ExercisePicker'
import { categoryName, uid, type Routine } from './utils'

type Props = {
  routine?: Routine
  onClose: () => void
}

function RoutineEditor({ routine, onClose }: Props): React.JSX.Element {
  const { byId, saveRoutine } = useCali()
  const [name, setName] = useState(routine?.name ?? '')
  const [description, setDescription] = useState(routine?.description ?? '')
  const [ids, setIds] = useState<string[]>(routine?.exercises ?? [])
  const [picking, setPicking] = useState(false)
  const [error, setError] = useState('')

  const move = (index: number, direction: -1 | 1): void =>
    setIds((prev) => {
      const list = [...prev]
      ;[list[index], list[index + direction]] = [list[index + direction], list[index]]
      return list
    })

  const save = (): void => {
    if (!name.trim()) return setError('Give the routine a name.')
    if (ids.length === 0) return setError('Add at least one exercise.')
    saveRoutine({ id: routine?.id ?? uid(), name: name.trim(), description, exercises: ids })
    onClose()
  }

  const field =
    'h-9 w-full rounded-lg border border-line-strong bg-bg px-3 text-sm text-fg outline-none select-text placeholder:text-subtle focus:border-muted'

  return (
    <>
      <Modal
        title={routine ? 'Edit routine' : 'New routine'}
        onClose={onClose}
        footer={
          <>
            {error && <span className="mr-auto text-xs text-danger">{error}</span>}
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={save}>
              {routine ? 'Save' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <Label>Name</Label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Upper body"
                className={field}
              />
            </label>
            <label className="space-y-1.5">
              <Label>Description</Label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Push · pull"
                className={field}
              />
            </label>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Exercises · {ids.length}</Label>
              <Button variant="outline" onClick={() => setPicking(true)}>
                <Plus size={13} />
                Add
              </Button>
            </div>
            <ul className="overflow-hidden rounded-lg border border-line">
              {ids.map((id, i) => {
                const exercise = byId[id]
                return (
                  <li
                    key={`${id}-${i}`}
                    className="flex items-center gap-3 border-b border-line px-3 py-2 last:border-0"
                  >
                    <span className="w-4 text-xs text-subtle tabular-nums">{i + 1}</span>
                    <TierBadge tier={exercise?.tier ?? 0} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-fg">{exercise?.name ?? id}</span>
                      <span className="block text-xs text-subtle">
                        {categoryName(exercise?.category ?? '')}
                      </span>
                    </span>
                    <Button className="px-1.5" disabled={i === 0} onClick={() => move(i, -1)}>
                      <ChevronUp size={14} />
                    </Button>
                    <Button
                      className="px-1.5"
                      disabled={i === ids.length - 1}
                      onClick={() => move(i, 1)}
                    >
                      <ChevronDown size={14} />
                    </Button>
                    <Button
                      className="px-1.5"
                      variant="danger"
                      onClick={() => setIds((prev) => prev.filter((_, j) => j !== i))}
                    >
                      <X size={14} />
                    </Button>
                  </li>
                )
              })}
              {ids.length === 0 && (
                <li className="px-3 py-8 text-center text-sm text-subtle">
                  No exercises yet. Add some from the library.
                </li>
              )}
            </ul>
          </div>
        </div>
      </Modal>

      {picking && (
        <ExercisePicker
          added={ids}
          onPick={(picked) => setIds((prev) => [...prev, ...picked])}
          onClose={() => setPicking(false)}
        />
      )}
    </>
  )
}

export default RoutineEditor
