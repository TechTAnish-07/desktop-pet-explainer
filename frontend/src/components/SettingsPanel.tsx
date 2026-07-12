import React, { useState, useEffect } from 'react'
import { Settings, X, Key, Clock, Cpu, Keyboard, Check } from 'lucide-react'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  onSettingsSaved: () => void
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  onSettingsSaved,
}) => {
  const [model, setModel] = useState('gemini/gemini-2.5-flash')
  const [apiKey, setApiKey] = useState('')
  const [autoHideSeconds, setAutoHideSeconds] = useState(20)
  const [hotkey, setHotkey] = useState('CommandOrControl+Shift+E')
  const [savedMessage, setSavedMessage] = useState(false)

  useEffect(() => {
    if (isOpen && window.electronAPI) {
      window.electronAPI.getSettings().then((settings) => {
        if (settings) {
          setModel(settings.model || 'gemini/gemini-2.5-flash')
          setApiKey(settings.apiKey || '')
          setAutoHideSeconds(settings.autoHideSeconds || 20)
          setHotkey(settings.hotkey || 'CommandOrControl+Shift+E')
        }
      })
    }
  }, [isOpen])

  const handleMouseEnter = () => {
    window.electronAPI?.setIgnoreMouseEvents(false)
  }

  const handleMouseLeave = () => {
    window.electronAPI?.setIgnoreMouseEvents(true)
  }

  const handleSave = async () => {
    if (window.electronAPI) {
      await window.electronAPI.saveSettings({
        model,
        apiKey,
        autoHideSeconds,
        hotkey,
      })
    }
    setSavedMessage(true)
    setTimeout(() => {
      setSavedMessage(false)
      onSettingsSaved()
      onClose()
    }, 900)
  }

  if (!isOpen) return null

  return (
    <div
      className="glass-panel w-80 rounded-3xl p-5 text-white shadow-2xl relative transition-all duration-300 border border-sky-400/30"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-700/80">
        <div className="flex items-center space-x-2 text-sky-400 font-semibold text-sm">
          <Settings className="w-4 h-4" />
          <span>Pet Explainer Settings</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4 text-xs">
        {/* LLM Model Provider */}
        <div>
          <label className="flex items-center space-x-1.5 text-slate-300 font-medium mb-1.5">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span>AI Model Provider</span>
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-400"
          >
            <option value="gemini/gemini-2.5-flash">Google Gemini 2.5 Flash (Free Tier)</option>
            <option value="gemini/gemini-1.5-pro">Google Gemini 1.5 Pro</option>
            <option value="claude-3-5-sonnet-latest">Anthropic Claude 3.5 Sonnet</option>
            <option value="gpt-4o">OpenAI GPT-4o</option>
            <option value="mock">Built-in Simulation Mode (No API Key)</option>
          </select>
        </div>

        {/* API Key */}
        <div>
          <label className="flex items-center space-x-1.5 text-slate-300 font-medium mb-1.5">
            <Key className="w-3.5 h-3.5 text-emerald-400" />
            <span>API Key (Optional override)</span>
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Leave empty to use .env or Mock"
            className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-400 font-mono"
          />
        </div>

        {/* Auto-Hide Timeout */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="flex items-center space-x-1.5 text-slate-300 font-medium">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>Auto-Hide Timeout</span>
            </label>
            <span className="font-mono text-purple-300 font-bold">{autoHideSeconds}s</span>
          </div>
          <input
            type="range"
            min="10"
            max="60"
            step="5"
            value={autoHideSeconds}
            onChange={(e) => setAutoHideSeconds(Number(e.target.value))}
            className="w-full accent-purple-400 cursor-pointer"
          />
        </div>

        {/* Global Hotkey */}
        <div>
          <label className="flex items-center space-x-1.5 text-slate-300 font-medium mb-1.5">
            <Keyboard className="w-3.5 h-3.5 text-amber-400" />
            <span>Global Hotkey</span>
          </label>
          <input
            type="text"
            value={hotkey}
            onChange={(e) => setHotkey(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Example: <code className="text-amber-300">CommandOrControl+Shift+E</code> or <code className="text-amber-300">Alt+Shift+E</code>
          </p>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-700/80 flex items-center justify-end">
        <button
          onClick={handleSave}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition-transform active:scale-95"
        >
          {savedMessage ? (
            <>
              <Check className="w-4 h-4" />
              <span>Saved!</span>
            </>
          ) : (
            <span>Save Settings</span>
          )}
        </button>
      </div>
    </div>
  )
}
