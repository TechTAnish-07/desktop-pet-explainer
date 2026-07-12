import React, { useState, useEffect } from 'react'
import { PetCharacter } from './components/PetCharacter'
import { ConfirmBubble } from './components/ConfirmBubble'
import { ThoughtCloud } from './components/ThoughtCloud'
import { SettingsPanel } from './components/SettingsPanel'
import { usePetVisibility } from './hooks/usePetVisibility'
import { useExplanationStream } from './hooks/useExplanationStream'
import { Settings, Sparkles, EyeOff } from 'lucide-react'

export function App() {
  const [selectedText, setSelectedText] = useState<string>('')
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false)
  const [autoHideSeconds, setAutoHideSeconds] = useState<number>(300)
  const [model, setModel] = useState<string>('gemini/gemini-2.5-flash')
  const [apiKey, setApiKey] = useState<string>('')
  const [showWelcome, setShowWelcome] = useState<boolean>(true)

  const {
    petState,
    setPetState,
    remainingSeconds,
    isChatActive,
    setChatActive,
    setExplanationOpen,
    showPet,
    hidePet,
    resetTimer,
    setStreamingStatus,
  } = usePetVisibility({ autoHideSeconds })

  const { explanation, isStreaming, startStream, clearExplanation } = useExplanationStream()

  // Load initial settings
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getSettings().then((settings) => {
        if (settings) {
          setAutoHideSeconds(settings.autoHideSeconds || 20)
          setModel(settings.model || 'gemini/gemini-2.5-flash')
          setApiKey(settings.apiKey || '')
        }
      })
    }
  }, [isSettingsOpen])

  // Listen for hotkey triggers from Electron main process
  useEffect(() => {
    if (!window.electronAPI) return

    const unsubscribe = window.electronAPI.onTriggerExplain((clipboardText) => {
      setSelectedText(clipboardText || 'No text selected.')
      showPet('confirm')
    })

    return () => unsubscribe()
  }, [showPet])

  // Update streaming status in visibility hook
  useEffect(() => {
    setStreamingStatus(isStreaming)
    if (isStreaming) {
      setPetState('talking')
    }
  }, [isStreaming, setStreamingStatus, setPetState])

  const handleConfirmExplain = () => {
    setPetState('thinking')
    setExplanationOpen(true)
    startStream({
      text: selectedText,
      model,
      apiKey,
      onStart: () => {
        setPetState('thinking')
      },
      onChunk: () => {
        setPetState('talking')
      },
      onFinish: () => {
        setPetState('idle')
        // Do not reset timer — keep explanation pinned open until user closes!
      },
      onError: () => {
        setPetState('idle')
      },
    })
  }

  const handleCloseAndClear = () => {
    setSelectedText('')
    clearExplanation()
    setExplanationOpen(false)
    setShowWelcome(false)
    hidePet()
  }

  const handleSimulateTrigger = async () => {
    setShowWelcome(false)
    if (window.electronAPI) {
      await window.electronAPI.simulateHotkey()
    } else {
      setSelectedText('Quantum entanglement is a phenomenon that occurs when a group of particles interact such that the quantum state of each particle cannot be described independently.')
      showPet('confirm')
    }
  }

  const handleStartChat = () => {
    setShowWelcome(false)
    setSelectedText('')
    setPetState('talking')
    setExplanationOpen(true)
    startStream({
      text: "Woof! 🐾 Hey buddy! I'm right here with you! What's on your mind today? Let's chat!",
      model,
      apiKey,
      onStart: () => setPetState('talking'),
      onChunk: () => setPetState('talking'),
      onFinish: () => setPetState('idle'),
      onError: () => setPetState('idle'),
    })
    setChatActive(true)
  }

  const handlePetClick = () => {
    setShowWelcome(false)
    if (petState === 'hidden' || petState === 'idle' || petState === 'sleeping') {
      window.electronAPI?.readClipboardText().then((txt) => {
        setSelectedText(txt || 'Select text anywhere on your PC and press Cmd+Shift+E to explain!')
        showPet('confirm')
      })
    }
  }

  const handleSendFollowUp = (question: string) => {
    setPetState('thinking')
    setExplanationOpen(true)
    startStream({
      text: `Follow-up question regarding previous explanation:\nQuestion: ${question}\nOriginal context: ${selectedText}`,
      model,
      apiKey,
      onStart: () => setPetState('thinking'),
      onChunk: () => setPetState('talking'),
      onFinish: () => {
        setPetState('idle')
      },
      onError: () => {
        setPetState('idle')
      },
    })
  }

  const handleMouseDownDrag = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    let lastX = e.screenX
    let lastY = e.screenY

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.screenX - lastX
      const dy = moveEvent.screenY - lastY
      lastX = moveEvent.screenX
      lastY = moveEvent.screenY
      window.electronAPI?.moveWindowBy(dx, dy)
    }

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div className="w-screen h-screen flex items-end justify-center p-6 overflow-hidden select-none">
      {/* 3-Column Horizontal Companion Grid */}
      <div className="flex items-end justify-center space-x-4 w-full max-w-5xl">
        {/* LEFT COLUMN: Settings & Other Features */}
        <div className="w-80 flex flex-col items-end justify-end pb-3 z-20">
          {isSettingsOpen && (
            <SettingsPanel
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
              onSettingsSaved={() => {}}
            />
          )}
        </div>

        {/* CENTER COLUMN: Nova the Cartoon Puppy Dog Companion (Anchor) */}
        <div className="flex flex-col items-center justify-end z-30 pb-2">
          {/* Welcome Back Friendly Comic Bubble on Launch */}
          {showWelcome && petState === 'idle' && !explanation && (
            <div
              className="relative mb-3 px-5 py-3.5 rounded-3xl bg-slate-900/95 border-2 border-amber-400 text-amber-200 text-xs font-semibold shadow-2xl max-w-xs text-center animate-bounce"
              onMouseEnter={() => window.electronAPI?.setIgnoreMouseEvents(false)}
              onMouseLeave={() => window.electronAPI?.setIgnoreMouseEvents(true)}
            >
              <p className="leading-relaxed">
                Woof! Welcome back, my best friend! 🐾 I&apos;m so happy to see you! Highlight anything on your screen & press <span className="font-bold text-amber-300">Cmd+Shift+E</span> to explore together!
              </p>
              <button
                onClick={() => setShowWelcome(false)}
                className="mt-2.5 px-3.5 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[10px] shadow transition-transform active:scale-95 cursor-pointer"
              >
                Let&apos;s explore, buddy! 🚀
              </button>
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[9px] border-t-amber-400" />
            </div>
          )}

          {petState !== 'hidden' ? (
            <PetCharacter
              state={petState}
              onClick={handlePetClick}
              onHoverEnter={resetTimer}
              onStartChat={handleStartChat}
              onTestExplain={handleSimulateTrigger}
              onOpenSettings={() => setIsSettingsOpen(!isSettingsOpen)}
              onHide={handleCloseAndClear}
            />
          ) : (
            <button
              onClick={() => showPet('idle')}
              onMouseEnter={() => window.electronAPI?.setIgnoreMouseEvents(false)}
              onMouseLeave={() => window.electronAPI?.setIgnoreMouseEvents(true)}
              className="px-4 py-2 rounded-full bg-slate-900/95 hover:bg-slate-800 border-2 border-amber-400 text-amber-300 font-extrabold text-xs shadow-2xl flex items-center space-x-2 animate-bounce transition-all cursor-pointer"
            >
              <span>🐶 Summon Nova Pup</span>
              <span className="text-[10px] text-slate-400 font-normal">Cmd+Shift+E</span>
            </button>
          )}
        </div>

        {/* RIGHT COLUMN: Comic Thought Cloud Explanation & Confirm Bubble */}
        <div className="w-80 flex flex-col items-start justify-end pb-3 z-20">
          {petState === 'confirm' && (
            <ConfirmBubble
              selectedText={selectedText}
              onTextChange={setSelectedText}
              onConfirm={handleConfirmExplain}
              onCancel={handleCloseAndClear}
            />
          )}

          {(petState === 'thinking' || petState === 'talking' || (explanation && petState !== 'sleeping')) && petState !== 'confirm' && petState !== 'hidden' && (
            <ThoughtCloud
              content={explanation}
              isStreaming={isStreaming}
              remainingSeconds={remainingSeconds}
              autoHideSeconds={autoHideSeconds}
              isChatActive={isChatActive}
              onChatActiveChange={setChatActive}
              onSendFollowUp={handleSendFollowUp}
              onClose={handleCloseAndClear}
            />
          )}
        </div>
      </div>
    </div>
  )
}
