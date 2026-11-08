import { useEffect, useState } from 'react'
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Dumbbell,
  Plus,
  Timer,
  Trash2,
  X
} from 'lucide-react'
import { useCali } from './useCali'
import { workoutXp } from './stats'
import { Button, Elapsed, Label, TierBadge } from './ui'
import ExercisePicker from './ExercisePicker'
import {
  REST_SECONDS,
  categoryName,
  draftToWorkout,
  formatClock,
  formatValue,
  totalReps,
  totalSets,
  unitLabel,
  type SessionExercise,
  type Workout
} from './utils'

type Props = {
  onBack: () => void
  onFinish: (workout: Workout) => void
}

function RestTimer({
  end,
  onChange
}: {
  end: number
  onChange: (end: number | null) => void
}): React.JSX.Element {
  const [now, setNow] = useState(() => Date.now())
  const left = Math.max(0, Math.ceil((end - now) / 1000))

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (left === 0) onChange(null)
  }, [left, onChange])

  return (
    <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-panel px-4 py-3 shadow-pop">
      <Timer size={16} className="text-muted" />
      <div className="w-40">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-subtle">Rest</span>
          <span className="glow font-mono text-lg font-semibold text-fg tabular-nums">
            {formatClock(left)}
          </span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300"
            style={{ width: `${(left / REST_SECONDS) * 100}%` }}
          />
        </div>
      </div>
      <Button variant="outline" onClick={() => onChange(end - 15_000)}>
        −15
      </Button>
      <Button variant="outline" onClick={() => onChange(end + 15_000)}>
        +15
      </Button>
      <Button onClick={() => onChange(null)}>Skip</Button>
    </div>
  )
}

