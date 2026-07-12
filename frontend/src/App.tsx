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
  const [autoHideSeconds, setAutoHideSeconds] = useState<number>(20)
  const [model, setModel] = useState<string>('gemini/gemini-2.5-flash')
  const [apiKey, setApiKey] = useState<string>('')

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
    hidePet()
  }

  const handleSimulateTrigger = async () => {
    if (window.electronAPI) {
      await window.electronAPI.simulateHotkey()
    } else {
      setSelectedText('Quantum entanglement is a phenomenon that occurs when a group of particles interact such that the quantum state of each particle cannot be described independently.')
      showPet('confirm')
    }
  }

  const handlePetClick = () => {
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
          <PetCharacter
            state={petState}
            onClick={handlePetClick}
            onHoverEnter={resetTimer}
            onTestExplain={handleSimulateTrigger}
            onOpenSettings={() => setIsSettingsOpen(!isSettingsOpen)}
            onHide={handleCloseAndClear}
          />
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
