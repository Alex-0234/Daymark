import { useEffect, useMemo, useRef, useState } from 'react'
import { buildProgress } from '../../utils/workout'
import {
  calculateEpBalance,
  calculatePlayerRating,
  canUnlockExercise,
  getUnlocked
} from '../../utils/progression'
import { calculateStreak } from '../../utils/streak'
import { calibrationProgress, calibrationRating } from '../../utils/calibration'
import { DEFAULT_BODYWEIGHT } from '../../utils/level'
import { useList } from '../../context/useList'
import { day, nextDate } from '../../data'
import {
  CALI_DEFAULT_SCHEDULE,
  CALI_HOBBY_ID,
  type Calibration,
  type Unlocks
} from '../../../../shared/cali'
import { CaliContext } from './useCali'
import {
  draftToWorkout,
  uid,
  type Draft,
  type Exercise,
  type LoggedSet,
  type Routine,
  type SessionExercise,
  type SetEntry,
  type Workout
} from './utils'

const api = window.api.cali

export function CaliProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [loaded, setLoaded] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [routines, setRoutines] = useState<Routine[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [draft, setDraft] = useState<Draft | null>(null)
  const [unlocks, setUnlocks] = useState<Unlocks>({})
  const [calibration, setCalibration] = useState<Calibration | null>(null)
  const [loggedWeight, setLoggedWeight] = useState<number | null>(null)
  const latest = useRef<Draft | null>(null)
  const { lists, updateItem } = useList()
  const hobby = lists.flatMap((l) => l.items).find((i) => i.id === CALI_HOBBY_ID)
  const schedule = hobby?.repeat ?? CALI_DEFAULT_SCHEDULE

  useEffect(() => {
    Promise.all([
      api.exercises(),
      api.routines(),
      api.workouts(),
      api.draft(),
      api.unlocks(),
      api.calibration(),
      window.api.metrics.latestWeight()
    ]).then(([e, r, w, d, u, c, weight]) => {
      setLoggedWeight(weight)
      setExercises(e)
      setRoutines(r)
      setWorkouts(w)
      setUnlocks(u)
      setCalibration(c)
      latest.current = d
      setDraft(d)
      setLoaded(true)
    })
  }, [])

  const byId = useMemo(() => Object.fromEntries(exercises.map((e) => [e.id, e])), [exercises])
  const baseline = useMemo(
    () => calibrationProgress(calibration?.results ?? [], exercises),
    [calibration, exercises]
  )
  const progress = useMemo(
    () => buildProgress(workouts, exercises, byId, baseline),
    [workouts, exercises, byId, baseline]
  )
  const unlocked = useMemo(
    () => getUnlocked(exercises, unlocks, workouts, baseline),
    [exercises, unlocks, workouts, baseline]
  )
  const ep = useMemo(
    () => calculateEpBalance(workouts, byId, unlocks, calibration?.bonusEP ?? 0),
    [workouts, byId, unlocks, calibration]
  )
  const startRating = useMemo(
    () => calibrationRating(calibration?.results ?? [], byId),
    [calibration, byId]
  )
  const rating = useMemo(
    () => calculatePlayerRating(workouts, byId, startRating),
    [workouts, byId, startRating]
  )
  // Body metrics' latest weight wins over the one given during onboarding.
  const bodyweight = loggedWeight || calibration?.profile?.weight || DEFAULT_BODYWEIGHT

  const saveCalibration = (c: Calibration): void => {
    if (calibration && !calibration.skipped) return
    api.saveCalibration(c)
    setCalibration(c)
  }
  const streak = useMemo(() => calculateStreak(workouts, schedule), [workouts, schedule])

  const unlockExercise = (id: string): boolean => {
    const exercise = byId[id]
    if (!exercise) return false
    const check = canUnlockExercise(exercise, unlocked, progress, byId)
    if (!check.ok || ep < check.cost) return false
    api.saveUnlock(id, check.cost)
    setUnlocks((prev) => ({ ...prev, [id]: check.cost }))
    return true
  }

  const commit = (next: Draft | null): void => {
    latest.current = next
    setDraft(next)
    api.saveDraft(next)
  }

  const edit = (change: (d: Draft) => Draft): void => {
    if (latest.current) commit(change(latest.current))
  }

  const editEntry = (entryId: string, change: (e: SessionExercise) => SessionExercise): void =>
    edit((d) => ({
      ...d,
      exercises: d.exercises.map((e) => (e.id === entryId ? change(e) : e))
    }))

  const previous = (exerciseId: string): LoggedSet[] =>
    workouts
      .find((w) => w.exercises.some((e) => e.exerciseId === exerciseId))
      ?.exercises.find((e) => e.exerciseId === exerciseId)?.sets ?? []

  const newSet = (): SetEntry => ({ id: uid(), value: null, extraWeight: null, done: false })

  const entry = (exerciseId: string): SessionExercise => ({
    id: uid(),
    exerciseId,
    sets: Array.from({ length: previous(exerciseId).length || 3 }, newSet)
  })

  const startWorkout = (routine?: Routine): void =>
    commit({
      id: uid(),
      name: routine?.name ?? 'Workout',
      startedAt: new Date().toISOString(),
      routineId: routine?.id,
      exercises: (routine?.exercises ?? []).filter((id) => byId[id]).map(entry)
    })

  const finishWorkout = (): Workout | null => {
    if (!latest.current) return null
    const workout = draftToWorkout(latest.current, new Date().toISOString())
    if (workout.exercises.length === 0) return null
    api.saveWorkout(workout)
    setWorkouts((prev) => [workout, ...prev])
    commit(null)
    // Today's (or an overdue) session is done: move the hobby to its next scheduled day.
    if (hobby && hobby.date <= day())
      updateItem(hobby.listId, hobby.id, { date: nextDate(hobby.date, hobby.repeat) })
    return workout
  }

  const saveRoutine = (routine: Routine): void => {
    api.saveRoutine(routine)
    setRoutines((prev) =>
      prev.some((r) => r.id === routine.id)
        ? prev.map((r) => (r.id === routine.id ? routine : r))
        : [...prev, routine]
    )
  }

  return (
    <CaliContext.Provider
      value={{
        loaded,
        exercises,
        byId,
        routines,
        workouts,
        progress,
        calibration,
        saveCalibration,
        startRating,
        bodyweight,
        unlocked,
        ep,
        rating,
        streak,
        schedule,
        unlockExercise,
        draft,
        previous,
        startWorkout,
        renameWorkout: (name) => edit((d) => ({ ...d, name })),
        addExercises: (ids) =>
          edit((d) => ({ ...d, exercises: [...d.exercises, ...ids.map(entry)] })),
        removeExercise: (entryId) =>
          edit((d) => ({ ...d, exercises: d.exercises.filter((e) => e.id !== entryId) })),
        moveExercise: (entryId, direction) =>
          edit((d) => {
            const list = [...d.exercises]
            const from = list.findIndex((e) => e.id === entryId)
            const to = from + direction
            if (from < 0 || to < 0 || to >= list.length) return d
            ;[list[from], list[to]] = [list[to], list[from]]
            return { ...d, exercises: list }
          }),
        addSet: (entryId) => editEntry(entryId, (e) => ({ ...e, sets: [...e.sets, newSet()] })),
        removeSet: (entryId, setId) =>
          editEntry(entryId, (e) => ({ ...e, sets: e.sets.filter((s) => s.id !== setId) })),
        updateSet: (entryId, setId, patch) =>
          editEntry(entryId, (e) => ({
            ...e,
            sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s))
          })),
        finishWorkout,
        discardWorkout: () => commit(null),
        removeWorkout: (id) => {
          api.removeWorkout(id)
          setWorkouts((prev) => prev.filter((w) => w.id !== id))
        },
        saveRoutine,
        removeRoutine: (id) => {
          api.removeRoutine(id)
          setRoutines((prev) => prev.filter((r) => r.id !== id))
        }
      }}
    >
      {children}
    </CaliContext.Provider>
  )
}