function ExerciseBlock({
  entry,
  first,
  last,
  onRest
}: {
  entry: SessionExercise
  first: boolean
  last: boolean
  onRest: () => void
}): React.JSX.Element {
  const { byId, previous, removeExercise, moveExercise, addSet, removeSet, updateSet } = useCali()
  const exercise = byId[entry.exerciseId]
  const prev = previous(entry.exerciseId)
  const doneCount = entry.sets.filter((s) => s.done).length

  const check = (setId: string, value: number | null, done: boolean, fallback?: number): void => {
    if (done) return updateSet(entry.id, setId, { done: false })
    const final = value ?? fallback ?? null
    if (!final) return
    updateSet(entry.id, setId, { value: final, done: true })
    onRest()
  }

  return (
    <section className="rounded-xl bg-panel shadow-panel">
      <header className="flex items-center gap-3 px-4 pt-4 pb-3">
        <TierBadge tier={exercise?.tier ?? 0} />
        <div className="min-w-0 flex-1">
          <h3 className="glow truncate text-sm font-semibold text-fg">
            {exercise?.name ?? 'Unknown exercise'}
          </h3>
          <p className="text-xs text-subtle capitalize">
            {categoryName(exercise?.category ?? '')} · {exercise?.branch}
          </p>
        </div>
        <span className="text-xs text-subtle tabular-nums">
          {doneCount}/{entry.sets.length}
        </span>
        <div className="flex">
          <Button
            title="Move up"
            disabled={first}
            onClick={() => moveExercise(entry.id, -1)}
            className="px-1.5"
          >
            <ChevronUp size={15} />
          </Button>
          <Button
            title="Move down"
            disabled={last}
            onClick={() => moveExercise(entry.id, 1)}
            className="px-1.5"
          >
            <ChevronDown size={15} />
          </Button>
          <Button
            title="Remove exercise"
            variant="danger"
            onClick={() => removeExercise(entry.id)}
            className="px-1.5"
          >
            <Trash2 size={15} />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-[3rem_1fr_1fr_3rem] px-2 text-[11px] font-medium tracking-wider text-subtle uppercase">
        <span className="py-1.5 text-center">Set</span>
        <span className="py-1.5 pl-2">Previous</span>
        <span className="py-1.5 pl-2">{unitLabel(exercise)}</span>
        <span className="py-1.5 text-center">
          <Check size={12} className="inline" />
        </span>
      </div>

      <div className="px-2">
        {entry.sets.map((s, i) => (
          <div
            key={s.id}
            className={`group grid grid-cols-[3rem_1fr_1fr_3rem] items-center rounded-lg transition-colors ${
              s.done ? 'bg-fg/[0.05]' : ''
            }`}
          >
            <div className="relative flex h-10 items-center justify-center">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold tabular-nums group-hover:opacity-0 ${
                  s.done ? 'text-fg' : 'text-muted'
                }`}
              >
                {i + 1}
              </span>
              <button
                title="Remove set"
                onClick={() => removeSet(entry.id, s.id)}
                className="absolute inset-0 m-auto flex h-6 w-6 items-center justify-center rounded-md text-danger opacity-0 transition-opacity group-hover:opacity-100 hover:bg-danger/10"
              >
                <X size={13} />
              </button>
            </div>
            <span className="pl-2 text-sm text-subtle tabular-nums">
              {prev[i] !== undefined ? formatValue(prev[i], exercise) : '—'}
            </span>
            <div className="px-1">
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={s.value ?? ''}
                placeholder={prev[i] !== undefined ? String(prev[i]) : '0'}
                onChange={(e) =>
                  updateSet(entry.id, s.id, {
                    value: e.target.value === '' ? null : Math.max(0, Number(e.target.value))
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') check(s.id, s.value, s.done, prev[i])
                }}
                className={`h-8 w-full rounded-md border bg-bg px-2 text-sm font-medium tabular-nums outline-none select-text placeholder:text-subtle [appearance:textfield] focus:border-muted [&::-webkit-inner-spin-button]:appearance-none ${
                  s.done ? 'border-transparent text-fg' : 'border-line-strong text-fg'
                }`}
              />
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => check(s.id, s.value, s.done, prev[i])}
                className={`flex h-7 w-7 items-center justify-center rounded-md border transition-all ${
                  s.done
                    ? 'border-accent bg-accent text-accent-fg shadow-[0_0_12px_-2px_var(--accent)]'
                    : 'border-line-strong text-subtle hover:border-muted hover:text-fg'
                }`}
              >
                <Check size={14} strokeWidth={3} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => addSet(entry.id)}
        className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-b-xl border-t border-line py-2.5 text-xs text-subtle transition-colors hover:bg-raised hover:text-fg"
      >
        <Plus size={13} />
        Add set
      </button>
    </section>
  )
}

function Session({ onBack, onFinish }: Props): React.JSX.Element | null {
  const { draft, byId, renameWorkout, addExercises, finishWorkout, discardWorkout } = useCali()
  const [picking, setPicking] = useState(false)
  const [rest, setRest] = useState<number | null>(null)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  if (!draft) return null

  const live = draftToWorkout(draft, draft.startedAt)
  const sets = totalSets(live)
  const xp = workoutXp(live, byId)

  const finish = (): void => {
    const workout = finishWorkout()
    if (workout) onFinish(workout)
  }

  const metric = (label: string, value: React.ReactNode, glow = false): React.JSX.Element => (
    <div className="rounded-lg bg-raised px-3 py-2 shadow-panel">
      <Label>{label}</Label>
      <p
        className={`mt-0.5 font-mono text-base font-semibold text-fg tabular-nums ${glow ? 'glow' : ''}`}
      >
        {value}
      </p>
    </div>
  )

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-line px-5 py-3">
        <Button onClick={onBack} className="px-1.5" title="Back">
          <ChevronLeft size={16} />
        </Button>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <input
          value={draft.name}
          onChange={(e) => renameWorkout(e.target.value)}
          className="glow min-w-0 flex-1 bg-transparent text-sm font-semibold text-fg outline-none select-text"
        />
        {confirmDiscard ? (
          <>
            <span className="text-xs text-muted">Discard this workout?</span>
            <Button onClick={() => setConfirmDiscard(false)}>Keep</Button>
            <Button variant="danger" onClick={discardWorkout}>
              Discard
            </Button>
          </>
        ) : (
          <Button variant="danger" onClick={() => setConfirmDiscard(true)}>
            Discard
          </Button>
        )}
        <Button variant="primary" disabled={sets === 0} onClick={finish}>
          Finish
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-4 p-5 pb-32">
          <div className="grid grid-cols-4 gap-2">
            {metric('Duration', <Elapsed since={draft.startedAt} />, true)}
            {metric('Sets', sets)}
            {metric('Reps', totalReps(live, byId))}
            {metric('XP', `+${xp}`, true)}
          </div>

          {draft.exercises.map((entry, i) => (
            <ExerciseBlock
              key={entry.id}
              entry={entry}
              first={i === 0}
              last={i === draft.exercises.length - 1}
              onRest={() => setRest(Date.now() + REST_SECONDS * 1000)}
            />
          ))}

          {draft.exercises.length === 0 ? (
            <button
              onClick={() => setPicking(true)}
              className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-line-strong py-14 text-subtle transition-colors hover:border-muted hover:text-fg"
            >
              <Dumbbell size={22} />
              <span className="text-sm">Add your first exercise</span>
            </button>
          ) : (
            <button
              onClick={() => setPicking(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong py-3 text-sm text-subtle transition-colors hover:border-muted hover:text-fg"
            >
              <Plus size={15} />
              Add exercise
            </button>
          )}
        </div>
      </div>

      {rest && (
        <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center">
          <RestTimer end={rest} onChange={setRest} />
        </div>
      )}

      {picking && (
        <ExercisePicker
          added={draft.exercises.map((e) => e.exerciseId)}
          onPick={addExercises}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  )
}

export default Session
