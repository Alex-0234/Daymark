import { useState } from 'react'
import { Pencil, Play, Plus, Trash2, Zap } from 'lucide-react'
import { useCali } from './useCali'
import { Button, Card, Elapsed, Label, TierBadge } from './ui'
import RoutineEditor from './RoutineEditor'
import type { Routine } from './utils'

type Props = {
  onStart: (routine?: Routine) => void
  onResume: () => void
}

function Train({ onStart, onResume }: Props): React.JSX.Element {
  const { routines, byId, draft, removeRoutine } = useCali()
  const [editing, setEditing] = useState<Routine | 'new' | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {draft ? (
        <Card className="flex items-center gap-4 p-4">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-fg">{draft.name} in progress</p>
            <p className="font-mono text-xs text-muted tabular-nums">
              <Elapsed since={draft.startedAt} /> · {draft.exercises.length} exercises
            </p>
          </div>
          <Button variant="primary" onClick={onResume}>
            Resume
          </Button>
        </Card>
      ) : (
        <Card className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-line-strong bg-bg">
            <Zap size={18} className="text-amber-300 drop-shadow-[0_0_6px_#fbbf24]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-fg">Quick start</p>
            <p className="text-xs text-muted">Start empty and add exercises as you go.</p>
          </div>
          <Button variant="primary" onClick={() => onStart()}>
            <Play size={13} />
            Start empty workout
          </Button>
        </Card>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <Label>Routines · {routines.length}</Label>
          <Button variant="outline" onClick={() => setEditing('new')}>
            <Plus size={13} />
            New routine
          </Button>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
          {routines.map((r) => (
            <Card key={r.id} className="flex flex-col p-4">
              <div className="mb-3 flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="glow truncate text-sm font-semibold text-fg">{r.name}</p>
                  <p className="truncate text-xs text-subtle">
                    {r.description || `${r.exercises.length} exercises`}
                  </p>
                </div>
                <Button className="px-1.5" title="Edit" onClick={() => setEditing(r)}>
                  <Pencil size={13} />
                </Button>
                {deleting === r.id ? (
                  <Button variant="danger" onClick={() => removeRoutine(r.id)}>
                    Delete?
                  </Button>
                ) : (
                  <Button className="px-1.5" title="Delete" onClick={() => setDeleting(r.id)}>
                    <Trash2 size={13} />
                  </Button>
                )}
              </div>
              <ul className="mb-4 flex-1 space-y-1.5">
                {r.exercises.slice(0, 5).map((id, i) => (
                  <li key={`${id}-${i}`} className="flex items-center gap-2 text-xs text-muted">
                    <TierBadge tier={byId[id]?.tier ?? 0} />
                    <span className="truncate">{byId[id]?.name ?? id}</span>
                  </li>
                ))}
                {r.exercises.length > 5 && (
                  <li className="pl-9 text-xs text-subtle">+{r.exercises.length - 5} more</li>
                )}
              </ul>
              <Button
                variant="outline"
                disabled={draft !== null}
                onClick={() => onStart(r)}
                className="w-full"
              >
                <Play size={13} />
                Start
              </Button>
            </Card>
          ))}
          {routines.length === 0 && (
            <button
              onClick={() => setEditing('new')}
              className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong text-subtle transition-colors hover:border-muted hover:text-fg"
            >
              <Plus size={18} />
              <span className="text-sm">Build your first routine</span>
            </button>
          )}
        </div>
      </div>

      {editing && (
        <RoutineEditor
          routine={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

export default Train
