import { createContext, useContext } from 'react'
import type { Progress } from '../../utils/workout'
import type { Streak } from '../../utils/streak'
import type { Calibration } from '../../../../shared/cali'
import type { Draft, Exercise, ExerciseMap, LoggedSet, Routine, SetEntry, Workout } from './utils'

type CaliContextValue = {
  loaded: boolean
  exercises: Exercise[]
  byId: ExerciseMap
  routines: Routine[]
  workouts: Workout[]
  progress: Progress
  // null until onboarding is finished or skipped.
  calibration: Calibration | null
  saveCalibration: (calibration: Calibration) => void
  startRating: number
  bodyweight: number
  unlocked: Set<string>
  ep: number
  rating: number
  streak: Streak
  // Weekdays (0 = Sun) of the calisthenics hobby: the training schedule.
  schedule: number[]
  unlockExercise: (id: string) => boolean
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
