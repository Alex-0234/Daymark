import type { Exercise, ExerciseMap } from '../modules/calisthenics/utils'
import { canUnlockExercise, getUnlockCost } from './progression'
import { getProficiency } from './proficiency'
import type { Progress } from './workout'

export type NodeState = 'unlocked' | 'available' | 'locked'

export type SkillNode = {
  exercise: Exercise
  state: NodeState
  cost: number
  proficiency: { level: number; progress: number }
  // Grid position: multiply by your own spacing to get pixels.
  row: number
  col: number
}

// An edge takes the state of the exercise it leads to.
export type SkillEdge = { id: string; from: string; to: string; state: NodeState }

export type SkillTree = { nodes: SkillNode[]; edges: SkillEdge[]; rows: number; cols: number }

type Context = { unlocked: Set<string>; progress: Progress; byId: ExerciseMap }

export const nodeState = (exercise: Exercise, { unlocked, progress, byId }: Context): NodeState =>
  unlocked.has(exercise.id)
    ? 'unlocked'
    : canUnlockExercise(exercise, unlocked, progress, byId).ok
      ? 'available'
      : 'locked'

// Lays out one set of exercises (usually a category) as a top-down tree:
// - row: at least the exercise's tier and below all its prerequisites; empty rows are dropped
// - col: each row packed from the left, siblings grouped in their parents' order
export function generateSkillTree(exercises: Exercise[], ctx: Context): SkillTree {
  const inTree = new Map(exercises.map((e) => [e.id, e]))
  const parents = (e: Exercise): string[] => e.requires.filter((id) => inTree.has(id))

  const depth = new Map<string, number>()
  const rowOf = (e: Exercise, seen = new Set<string>()): number => {
    if (depth.has(e.id)) return depth.get(e.id)!
    if (seen.has(e.id)) return e.tier // prerequisite cycle: fall back to tier
    seen.add(e.id)
    const row = Math.max(e.tier, ...parents(e).map((p) => rowOf(inTree.get(p)!, seen) + 1))
    depth.set(e.id, row)
    return row
  }
  exercises.forEach((e) => rowOf(e))

  const levels = [...new Set(depth.values())].sort((a, b) => a - b)
  const rowIndex = new Map(levels.map((level, i) => [level, i]))
  const col = new Map<string, number>()

  for (const level of levels) {
    const members = exercises.filter((e) => depth.get(e.id) === level)

    // Packed from the left, ordered by the column of each node's first placed parent
    // (roots first), so siblings stay together and edges cross as little as possible.
    const parentCol = (e: Exercise): number => {
      const p = parents(e).find((id) => col.has(id))
      return p === undefined ? -1 : col.get(p)!
    }
    members
      .map((e, i) => ({ e, key: parentCol(e), i }))
      .sort((a, b) => a.key - b.key || a.i - b.i)
      .forEach(({ e }, i) => col.set(e.id, i))
  }
  const nodes: SkillNode[] = exercises.map((e) => ({
    exercise: e,
    state: nodeState(e, ctx),
    cost: getUnlockCost(e),
    proficiency: getProficiency(ctx.progress[e.id]?.totalReps ?? 0),
    row: rowIndex.get(depth.get(e.id)!)!,
    col: col.get(e.id)!
  }))
  const stateOf = new Map(nodes.map((n) => [n.exercise.id, n.state]))
  const edges: SkillEdge[] = exercises.flatMap((e) =>
    parents(e).map((p) => ({ id: `${p}->${e.id}`, from: p, to: e.id, state: stateOf.get(e.id)! }))
  )

  return {
    nodes,
    edges,
    rows: levels.length,
    cols: nodes.length ? Math.max(...nodes.map((n) => n.col)) + 1 : 0
  }
}
