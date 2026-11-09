import { useMemo, useState } from 'react'
import { List, Lock, Network, Sparkles } from 'lucide-react'
import { useCali } from './useCali'
import SkillTreeView from './SkillTreeView'
import { Bar, Button, Card, TierBadge } from './ui'
import { CATEGORIES, formatValue, type Exercise } from './utils'
import { getProficiency } from '../../utils/proficiency'
import {
  canUnlockExercise,
  getCheapestUnlockable,
  getUnlockCost,
  prereqMinimum
} from '../../utils/progression'
import { MODIFIERS } from '../../../../shared/cali'

function Library(): React.JSX.Element {
  const { exercises, workouts, progress, byId, unlocked, ep, unlockExercise } = useCali()
  const [category, setCategory] = useState(CATEGORIES[0].id)
  const [view, setView] = useState<'list' | 'tree'>('list')
  // Memoized so the tree layout only recomputes when the category or data changes.
  const list = useMemo(
    () => exercises.filter((e) => e.category === category),
    [exercises, category]
  )
  const cheapest = getCheapestUnlockable(exercises, unlocked, progress, byId)

  const lockReason = (e: Exercise): string => {
    const check = canUnlockExercise(e, unlocked, progress, byId)
    if (check.ok) return ep >= check.cost ? `Unlock for ${check.cost} EP` : 'Not enough EP'
    const names = (check.exercises ?? []).map((id) => {
      const prereq = byId[id]
      return prereq ? `${prereq.name} (${formatValue(prereqMinimum(prereq), prereq)} best)` : id
    })
    return check.reason === 'Prerequisites locked'
      ? `Unlock first: ${names.join(', ')}`
      : `Reach: ${names.join(', ')}`
  }

  const history = (id: string): { best: number; sessions: number } => {
    const sets = workouts.flatMap((w) => w.exercises.filter((e) => e.exerciseId === id))
    return {
      best: Math.max(0, ...sets.flatMap((e) => e.sets.map((s) => s.value))),
      sessions: sets.length
    }
  }

  return (
    <div className="space-y-4">
      <Card className="flex items-center gap-4 px-4 py-3">
        <Sparkles size={16} className="text-amber-300 drop-shadow-[0_0_6px_#fbbf24]" />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-semibold text-fg tabular-nums">{ep} EP</p>
          <p className="truncate text-xs text-subtle">
            {cheapest
              ? `Cheapest unlock: ${cheapest.name} · ${cheapest.cost} EP`
              : 'Nothing to unlock right now. Raise your prerequisite bests.'}
          </p>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
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
        <div className="flex gap-0.5 rounded-lg bg-panel p-0.5 shadow-panel">
          {(
            [
              ['list', List],
              ['tree', Network]
            ] as const
          ).map(([v, Icon]) => (
            <button
              key={v}
              title={v === 'list' ? 'List view' : 'Skill tree'}
              onClick={() => setView(v)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs capitalize transition-colors ${
                view === v ? 'bg-raised text-fg shadow-panel' : 'text-muted hover:text-fg'
              }`}
            >
              <Icon size={13} />
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'tree' ? (
        <SkillTreeView key={category} exercises={list} lockReason={lockReason} />
      ) : (
        <Card className="overflow-hidden">
          {list.map((e, i) => {
            const { best, sessions } = history(e.id)
            const proficiency = getProficiency(progress[e.id]?.totalReps ?? 0)
            const isUnlocked = unlocked.has(e.id)
            const check = isUnlocked ? null : canUnlockExercise(e, unlocked, progress, byId)
            const cost = getUnlockCost(e)
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
                  <p
                    className={`flex items-center gap-1.5 truncate text-sm ${sessions > 0 ? 'text-fg' : 'text-muted'}`}
                  >
                    {!isUnlocked && <Lock size={11} className="shrink-0 text-subtle" />}
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
                <div className="w-28 text-right text-xs">
                  {!isUnlocked ? (
                    <span title={lockReason(e)} className="inline-block">
                      <Button
                        variant={check?.ok && ep >= cost ? 'primary' : 'outline'}
                        disabled={!check?.ok || ep < cost}
                        onClick={() => unlockExercise(e.id)}
                      >
                        <Lock size={12} />
                        {cost} EP
                      </Button>
                    </span>
                  ) : sessions > 0 ? (
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
      )}
    </div>
  )
}

export default Library
