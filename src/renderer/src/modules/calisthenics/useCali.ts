import { createContext, useContext } from 'react'
import type { Progress } from '../../utils/workout'
import type { Draft, Exercise, ExerciseMap, LoggedSet, Routine, SetEntry, Workout } from './utils'

type CaliContextValue = {
  loaded: boolean
  exercises: Exercise[]
  byId: ExerciseMap
  routines: Routine[]
  workouts: Workout[]
  progress: Progress
  draft: Draft | null
  previous: (exerciseId: string) => LoggedSet[]
  startWorkout: (routine?: Routine) => void
  renameWorkout: (name: string) => void
  addExercises: (ids: string[]) => void
  removeExercise: (entryId: string) => void
  moveExercise: (entryId: string, direction: -1 | 1) => void
  addSet: (entryId: string) => void
  removeSet: (entryId: string, setId: string) => void
  updateSet: (entryId: string, setId: string, patch: Partial<SetEntry>) => void
  finishWorkout: () => Workout | null
  discardWorkout: () => void
  removeWorkout: (id: string) => void
  saveRoutine: (routine: Routine) => void
  removeRoutine: (id: string) => void
}

export const CaliContext = createContext<CaliContextValue | null>(null)

export function useCali(): CaliContextValue {
  const context = useContext(CaliContext)
  if (!context) throw new Error('useCali must be used inside CaliProvider')
  return context
}
