import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useCali } from './useCali'
import { workoutXp } from './stats'
import { Button, Card, TierBadge } from './ui'
import { formatDay, formatDuration, formatValue, totalReps, totalSets } from './utils'

function History(): React.JSX.Element {
  const { workouts, byId, removeWorkout } = useCali()
  const [deleting, setDeleting] = useState<string | null>(null)

  if (workouts.length === 0)
    return <p className="py-16 text-center text-sm text-subtle">No finished workouts yet.</p>

  return (
    <div className="space-y-3">
      {workouts.map((w) => (
        <Card key={w.id} className="p-4">
          <div className="mb-3 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="glow truncate text-sm font-semibold text-fg">{w.name}</p>
              <p className="text-xs text-subtle">
                {formatDay(w.finishedAt)} · {formatDuration(w.duration)} · {totalSets(w)} sets ·{' '}
                {totalReps(w, byId)} reps
              </p>
            </div>
            <span className="font-mono text-sm font-semibold text-fg">
              +{workoutXp(w, byId)} XP
            </span>
            {deleting === w.id ? (
              <Button variant="danger" onClick={() => removeWorkout(w.id)}>
                Delete?
              </Button>
            ) : (
              <Button className="px-1.5" title="Delete" onClick={() => setDeleting(w.id)}>
                <Trash2 size={13} />
              </Button>
            )}
          </div>
          <ul className="space-y-1.5">
            {w.exercises.map((e, i) => {
              const exercise = byId[e.exerciseId]
              return (
                <li key={`${e.exerciseId}-${i}`} className="flex items-center gap-2.5 text-xs">
                  <TierBadge tier={exercise?.tier ?? 0} />
                  <span className="min-w-0 flex-1 truncate text-muted">{exercise?.name}</span>
                  <span className="text-subtle tabular-nums">
                    {e.sets.map((v) => formatValue(v, exercise)).join(' · ')}
                  </span>
                </li>
              )
            })}
          </ul>
        </Card>
      ))}
    </div>
  )
}

export default History
