import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { randomUUID } from 'crypto'
import type { Column, Item, ItemPatch, List } from '../shared/types'
import { day } from '../shared/date'
import { repeatColumn, templates } from './templates'

type ListRow = { id: string; feature: string; name: string; columns: string }
type ItemRow = {
  id: string
  list_id: string
  title: string
  date: string
  done: number
  repeat: string
  data: string
  locked: number
}

export const db = new Database(join(app.getPath('userData'), 'app.sqlite'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const migrations: (() => void)[] = [
  () =>
    db.exec(`CREATE TABLE lists (
      id TEXT PRIMARY KEY,
      feature TEXT NOT NULL,
      name TEXT NOT NULL,
      columns TEXT NOT NULL
    );
    CREATE TABLE items (
      id TEXT PRIMARY KEY,
      list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      data TEXT NOT NULL DEFAULT '{}'
    );
    CREATE INDEX items_list ON items(list_id);`),
  () => {
    db.exec(`ALTER TABLE items ADD COLUMN repeat TEXT NOT NULL DEFAULT '[]'`)
    for (const l of db.prepare('SELECT * FROM lists').all() as ListRow[]) {
      const columns: Column[] = JSON.parse(l.columns)
      if (columns.some((c) => c.key === 'repeat')) continue
      const at = columns.findIndex((c) => c.key === 'date') + 1
      columns.splice(at, 0, repeatColumn)
      setColumns(l.id, columns)
    }
  },
  () => db.exec('CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)'),
  () => db.exec('ALTER TABLE items ADD COLUMN locked INTEGER NOT NULL DEFAULT 0')
]

const version = db.pragma('user_version', { simple: true }) as number
migrations.slice(version).forEach((migrate, i) =>
  db.transaction(() => {
    migrate()
    db.pragma(`user_version = ${version + i + 1}`)
  })()
)

export function getSetting<T>(key: string, fallback: T): T {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
    { value: string } | undefined
  return row ? JSON.parse(row.value) : fallback
}

export function setSetting(key: string, value: unknown): void {
  db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run(key, JSON.stringify(value))
}

const insertList = db.prepare(
  'INSERT OR IGNORE INTO lists (id, feature, name, columns) VALUES (?, ?, ?, ?)'
)
for (const t of templates) insertList.run(t.id, t.feature, t.name, JSON.stringify(t.columns))

const toItem = (r: ItemRow): Item => ({
  id: r.id,
  listId: r.list_id,
  title: r.title,
  date: r.date,
  done: r.done === 1,
  repeat: JSON.parse(r.repeat),
  values: JSON.parse(r.data),
  locked: r.locked === 1
})

const getItem = (id: string): Item =>
  toItem(db.prepare('SELECT * FROM items WHERE id = ?').get(id) as ItemRow)

export function getLists(): List[] {
  const lists = db.prepare('SELECT * FROM lists ORDER BY rowid').all() as ListRow[]
  const items = (db.prepare('SELECT * FROM items ORDER BY rowid').all() as ItemRow[]).map(toItem)
  return lists.map((l) => ({
    id: l.id,
    feature: l.feature,
    name: l.name,
    columns: JSON.parse(l.columns),
    items: items.filter((i) => i.listId === l.id)
  }))
}

export function setColumns(listId: string, columns: Column[]): void {
  db.prepare('UPDATE lists SET columns = ? WHERE id = ?').run(JSON.stringify(columns), listId)
}

export function createItem(listId: string): Item {
  const id = randomUUID()
  db.prepare('INSERT INTO items (id, list_id, title, date) VALUES (?, ?, ?, ?)').run(
    id,
    listId,
    'Untitled',
    day()
  )
  return getItem(id)
}

export function updateItem(id: string, patch: ItemPatch): Item {
  const current = getItem(id)
  const item = { ...current, ...patch }
  if (current.locked && item.repeat.length === 0) item.repeat = current.repeat
  db.prepare(
    'UPDATE items SET title = ?, date = ?, done = ?, repeat = ?, data = ? WHERE id = ?'
  ).run(
    item.title,
    item.date,
    item.done ? 1 : 0,
    JSON.stringify(item.repeat),
    JSON.stringify(item.values),
    id
  )
  return item
}

// Inserts a module-owned item once; the user's later edits to it are kept.
export function ensureLockedItem(item: Omit<Item, 'done' | 'locked'>): void {
  db.prepare(
    'INSERT OR IGNORE INTO items (id, list_id, title, date, repeat, data, locked) VALUES (?, ?, ?, ?, ?, ?, 1)'
  ).run(
    item.id,
    item.listId,
    item.title,
    item.date,
    JSON.stringify(item.repeat),
    JSON.stringify(item.values)
  )
}

export function removeItem(id: string): void {
  db.prepare('DELETE FROM items WHERE id = ? AND locked = 0').run(id)
}
