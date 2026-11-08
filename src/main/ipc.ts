import { ipcMain } from 'electron'
import { createItem, getLists, removeItem, setColumns, updateItem } from './db'

export function registerIpc(): void {
  ipcMain.handle('lists:all', () => getLists())
  ipcMain.handle('lists:setColumns', (_, listId, columns) => setColumns(listId, columns))
  ipcMain.handle('items:create', (_, listId) => createItem(listId))
  ipcMain.handle('items:update', (_, id, patch) => updateItem(id, patch))
  ipcMain.handle('items:remove', (_, id) => removeItem(id))
}
