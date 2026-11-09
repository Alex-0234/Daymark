import { useMemo } from 'react'
import { Lock } from 'lucide-react'
import { useCali } from './useCali'
import { Bar, Card, TierBadge } from './ui'
import type { Exercise } from './utils'
import { generateSkillTree, type NodeState } from '../../utils/skillTree'

const NODE_W = 156
const NODE_H = 60
const GAP_Y = 40
const X = NODE_W + 12
const Y = NODE_H + GAP_Y
// Horizontal edge segments run in the gap under the parent; each parent column gets its
// own lane so lines from neighbouring parents don't merge into one.
const LANES = 3
const LANE_STEP = GAP_Y / (LANES + 1)

const EDGE: Record<NodeState, { stroke: string; width: number; dash?: string }> = {
  unlocked: { stroke: 'var(--muted)', width: 1.5 },
  available: { stroke: 'var(--accent)', width: 1.5, dash: '4 4' },
  locked: { stroke: 'var(--line-strong)', width: 1 }
}

const NODE: Record<NodeState, string> = {
  unlocked: 'border-line-strong bg-raised',
  available: 'border-dashed border-accent/70 bg-panel hover:bg-raised',
  // Fade the content, not the node, so edges behind it stay hidden.
  locked: 'border-line bg-bg *:opacity-50'
}

type Props = {
  exercises: Exercise[]
  // Tooltip text for a locked exercise: what it needs, or its cost.
  lockReason: (exercise: Exercise) => string
}

function SkillTreeView({ exercises, lockReason }: Props): React.JSX.Element {
  const { unlocked, progress, byId, ep, unlockExercise } = useCali()
  const tree = useMemo(
    () => generateSkillTree(exercises, { unlocked, progress, byId }),
    [exercises, unlocked, progress, byId]
  )
  const at = new Map(tree.nodes.map((n) => [n.exercise.id, { x: n.col * X, y: n.row * Y }]))
  const width = Math.max(0, (tree.cols - 1) * X + NODE_W)
  const height = Math.max(0, (tree.rows - 1) * Y + NODE_H)

  return (
    <Card className="overflow-auto p-6">
      <div className="relative" style={{ width, height }}>
        <svg width={width} height={height} className="pointer-events-none absolute inset-0">
          {tree.edges.map((e) => {
            const a = at.get(e.from)!
            const b = at.get(e.to)!
            const x1 = a.x + NODE_W / 2
            const y1 = a.y + NODE_H
            const x2 = b.x + NODE_W / 2
            const y2 = b.y
            const lane = y1 + LANE_STEP * (1 + (Math.round(a.x / X) % LANES))
            const style = EDGE[e.state]
            return (
              <path
                key={e.id}
                d={`M ${x1} ${y1} V ${lane} H ${x2} V ${y2}`}
                fill="none"
                strokeLinejoin="miter"
                stroke={style.stroke}
                strokeWidth={style.width}
                strokeDasharray={style.dash}
                className="transition-[stroke] duration-300"
              />
            )
          })}
        </svg>

        {tree.nodes.map((n) => {
          const { x, y } = at.get(n.exercise.id)!
          const canBuy = n.state === 'available' && ep >= n.cost
          return (
            <button
              key={n.exercise.id}
              title={n.state === 'unlocked' ? n.exercise.name : lockReason(n.exercise)}
              disabled={!canBuy}
              onClick={() => unlockExercise(n.exercise.id)}
              style={{ left: x, top: y, width: NODE_W, height: NODE_H }}
              className={`absolute flex flex-col justify-between rounded-lg border px-2.5 py-2 text-left transition-colors disabled:cursor-default ${NODE[n.state]}`}
            >
              <span className="flex items-center gap-1.5">
                <TierBadge tier={n.exercise.tier} />
                <span className="min-w-0 flex-1 truncate text-xs text-fg">{n.exercise.name}</span>
              </span>
              {n.state === 'unlocked' ? (
                <span className="flex items-center gap-2">
                  <Bar value={n.proficiency.progress} max={100} className="h-1 flex-1" />
                  <span className="font-mono text-[10px] text-subtle">P{n.proficiency.level}</span>
                </span>
              ) : (
                <span
                  className={`flex items-center gap-1 font-mono text-[10px] ${canBuy ? 'text-fg' : 'text-subtle'}`}
                >
                  <Lock size={10} />
                  {n.cost} EP{n.state === 'available' && (canBuy ? ' · unlock' : ' · need more')}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </Card>
  )
}

export default SkillTreeView
