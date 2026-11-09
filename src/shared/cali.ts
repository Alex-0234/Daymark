export type Unit = 'reps' | 'seconds'

// The permanent hobby the calisthenics module adds. Its repeat days are the training schedule.
export const CALI_HOBBY_ID = 'hobby-calisthenics'
export const CALI_DEFAULT_SCHEDULE = [1, 3, 5]

export type Modifier = 'incline' | 'decline' | 'band' | 'explosive'

export const MODIFIERS: Record<Modifier, { label: string; effect: 'easier' | 'harder' | 'power' }> =
  {
    incline: { label: 'Incline', effect: 'easier' },
    decline: { label: 'Decline', effect: 'harder' },
    band: { label: 'Band Assisted', effect: 'easier' },
    explosive: { label: 'Explosive', effect: 'power' }
  }

export type Exercise = {
  id: string
  name: string
  category: string
  branch: string
  tier: number
  unit: Unit
  requires: string[]
  modifiers: Modifier[]
  isExplosive: boolean
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
  extraWeight: number | null
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

export type LoggedSet = {
  value: number
  extraWeight: number
}

export type LoggedExercise = {
  exerciseId: string
  sets: LoggedSet[]
}

export type Workout = {
  id: string
  name: string
  startedAt: string
  finishedAt: string
  duration: number
  // 0..1, the fraction of the planned sets that were actually done.
  completion: number
  exercises: LoggedExercise[]
}

// Exercise id -> EP paid to unlock it.
export type Unlocks = Record<string, number>

export type Profile = {
  name: string
  age: number
  gender: string
  height: number
  weight: number
}

// The best variation the user could do per category during onboarding.
export type CalibrationResult = { category: string; exerciseId: string; value: number }

export type Calibration = {
  completedAt: string
  skipped: boolean
  profile: Profile | null
  results: CalibrationResult[]
  bonusEP: number
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
  unlocks: () => Promise<Unlocks>
  saveUnlock: (exerciseId: string, cost: number) => Promise<void>
  calibration: () => Promise<Calibration | null>
  saveCalibration: (calibration: Calibration) => Promise<void>
}
