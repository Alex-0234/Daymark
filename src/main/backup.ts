import Database from 'better-sqlite3'
import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { copyFileSync, mkdirSync, renameSync, rmSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import type { ExportResult, ImportResult } from '../shared/types'
import { day } from '../shared/date'
import { db, dbPath, openDb, schemaVersion } from './db'
import { installEnabled, modules } from './modules'

const filters = [{ name: 'Daymark backup', extensions: ['sqlite'] }]

// Copies the live database with SQLite's backup API (safe while the app runs), then
// optionally strips body metrics before writing the file the user picked.
async function exportBackup(win: BrowserWindow, includeMetrics: boolean): Promise<ExportResult> {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Export backup',
    defaultPath: join(app.getPath('documents'), `daymark-backup-${day()}.sqlite`),
    filters
  })
  if (canceled || !filePath) return null

  const tmp = join(app.getPath('temp'), `daymark-export-${randomUUID()}.sqlite`)
  try {
    await db.backup(tmp)
    const copy = new Database(tmp)
    try {
      copy.pragma('journal_mode = DELETE') // a single self-contained file
      if (!includeMetrics) {
        copy.exec('DROP TABLE IF EXISTS metrics_entries')
        // The module stays enabled; on import its migrations recreate an empty table.
        copy.prepare("DELETE FROM settings WHERE key = 'module.metrics.version'").run()
      }
      copy.exec('VACUUM') // so dropped data can't be recovered from free pages
    } finally {
      copy.close()
    }
    copyFileSync(tmp, filePath)
  } finally {
    rmSync(tmp, { force: true })
  }
  return { path: filePath }
}

// Returns an error message if the file can't be imported, otherwise null.
function validate(source: Database.Database): string | null {
  if (source.pragma('integrity_check', { simple: true }) !== 'ok')
    return 'The backup file is damaged.'

  const tables = (
    source.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as {
      name: string
    }[]
  ).map((t) => t.name)
  if (!['lists', 'items'].every((t) => tables.includes(t)))
    return 'This file is not a Daymark backup.'

  const newer = 'This backup was made by a newer version of Daymark. Update the app first.'
  if ((source.pragma('user_version', { simple: true }) as number) > schemaVersion) return newer

  if (tables.includes('settings')) {
    const get = source.prepare('SELECT value FROM settings WHERE key = ?')
    for (const m of modules) {
      const row = get.get(`module.${m.id}.version`) as { value: string } | undefined
      if (row && JSON.parse(row.value) > m.migrations.length) return newer
    }
  }
  return null
}

// Validates the chosen file, keeps a copy of the current database, swaps the backup in
// and runs any migrations it needs. The renderer reloads afterwards.
async function importBackup(win: BrowserWindow): Promise<ImportResult> {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Import backup',
    properties: ['openFile'],
    filters
  })
  if (canceled || !filePaths[0]) return null

  const staged = `${dbPath}.import`
  rmSync(staged, { force: true })
  let source: Database.Database
  try {
    source = new Database(filePaths[0], { readonly: true, fileMustExist: true })
  } catch {
    return { ok: false, error: 'The file could not be opened.' }
  }
  try {
    const error = validate(source)
    if (error) return { ok: false, error }
    await source.backup(staged)
  } catch {
    rmSync(staged, { force: true })
    return { ok: false, error: 'This file is not a valid Daymark backup.' }
  } finally {
    source.close()
  }

  const backups = join(app.getPath('userData'), 'backups')
  mkdirSync(backups, { recursive: true })
  const savedTo = join(
    backups,
    `before-import-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`
  )
  await db.backup(savedTo)

  db.close()
  try {
    for (const suffix of ['-wal', '-shm']) rmSync(dbPath + suffix, { force: true })
    renameSync(staged, dbPath)
    openDb()
    installEnabled()
  } catch (e) {
    // Put the previous database back so the app keeps working.
    try {
      db.close()
    } catch {
      // already closed or never opened
    }
    for (const suffix of ['-wal', '-shm']) rmSync(dbPath + suffix, { force: true })
    copyFileSync(savedTo, dbPath)
    openDb()
    installEnabled()
    return { ok: false, error: `Import failed, nothing was changed. (${(e as Error).message})` }
  } finally {
    rmSync(staged, { force: true })
  }
  return { ok: true, savedTo }
}

export function registerBackupIpc(): void {
  ipcMain.handle('data:export', (e, includeMetrics: boolean) =>
    exportBackup(BrowserWindow.fromWebContents(e.sender)!, includeMetrics)
  )
  ipcMain.handle('data:import', (e) => importBackup(BrowserWindow.fromWebContents(e.sender)!))
}
