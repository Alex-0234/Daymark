import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { Api } from '../shared/types'

const api: Api = {
  data: {
    export: (includeMetrics) => ipcRenderer.invoke('data:export', includeMetrics),
    import: () => ipcRenderer.invoke('data:import')
  },
  modules: {
    enabled: () => ipcRenderer.invoke('modules:enabled'),
    enable: (id) => ipcRenderer.invoke('modules:enable', id)
  },
  cali: {
    exercises: () => ipcRenderer.invoke('cali:exercises'),
    routines: () => ipcRenderer.invoke('cali:routines'),
    saveRoutine: (routine) => ipcRenderer.invoke('cali:saveRoutine', routine),
    removeRoutine: (id) => ipcRenderer.invoke('cali:removeRoutine', id),
    workouts: () => ipcRenderer.invoke('cali:workouts'),
    saveWorkout: (workout) => ipcRenderer.invoke('cali:saveWorkout', workout),
    removeWorkout: (id) => ipcRenderer.invoke('cali:removeWorkout', id),
    draft: () => ipcRenderer.invoke('cali:draft'),
    saveDraft: (draft) => ipcRenderer.invoke('cali:saveDraft', draft),
    unlocks: () => ipcRenderer.invoke('cali:unlocks'),
    saveUnlock: (exerciseId, cost) => ipcRenderer.invoke('cali:saveUnlock', exerciseId, cost),
    calibration: () => ipcRenderer.invoke('cali:calibration'),
    saveCalibration: (calibration) => ipcRenderer.invoke('cali:saveCalibration', calibration)
  },
  metrics: {
    entries: () => ipcRenderer.invoke('metrics:entries'),
    save: (entry) => ipcRenderer.invoke('metrics:save', entry),
    remove: (date) => ipcRenderer.invoke('metrics:remove', date),
    latestWeight: () => ipcRenderer.invoke('metrics:latestWeight')
  },
  lists: {
    all: () => ipcRenderer.invoke('lists:all'),
    setColumns: (listId, columns) => ipcRenderer.invoke('lists:setColumns', listId, columns)
  },
  items: {
    create: (listId) => ipcRenderer.invoke('items:create', listId),
    update: (id, patch) => ipcRenderer.invoke('items:update', id, patch),
    remove: (id) => ipcRenderer.invoke('items:remove', id)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
