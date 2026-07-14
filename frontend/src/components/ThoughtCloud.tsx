import React, { useState } from 'react'
import { Copy, Check, X, Sparkles, Send, MessageSquare } from 'lucide-react'

interface ThoughtCloudProps {
  content: string
  isStreaming: boolean
  remainingSeconds: number
  autoHideSeconds: number
  isChatActive?: boolean
  history?: Array<{ role: 'user' | 'assistant', content: string }>
  onChatActiveChange?: (active: boolean) => void
  onSendFollowUp?: (question: string, mode?: 'explain' | 'chat') => void
  onClose: () => void
}

export const ThoughtCloud: React.FC<ThoughtCloudProps> = ({
  content,
  isStreaming,
  remainingSeconds,
  autoHideSeconds,
  isChatActive,
  history,
  onChatActiveChange,
  onSendFollowUp,
  onClose,
}) => {
  const [copied, setCopied] = useState(false)
  const [followUpText, setFollowUpText] = useState('')
  const [mode, setMode] = useState<'chat' | 'explain'>('chat')

  const handleMouseEnter = () => {
    window.electronAPI?.setIgnoreMouseEvents(false)
  }

  const handleMouseLeave = () => {
    window.electronAPI?.setIgnoreMouseEvents(true)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setFollowUpText(val)
    onChatActiveChange?.(val.trim().length > 0)
  }

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!followUpText.trim()) return
    const q = followUpText.trim()
    setFollowUpText('')
    onChatActiveChange?.(false)
    onSendFollowUp?.(q, mode)
  }

  // Convert basic markdown tags safely to styled JSX elements or formatted text
  const renderFormattedMarkdown = (text: string) => {
    if (!text) return null
    const paragraphs = text.split('\n\n')

    return paragraphs.map((para, idx) => {
      // Heading 3
      if (para.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-sm font-bold text-sky-300 mt-2.5 mb-1.5 flex items-center space-x-1.5">
            <span className="w-1.5 h-3 bg-sky-400 rounded-full inline-block mr-1"></span>
            <span>{para.replace('### ', '')}</span>
          </h3>
        )
      }
      // Bullet items
      if (para.includes('\n- ') || para.startsWith('- ')) {
        const lines = para.split('\n')
        return (
          <ul key={idx} className="list-none space-y-1.5 my-2 text-xs text-slate-200">
            {lines.map((line, lIdx) => {
              if (line.trim().startsWith('- ')) {
                return (
                  <li key={lIdx} className="flex items-start space-x-2">
                    <span className="text-emerald-400 font-bold mt-0.5">•</span>
                    <span className="flex-1 leading-relaxed">{line.replace('- ', '')}</span>
                  </li>
                )
              }
              return <p key={lIdx} className="leading-relaxed">{line}</p>
            })}
          </ul>
        )
      }
      return (
        <p key={idx} className="text-xs text-slate-200 leading-relaxed mb-2.5">
          {para}
        </p>
      )
    })
  }

  const progressPct = autoHideSeconds > 0 ? (remainingSeconds / autoHideSeconds) * 100 : 0

  return (
    <div
      className="relative flex flex-col items-center animate-fadeIn"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Glass Thought Bubble */}
      <div className="glass-bubble w-[420px] max-w-full rounded-3xl p-4 text-white shadow-2xl relative mb-3 border border-sky-400/35">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-700/80">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="tracking-wide text-sky-200">NOVA EXPLANATION</span>
            {isStreaming && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 animate-pulse">
                Streaming...
              </span>
            )}
            {isChatActive && !isStreaming && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300">
                Chatting (Pinned open)
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={handleCopy}
              disabled={!content}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Copy Explanation"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Bubble"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Explanation Content Area */}
        <div className="max-h-64 overflow-y-auto custom-scrollbar pr-1.5 markdown-body space-y-3">
          {history && history.length > 0 && (
            <div className="space-y-3 pb-3 border-b border-slate-700/60">
              {history.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-2xl text-xs ${
                    msg.role === 'user'
                      ? 'bg-sky-500/20 border border-sky-400/40 text-sky-100 ml-6 shadow-inner'
                      : 'bg-slate-900/85 border border-slate-700/80 text-slate-200 mr-4 shadow-md'
                  }`}
                >
                  <div className="font-bold text-[10px] uppercase mb-1 tracking-wider opacity-75">
                    {msg.role === 'user' ? '👤 You asked:' : '🐶 Nova:'}
                  </div>
                  <div>{renderFormattedMarkdown(msg.content)}</div>
                </div>
              ))}
            </div>
          )}

          {content ? (
            <div className="pt-1">
              {history && history.length > 0 && (
                <div className="font-bold text-[10px] uppercase mb-1 tracking-wider text-emerald-400">
                  🐶 Nova answering:
                </div>
              )}
              {renderFormattedMarkdown(content)}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-xs text-slate-400 animate-pulse">
              {history && history.length > 0 ? 'Nova is thinking...' : 'Nova is analyzing the text...'}
            </div>
          )}
        </div>

        {/* Mode Toggle & Follow-up Chat Form */}
        <div className="mt-3 pt-2.5 border-t border-slate-700/80">
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-[10px] text-slate-400">Response Mode:</span>
            <button
              type="button"
              onClick={() => setMode(mode === 'chat' ? 'explain' : 'chat')}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                mode === 'chat'
                  ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                  : 'bg-amber-500/20 border-amber-400 text-amber-300'
              }`}
            >
              {mode === 'chat' ? '💬 Friendly Bestie Chat' : '🧠 Deep Explain Mode'}
            </button>
          </div>

          <form onSubmit={handleSend} className="flex items-center space-x-2">
            <div className="relative flex-1 flex items-center">
              <MessageSquare className="w-3.5 h-3.5 text-sky-400 absolute left-2.5" />
              <input
                type="text"
                value={followUpText}
                onChange={handleInputChange}
                onFocus={() => onChatActiveChange?.(true)}
                onBlur={() => !followUpText.trim() && onChatActiveChange?.(false)}
                placeholder={mode === 'chat' ? 'Chat casually with Nova...' : 'Ask for technical breakdown...'}
                className="w-full pl-8 pr-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-400 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={!followUpText.trim()}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center space-x-1 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>Ask</span>
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>

        {/* Pinned Open Status Bar */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span className="flex items-center space-x-1.5 text-sky-400">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block animate-pulse"></span>
            <span>Explanation Pinned Open</span>
          </span>
          <span>Click X to close</span>
        </div>
      </div>

      {/* Connected Comic Thought Bubble Dots pointing LEFT to Dog Companion */}
      <div className="absolute -left-6 bottom-14 flex items-center space-x-1.5 pointer-events-none">
        <div className="w-2.5 h-2.5 rounded-full bg-slate-900/90 border border-amber-400/50 backdrop-blur-md" />
        <div className="w-4 h-4 rounded-full bg-slate-900/95 border-2 border-amber-400/70 backdrop-blur-md animate-pulse shadow-md" />
      </div>
    </div>
  )
}
