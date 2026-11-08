import { Trophy } from 'lucide-react'
import { useCali } from './useCali'
import { calculateLevel, setXp, workoutXp } from '../../utils/level'
import { Bar, Button, Label, Modal, TierBadge } from './ui'
import { formatDuration, formatSet, totalReps, totalSets, type Workout } from './utils'

function Summary({
  workout,
  onClose
}: {
  workout: Workout
  onClose: () => void
}): React.JSX.Element {
  const { byId, workouts } = useCali()
  const xp = Math.round(workoutXp(workout, byId))
  const level = calculateLevel(workouts, byId)
  const before = calculateLevel(
    workouts.filter((w) => w.id !== workout.id),
    byId
  )

  return (
    <Modal
      title="Workout complete"
      onClose={onClose}
      footer={
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-5 p-5">
        <div className="flex flex-col items-center gap-2 py-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line-strong bg-bg">
            <Trophy size={24} className="text-amber-300 drop-shadow-[0_0_8px_#fbbf24]" />
          </div>
          <p className="glow font-mono text-3xl font-bold text-fg tabular-nums">+{xp} XP</p>
          <p className="text-sm text-muted">{workout.name}</p>
          {level.level > before.level && (
            <p className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-fg">
              Level up · {level.level}
            </p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-muted">Level {level.level}</span>
            <span className="text-subtle tabular-nums">
              {Math.round(level.xp)} / {Math.round(level.needed)}
            </span>
          </div>
          <Bar value={level.progress} max={1} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            ['Duration', formatDuration(workout.duration)],
            ['Sets', totalSets(workout)],
            ['Reps', totalReps(workout, byId)]
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-raised px-3 py-2 shadow-panel">
              <Label>{label}</Label>
              <p className="mt-0.5 font-mono font-semibold text-fg tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        <ul className="divide-y divide-line">
          {workout.exercises.map((e) => {
            const exercise = byId[e.exerciseId]
            return (
              <li key={e.exerciseId} className="flex items-center gap-3 py-2.5">
                <TierBadge tier={exercise?.tier ?? 0} />
                <span className="min-w-0 flex-1 truncate text-sm text-fg">{exercise?.name}</span>
                <span className="text-xs text-muted tabular-nums">
                  {e.sets.map((s) => formatSet(s, exercise)).join(' · ')}
                </span>
                {exercise && (
                  <span className="w-12 text-right font-mono text-xs text-subtle tabular-nums">
                    +{Math.round(e.sets.reduce((sum, s) => sum + setXp(exercise, s), 0))}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </Modal>
  )
}

export default Summary
