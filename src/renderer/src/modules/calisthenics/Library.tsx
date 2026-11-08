import { useState } from 'react'
import { useCali } from './useCali'
import { Bar, Card, TierBadge } from './ui'
import { CATEGORIES, formatValue } from './utils'
import { getProficiency } from '../../utils/proficiency'
import { MODIFIERS } from '../../../../shared/cali'

function Library(): React.JSX.Element {
  const { exercises, workouts, progress } = useCali()
  const [category, setCategory] = useState(CATEGORIES[0].id)
  const list = exercises.filter((e) => e.category === category)

  const history = (id: string): { best: number; sessions: number } => {
    const sets = workouts.flatMap((w) => w.exercises.filter((e) => e.exerciseId === id))
    return {
      best: Math.max(0, ...sets.flatMap((e) => e.sets.map((s) => s.value))),
      sessions: sets.length
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex w-fit gap-0.5 rounded-lg bg-panel p-0.5 shadow-panel">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
              category === c.id ? 'bg-raised text-fg shadow-panel' : 'text-muted hover:text-fg'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {list.map((e, i) => {
          const { best, sessions } = history(e.id)
          const proficiency = getProficiency(progress[e.id]?.totalReps ?? 0)
          return (
            <div
              key={e.id}
              className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-0"
            >
              <div className="flex w-8 flex-col items-center">
                <span
                  className={`h-2 w-2 rounded-full ${sessions > 0 ? 'bg-accent shadow-[0_0_8px_var(--accent)]' : 'bg-line-strong'}`}
                />
                {i < list.length - 1 && <span className="mt-1 h-4 w-px bg-line-strong" />}
              </div>
              <TierBadge tier={e.tier} />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm ${sessions > 0 ? 'text-fg' : 'text-muted'}`}>
                  {e.name}
                </p>
                <p className="truncate text-xs text-subtle capitalize">
                  {[e.branch, e.unit, ...e.modifiers.map((m) => MODIFIERS[m].label)].join(' · ')}
                </p>
              </div>
              <div className="w-24 text-xs">
                <p className="mb-1 font-mono text-muted tabular-nums">
                  P{proficiency.level} · {Math.floor(proficiency.progress)}%
                </p>
                <Bar value={proficiency.progress} max={100} className="h-1" />
              </div>
              <div className="text-right text-xs">
                {sessions > 0 ? (
                  <>
                    <p className="font-mono text-fg tabular-nums">best {formatValue(best, e)}</p>
                    <p className="text-subtle">{sessions} sessions</p>
                  </>
                ) : (
                  <p className="text-subtle">Not trained</p>
                )}
              </div>
            </div>
          )
        })}
      </Card>
    </div>
  )
}

export default Library
