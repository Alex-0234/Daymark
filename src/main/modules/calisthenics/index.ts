import { ipcMain } from 'electron'
import { db, ensureLockedItem, getSetting, setSetting } from '../../db'
import {
  CALI_DEFAULT_SCHEDULE,
  type Calibration,
  CALI_HOBBY_ID,
  type Draft,
  type Exercise,
  type Routine,
  type Unit,
  type Unlocks,
  type Workout
} from '../../../shared/cali'
import { day, nextDate, weekday } from '../../../shared/date'
import type { MainModule } from '../types'
import { exercises } from './exercises'
import { recordWeight } from '../metrics'

type ExerciseRow = {
  id: string
  name: string
  category: string
  branch: string
  tier: number
  unit: string
  requires: string
  modifiers: string
  is_explosive: number
}
type RoutineRow = { id: string; name: string; description: string; exercises: string }
type WorkoutRow = {
  id: string
  name: string
  started_at: string
  finished_at: string
  duration: number
  completion: number
  data: string
}

const toExercise = ({ is_explosive, ...r }: ExerciseRow): Exercise => ({
  ...r,
  unit: r.unit as Unit,
  requires: JSON.parse(r.requires),
  modifiers: JSON.parse(r.modifiers),
  isExplosive: is_explosive === 1
})

const toRoutine = (r: RoutineRow): Routine => ({ ...r, exercises: JSON.parse(r.exercises) })

const toWorkout = (r: WorkoutRow): Workout => ({
  id: r.id,
  name: r.name,
  startedAt: r.started_at,
  finishedAt: r.finished_at,
  duration: r.duration,
  completion: r.completion,
  exercises: JSON.parse(r.data)
})

const firstScheduledDay = (repeat: number[]): string =>
  repeat.includes(weekday(day())) ? day() : nextDate(day(), repeat)

export const calisthenics: MainModule = {
  id: 'workout',

  migrations: [
    () =>
      db.exec(`CREATE TABLE cali_exercises (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        branch TEXT NOT NULL,
        tier INTEGER NOT NULL,
        unit TEXT NOT NULL,
        requires TEXT NOT NULL DEFAULT '[]'
      );
      CREATE TABLE cali_routines (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        exercises TEXT NOT NULL DEFAULT '[]'
      );
      CREATE TABLE cali_workouts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        started_at TEXT NOT NULL,
        finished_at TEXT NOT NULL,
        duration INTEGER NOT NULL,
        data TEXT NOT NULL
      );`),
    () => db.exec('DELETE FROM cali_exercises'),
    () =>
      db.exec(`ALTER TABLE cali_exercises ADD COLUMN modifiers TEXT NOT NULL DEFAULT '[]';
        ALTER TABLE cali_exercises ADD COLUMN is_explosive INTEGER NOT NULL DEFAULT 0;`),
    () =>
      db.exec(`ALTER TABLE cali_workouts ADD COLUMN completion REAL NOT NULL DEFAULT 1;
        CREATE TABLE cali_unlocks (
          exercise_id TEXT PRIMARY KEY,
          cost INTEGER NOT NULL,
          unlocked_at TEXT NOT NULL
        );`)
  ],

  seed: () => {
    const insert = db.prepare(
      'INSERT OR REPLACE INTO cali_exercises (id, name, category, branch, tier, unit, requires, modifiers, is_explosive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    db.transaction(() => {
      for (const e of exercises)
        insert.run(
          e.id,
          e.name,
          e.category,
          e.branch,
          e.tier,
          e.unit,
          JSON.stringify(e.requires),
          JSON.stringify(e.modifiers),
          e.isExplosive ? 1 : 0
        )
    })()

    ensureLockedItem({
      id: CALI_HOBBY_ID,
      listId: 'list-hobbies',
      title: 'Calisthenics',
      date: firstScheduledDay(CALI_DEFAULT_SCHEDULE),
      repeat: CALI_DEFAULT_SCHEDULE,
      values: { category: 'Fitness', duration: '45 min' }
    })
  },

  registerIpc: () => {
    ipcMain.handle('cali:exercises', () =>
      (
        db.prepare('SELECT * FROM cali_exercises ORDER BY category, tier').all() as ExerciseRow[]
      ).map(toExercise)
    )

    ipcMain.handle('cali:routines', () =>
      (db.prepare('SELECT * FROM cali_routines ORDER BY rowid').all() as RoutineRow[]).map(
        toRoutine
      )
    )

    ipcMain.handle('cali:saveRoutine', (_, r: Routine) =>
      db
        .prepare(
          `INSERT INTO cali_routines (id, name, description, exercises) VALUES (?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description, exercises = excluded.exercises`
        )
        .run(r.id, r.name, r.description, JSON.stringify(r.exercises))
    )

    ipcMain.handle('cali:removeRoutine', (_, id: string) =>
      db.prepare('DELETE FROM cali_routines WHERE id = ?').run(id)
    )

    ipcMain.handle('cali:workouts', () =>
      (
        db.prepare('SELECT * FROM cali_workouts ORDER BY started_at DESC').all() as WorkoutRow[]
      ).map(toWorkout)
    )

    ipcMain.handle('cali:saveWorkout', (_, w: Workout) =>
      db
        .prepare(
          'INSERT OR REPLACE INTO cali_workouts (id, name, started_at, finished_at, duration, completion, data) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
        .run(
          w.id,
          w.name,
          w.startedAt,
          w.finishedAt,
          w.duration,
          w.completion,
          JSON.stringify(w.exercises)
        )
    )

    ipcMain.handle('cali:removeWorkout', (_, id: string) =>
      db.prepare('DELETE FROM cali_workouts WHERE id = ?').run(id)
    )

    ipcMain.handle('cali:draft', () => getSetting<Draft | null>('cali.draft', null))
    ipcMain.handle('cali:saveDraft', (_, d: Draft | null) => setSetting('cali.draft', d))

    ipcMain.handle('cali:calibration', () =>
      getSetting<Calibration | null>('cali.calibration', null)
    )
    ipcMain.handle('cali:saveCalibration', (_, c: Calibration) => {
      // Bonus EP is granted once: a later (skipped -> real) calibration can't stack it.
      const previous = getSetting<Calibration | null>('cali.calibration', null)
      if (previous && !previous.skipped) return
      setSetting('cali.calibration', c)
      if (c.profile) recordWeight(day(), c.profile.weight)
    })

    ipcMain.handle('cali:unlocks', (): Unlocks =>
      Object.fromEntries(
        (
          db.prepare('SELECT exercise_id, cost FROM cali_unlocks').all() as {
            exercise_id: string
            cost: number
          }[]
        ).map((r) => [r.exercise_id, r.cost])
      )
    )
    ipcMain.handle('cali:saveUnlock', (_, exerciseId: string, cost: number) =>
      db
        .prepare(
          'INSERT OR IGNORE INTO cali_unlocks (exercise_id, cost, unlocked_at) VALUES (?, ?, ?)'
        )
        .run(exerciseId, cost, new Date().toISOString())
    )
  }
}
