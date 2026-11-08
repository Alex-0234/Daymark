const REPS_PER_LEVEL = 1000
const MAX_LEVEL = 10

export const getProficiency = (totalReps: number): { level: number; progress: number } => ({
  level: Math.min(Math.floor(totalReps / REPS_PER_LEVEL), MAX_LEVEL),
  progress: Math.min(totalReps / (REPS_PER_LEVEL * MAX_LEVEL), 1) * 100
})
