import { app, BrowserWindow, globalShortcut, clipboard, ipcMain } from 'electron'
import path from 'node:path'
import Store from 'electron-store'
import { startPythonSidecar, stopPythonSidecar } from './sidecar'

interface SettingsSchema {
  autoHideSeconds: number
  hotkey: string
  model: string
  apiKey: string
}

const store = new Store<SettingsSchema>({
  defaults: {
    autoHideSeconds: 20,
    hotkey: 'CommandOrControl+Shift+E',
    model: 'gemini/gemini-2.5-flash',
    apiKey: '',
  },
})

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 540,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Set initial click-through state
  mainWindow.setIgnoreMouseEvents(true, { forward: true })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function registerGlobalHotkey(hotkey: string) {
  globalShortcut.unregisterAll()
  const registered = globalShortcut.register(hotkey, () => {
    triggerExplanationFlow()
  })

  if (!registered) {
    console.warn(`[Hotkey] Could not register global hotkey: ${hotkey}. Fallback to Alt+Shift+E`)
    globalShortcut.register('Alt+Shift+E', () => {
      triggerExplanationFlow()
    })
  } else {
    console.log(`[Hotkey] Successfully registered global hotkey: ${hotkey}`)
  }
}

function triggerExplanationFlow() {
  // On macOS, simulate Cmd+C to automatically copy highlighted text in active window
  if (process.platform === 'darwin') {
    try {
      const { execSync } = require('child_process')
      execSync('osascript -e \'tell application "System Events" to keystroke "c" using {command down}\'')
    } catch (e) {
      // Ignore if accessibility permissions not granted
    }
  }

  setTimeout(() => {
    const selectedText =
      clipboard.readText('selection') ||
      clipboard.readText() ||
      'Hello! Select or copy any text on your screen and press Cmd+Shift+E to explain it!'
    if (mainWindow) {
      mainWindow.webContents.send('trigger-explain', selectedText.trim())
    }
  }, 120)
}

app.whenReady().then(() => {
  // Start local Python backend sidecar on port 8000
  startPythonSidecar(8000)

  createWindow()

  const currentHotkey = store.get('hotkey')
  registerGlobalHotkey(currentHotkey)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  stopPythonSidecar()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers
ipcMain.on('set-ignore-mouse-events', (event, ignore: boolean) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) {
    if (ignore) {
      win.setIgnoreMouseEvents(true, { forward: true })
    } else {
      win.setIgnoreMouseEvents(false)
    }
  }
})

ipcMain.handle('read-clipboard-text', () => {
  return clipboard.readText('selection') || clipboard.readText() || ''
})

ipcMain.handle('get-settings', () => {
  return store.store
})

ipcMain.handle('save-settings', (_event, partialSettings: Partial<SettingsSchema>) => {
  for (const [key, val] of Object.entries(partialSettings)) {
    store.set(key as keyof SettingsSchema, val)
  }
  if (partialSettings.hotkey) {
    registerGlobalHotkey(partialSettings.hotkey)
  }
  return store.store
})

ipcMain.handle('simulate-hotkey', () => {
  triggerExplanationFlow()
})

ipcMain.on('move-window-by', (event, dx: number, dy: number) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) {
    const [currentX, currentY] = win.getPosition()
    win.setPosition(currentX + dx, currentY + dy)
  }
})

ipcMain.on('close-app', () => {
  app.quit()
})
