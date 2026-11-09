import { ipcMain } from 'electron'
import { db, getSetting, setSetting } from '../../db'
import { day, toDay } from '../../../shared/date'
import type { Calibration } from '../../../shared/cali'
import type { MetricEntry } from '../../../shared/metrics'
import type { MainModule } from '../types'

type EntryRow = { date: string; data: string }

const installed = (): boolean =>
  !!db
    .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'metrics_entries'")
    .get()

const toEntry = (r: EntryRow): MetricEntry => ({ date: r.date, values: JSON.parse(r.data) })

const getEntry = (date: string): MetricEntry | null => {
  const row = db.prepare('SELECT * FROM metrics_entries WHERE date = ?').get(date) as
    EntryRow | undefined
  return row ? toEntry(row) : null
}

const saveEntry = (entry: MetricEntry): void => {
  db.prepare(
    'INSERT INTO metrics_entries (date, data) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET data = excluded.data'
  ).run(entry.date, JSON.stringify(entry.values))
}

// Adds a weight to that day's entry, keeping its other measurements. No-op if the
// module isn't installed, so other modules (calisthenics onboarding) can call it freely.
export function recordWeight(date: string, weight: number): void {
  if (!installed() || !(weight > 0)) return
  const entry = getEntry(date)
  saveEntry({ date, values: { ...entry?.values, weight } })
}

export const metrics: MainModule = {
  id: 'metrics',

  migrations: [
    () =>
      db.exec(`CREATE TABLE metrics_entries (
        date TEXT PRIMARY KEY,
        data TEXT NOT NULL DEFAULT '{}'
      );`)
  ],

  // Start the weight history from the calisthenics calibration, once.
  seed: () => {
    if (getSetting('metrics.seededWeight', false)) return
    const calibration = getSetting<Calibration | null>('cali.calibration', null)
    const weight = calibration?.profile?.weight ?? 0
    if (weight > 0 && calibration) {
      const date = toDay(new Date(calibration.completedAt))
      if (!getEntry(date)) recordWeight(date, weight)
    }
    setSetting('metrics.seededWeight', true)
  },

  registerIpc: () => {
    ipcMain.handle('metrics:entries', () =>
      (db.prepare('SELECT * FROM metrics_entries ORDER BY date DESC').all() as EntryRow[]).map(
        toEntry
      )
    )
    ipcMain.handle('metrics:save', (_, entry: MetricEntry) => saveEntry(entry))
    ipcMain.handle('metrics:remove', (_, date: string) =>
      db.prepare('DELETE FROM metrics_entries WHERE date = ?').run(date)
    )
    ipcMain.handle('metrics:latestWeight', () => {
      if (!installed()) return null
      const rows = db
        .prepare('SELECT * FROM metrics_entries WHERE date <= ? ORDER BY date DESC')
        .all(day()) as EntryRow[]
      for (const r of rows) {
        const weight = toEntry(r).values.weight
        if (weight && weight > 0) return weight
      }
      return null
    })
  }
}
