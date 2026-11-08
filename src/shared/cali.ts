export type Unit = 'reps' | 'seconds'

export type Exercise = {
  id: string
  name: string
  category: string
  branch: string
  tier: number
  unit: Unit
  requires: string[]
}

export type Routine = {
  id: string
  name: string
  description: string
  exercises: string[]
}

export type SetEntry = {
  id: string
  value: number | null
  done: boolean
}

export type SessionExercise = {
  id: string
  exerciseId: string
  sets: SetEntry[]
}

export type Draft = {
  id: string
  name: string
  startedAt: string
  routineId?: string
  exercises: SessionExercise[]
}

export type LoggedExercise = {
  exerciseId: string
  sets: number[]
}

export type Workout = {
  id: string
  name: string
  startedAt: string
  finishedAt: string
  duration: number
  exercises: LoggedExercise[]
}

export type CaliApi = {
  exercises: () => Promise<Exercise[]>
  routines: () => Promise<Routine[]>
  saveRoutine: (routine: Routine) => Promise<void>
  removeRoutine: (id: string) => Promise<void>
  workouts: () => Promise<Workout[]>
  saveWorkout: (workout: Workout) => Promise<void>
  removeWorkout: (id: string) => Promise<void>
  draft: () => Promise<Draft | null>
  saveDraft: (draft: Draft | null) => Promise<void>
}
