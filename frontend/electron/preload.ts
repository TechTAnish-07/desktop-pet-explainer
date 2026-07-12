import { contextBridge, ipcRenderer } from 'electron'

export interface SettingsData {
  autoHideSeconds: number
  hotkey: string
  model: string
  apiKey: string
}

export interface ElectronAPI {
  onTriggerExplain: (callback: (text: string) => void) => () => void
  readClipboardText: () => Promise<string>
  setIgnoreMouseEvents: (ignore: boolean) => void
  moveWindowBy: (dx: number, dy: number) => void
  getSettings: () => Promise<SettingsData>
  saveSettings: (settings: Partial<SettingsData>) => Promise<SettingsData>
  simulateHotkey: () => Promise<void>
  closeApp: () => void
}

const electronAPI: ElectronAPI = {
  onTriggerExplain: (callback: (text: string) => void) => {
    const handler = (_event: unknown, text: string) => callback(text)
    ipcRenderer.on('trigger-explain', handler)
    return () => {
      ipcRenderer.removeListener('trigger-explain', handler)
    }
  },
  readClipboardText: () => ipcRenderer.invoke('read-clipboard-text'),
  setIgnoreMouseEvents: (ignore: boolean) => ipcRenderer.send('set-ignore-mouse-events', ignore),
  moveWindowBy: (dx: number, dy: number) => ipcRenderer.send('move-window-by', dx, dy),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: Partial<SettingsData>) => ipcRenderer.invoke('save-settings', settings),
  simulateHotkey: () => ipcRenderer.invoke('simulate-hotkey'),
  closeApp: () => ipcRenderer.send('close-app'),
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
