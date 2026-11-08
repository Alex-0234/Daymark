import { ipcMain } from 'electron'
import { db, getSetting, setSetting } from '../db'
import type { MainModule } from './types'
import { calisthenics } from './calisthenics'

const modules: MainModule[] = [calisthenics]
const core = ['tasks', 'hobbies']

const enabled = (): string[] => getSetting('modules', core)

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

export function setupModules(): void {
  for (const module of modules) {
    module.registerIpc()
    if (enabled().includes(module.id)) install(module)
  }

  ipcMain.handle('modules:enabled', () => enabled())
  ipcMain.handle('modules:enable', (_, id: string) => {
    const list = enabled()
    if (!list.includes(id)) setSetting('modules', [...list, id])
    const module = modules.find((m) => m.id === id)
    if (module) install(module)
  })
}
