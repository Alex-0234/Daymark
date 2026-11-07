import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

export const db = new Database(join(app.getPath('userData'), 'app.sqlite'))

db.exec(`CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  done INTEGER DEFAULT 0
)`)