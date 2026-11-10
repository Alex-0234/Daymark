import { ipcMain } from 'electron'
import { db, getSetting, setSetting } from '../db'
import type { MainModule } from './types'
import { calisthenics } from './calisthenics'
import { metrics } from './metrics'

export const modules: MainModule[] = [calisthenics, metrics]
const core = ['tasks', 'hobbies']

export const enabled = (): string[] => getSetting('modules', core)

const install = (module: MainModule): void => {
  const key = `module.${module.id}.version`
  const version = getSetting(key, 0)
  module.migrations.slice(version).forEach((migrate, i) =>
    db.transaction(() => {
      migrate()
      setSetting(key, version + i + 1)
    })()
  )
  module.seed?.()
}

// Runs migrations and seeds of every enabled module. Also used after an import.
export function installEnabled(): void {
  for (const module of modules) if (enabled().includes(module.id)) install(module)
}

export function setupModules(): void {
  for (const module of modules) module.registerIpc()
  installEnabled()

  ipcMain.handle('modules:enabled', () => enabled())
  ipcMain.handle('modules:enable', (_, id: string) => {
    const list = enabled()
    if (!list.includes(id)) setSetting('modules', [...list, id])
    const module = modules.find((m) => m.id === id)
    if (module) install(module)
  })
}
