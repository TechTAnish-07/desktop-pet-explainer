import { spawn, ChildProcess } from 'node:child_process'
import path from 'node:path'
import { app } from 'electron'

let sidecarProcess: ChildProcess | null = null

export function startPythonSidecar(port = 8000): void {
  if (sidecarProcess) {
    return
  }

  const isPackaged = app.isPackaged

  let command: string
  let args: string[]

  if (isPackaged) {
    // In production, run bundled standalone executable from resources folder
    const ext = process.platform === 'win32' ? '.exe' : ''
    command = path.join(process.resourcesPath, 'backend', `main${ext}`)
    args = []
  } else {
    // In development mode, run python script from ../backend/main.py
    const rootDir = path.join(__dirname, '../../')
    const mainPyPath = path.join(rootDir, 'backend', 'main.py')
    const venvPython = path.join(
      rootDir,
      'backend',
      'venv',
      process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python'
    )
    command = venvPython
    args = [mainPyPath]
  }

  console.log(`[Sidecar] Starting backend process: ${command} ${args.join(' ')}`)

  try {
    sidecarProcess = spawn(command, args, {
      env: {
        ...process.env,
        PORT: String(port),
        PYTHONUNBUFFERED: '1',
      },
      stdio: 'pipe',
    })

    sidecarProcess.stdout?.on('data', (data) => {
      console.log(`[Sidecar] ${data.toString().trim()}`)
    })

    sidecarProcess.stderr?.on('data', (data) => {
      console.error(`[Sidecar ERR] ${data.toString().trim()}`)
    })

    sidecarProcess.on('exit', (code, signal) => {
      console.log(`[Sidecar] Process exited with code ${code} signal ${signal}`)
      sidecarProcess = null
    })
  } catch (err) {
    console.error('[Sidecar] Failed to start Python backend:', err)
  }
}

export function stopPythonSidecar(): void {
  if (sidecarProcess) {
    console.log('[Sidecar] Stopping backend subprocess...')
    sidecarProcess.kill('SIGTERM')
    sidecarProcess = null
  }
}
