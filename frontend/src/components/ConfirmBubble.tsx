import React, { useState } from 'react'
import { Sparkles, X, AlertCircle } from 'lucide-react'

interface ConfirmBubbleProps {
  selectedText: string
  onTextChange?: (newText: string) => void
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmBubble: React.FC<ConfirmBubbleProps> = ({
  selectedText,
  onTextChange,
  onConfirm,
  onCancel,
}) => {
  const [showWarning, setShowWarning] = useState(false)

  const handleMouseEnter = () => {
    window.electronAPI?.setIgnoreMouseEvents(false)
  }

  const handleMouseLeave = () => {
    window.electronAPI?.setIgnoreMouseEvents(true)
  }

  const handleExplain = () => {
    if (!selectedText || !selectedText.trim()) {
      setShowWarning(true)
      return
    }
    setShowWarning(false)
    onConfirm()
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (showWarning) setShowWarning(false)
    onTextChange?.(e.target.value)
  }

  return (
    <div
      className="glass-bubble w-80 rounded-3xl p-4 text-white shadow-2xl relative transition-all duration-300 animate-fadeIn border border-emerald-400/40"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2 text-emerald-300 font-bold text-xs tracking-wide uppercase">
          <div className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span>Explain copied text? (Editable)</span>
        </div>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {showWarning && (
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-200 text-[11px] font-bold mb-2 animate-bounce">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span>Woof! Please type or paste some text first!</span>
        </div>
      )}

      {/* Editable Textarea Preview */}
      <textarea
        autoFocus
        value={selectedText}
        onChange={handleChange}
        placeholder="Type or paste text here to explain..."
        rows={3}
        className={`w-full bg-slate-950/90 border rounded-2xl p-3 my-2 text-xs font-['JetBrains_Mono',monospace] text-slate-200 leading-relaxed shadow-inner focus:outline-none transition-colors resize-none ${
          showWarning ? 'border-amber-400/80 focus:border-amber-400' : 'border-slate-700/80 focus:border-emerald-400'
        }`}
      />

      {/* Action Buttons */}
      <div className="flex items-center space-x-2.5 mt-3">
        <button
          onClick={handleExplain}
          disabled={!selectedText || !selectedText.trim()}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-2xl font-extrabold text-xs shadow-lg transition-all transform active:scale-95 cursor-pointer ${
            !selectedText || !selectedText.trim()
              ? 'bg-slate-800 text-slate-400 opacity-60 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 hover:from-emerald-300 hover:to-sky-300 text-slate-950 shadow-emerald-500/25'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Explain Now</span>
        </button>
        <button
          onClick={onCancel}
          className="py-2.5 px-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors border border-slate-700/80"
        >
          Dismiss
        </button>
      </div>

      {/* Trailing Comic Thought Bubble Dots pointing LEFT to Dog Companion */}
      <div className="absolute -left-6 bottom-10 flex items-center space-x-1.5 pointer-events-none">
        <div className="w-2.5 h-2.5 rounded-full bg-slate-900/90 border border-amber-400/50 backdrop-blur-md" />
        <div className="w-3.5 h-3.5 rounded-full bg-slate-900/95 border-2 border-amber-400/70 backdrop-blur-md shadow-md animate-pulse" />
      </div>
    </div>
  )
}
