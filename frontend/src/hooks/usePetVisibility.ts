import { useState, useEffect, useRef, useCallback } from 'react'

export type PetState = 'idle' | 'confirm' | 'thinking' | 'talking' | 'sleeping' | 'hidden'

interface UsePetVisibilityProps {
  autoHideSeconds: number
}

export function usePetVisibility({ autoHideSeconds }: UsePetVisibilityProps) {
  const [petState, setPetState] = useState<PetState>('idle')
  const [remainingSeconds, setRemainingSeconds] = useState<number>(autoHideSeconds)
  const [isChatActive, setIsChatActiveState] = useState<boolean>(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isStreamingRef = useRef<boolean>(false)
  const isChatActiveRef = useRef<boolean>(false)
  const isExplanationOpenRef = useRef<boolean>(false)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const resetTimer = useCallback(() => {
    clearTimer()
    setRemainingSeconds(autoHideSeconds)

    // Do not tick down if currently streaming explanation, or explanation is open, OR if user is chatting/has input text
    if (isStreamingRef.current || isChatActiveRef.current || isExplanationOpenRef.current) return

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearTimer()
          setPetState('sleeping')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [autoHideSeconds, clearTimer])

  const showPet = useCallback((nextState: PetState = 'confirm') => {
    setPetState(nextState)
    resetTimer()
  }, [resetTimer])

  const hidePet = useCallback(() => {
    isExplanationOpenRef.current = false
    clearTimer()
    setPetState('sleeping')
  }, [clearTimer])

  const setStreamingStatus = useCallback((streaming: boolean) => {
    isStreamingRef.current = streaming
    isExplanationOpenRef.current = true
    if (streaming) {
      clearTimer()
    } else {
      clearTimer() // Keep timer cleared while explanation is shown
    }
  }, [clearTimer])

  const setChatActive = useCallback((active: boolean) => {
    isChatActiveRef.current = active
    setIsChatActiveState(active)
    if (active) {
      clearTimer()
    } else {
      resetTimer()
    }
  }, [clearTimer, resetTimer])

  const setExplanationOpen = useCallback((open: boolean) => {
    isExplanationOpenRef.current = open
    if (open) {
      clearTimer()
    } else {
      resetTimer()
    }
  }, [clearTimer, resetTimer])

  useEffect(() => {
    return () => clearTimer()
  }, [clearTimer])

  return {
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
  }
}
