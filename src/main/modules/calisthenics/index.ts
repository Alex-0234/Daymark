import { ipcMain } from 'electron'
import { db, getSetting, setSetting } from '../../db'
import type { Draft, Exercise, Routine, Unit, Workout } from '../../../shared/cali'
import type { MainModule } from '../types'
import { exercises } from './exercises'

type ExerciseRow = {
  id: string
  name: string
  category: string
  branch: string
  tier: number
  unit: string
  requires: string
}
type RoutineRow = { id: string; name: string; description: string; exercises: string }
type WorkoutRow = {
  id: string
  name: string
  started_at: string
  finished_at: string
  duration: number
  data: string
}

const toExercise = (r: ExerciseRow): Exercise => ({
  ...r,
  unit: r.unit as Unit,
  requires: JSON.parse(r.requires)
})

const toRoutine = (r: RoutineRow): Routine => ({ ...r, exercises: JSON.parse(r.exercises) })

const toWorkout = (r: WorkoutRow): Workout => ({
  id: r.id,
  name: r.name,
  startedAt: r.started_at,
  finishedAt: r.finished_at,
  duration: r.duration,
  exercises: JSON.parse(r.data)
})

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
      );`)
  ],

  seed: () => {
    const insert = db.prepare(
      'INSERT OR REPLACE INTO cali_exercises (id, name, category, branch, tier, unit, requires) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    db.transaction(() => {
      for (const e of exercises)
        insert.run(e.id, e.name, e.category, e.branch, e.tier, e.unit, JSON.stringify(e.requires))
    })()
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
          'INSERT OR REPLACE INTO cali_workouts (id, name, started_at, finished_at, duration, data) VALUES (?, ?, ?, ?, ?, ?)'
        )
        .run(w.id, w.name, w.startedAt, w.finishedAt, w.duration, JSON.stringify(w.exercises))
    )

    ipcMain.handle('cali:removeWorkout', (_, id: string) =>
      db.prepare('DELETE FROM cali_workouts WHERE id = ?').run(id)
    )

    ipcMain.handle('cali:draft', () => getSetting<Draft | null>('cali.draft', null))
    ipcMain.handle('cali:saveDraft', (_, d: Draft | null) => setSetting('cali.draft', d))
  }
}
