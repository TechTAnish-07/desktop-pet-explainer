import React, { useState, useEffect, useRef } from 'react'
import { PetState } from '../hooks/usePetVisibility'
import { Sparkles, Settings, EyeOff, MessageCircleHeart } from 'lucide-react'

interface PetCharacterProps {
  state: PetState
  onHoverEnter?: () => void
  onHoverLeave?: () => void
  onClick?: () => void
  onStartChat?: () => void
  onTestExplain?: () => void
  onOpenSettings?: () => void
  onHide?: () => void
}

export const PetCharacter: React.FC<PetCharacterProps> = ({
  state,
  onHoverEnter,
  onHoverLeave,
  onClick,
  onStartChat,
  onTestExplain,
  onOpenSettings,
  onHide,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [jumpOffset, setJumpOffset] = useState<number>(0)
  const [facingRight, setFacingRight] = useState<boolean>(true)

  const isDraggingRef = useRef(false)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const totalMovedRef = useRef(0)

  // Periodic playful jumping & roaming animation when idle or sleeping
  useEffect(() => {
    const interval = setInterval(() => {
      // Playful jump or turn left/right
      if (Math.random() > 0.25) {
        setJumpOffset(-22)
        setTimeout(() => setJumpOffset(0), 280)
        setTimeout(() => {
          setJumpOffset(-12)
          setTimeout(() => setJumpOffset(0), 240)
        }, 320)
        if (Math.random() > 0.45) {
          setFacingRight((prev) => !prev)
        }
      }
    }, 2400)

    return () => clearInterval(interval)
  }, [state])

  const handleMouseEnter = () => {
    setIsHovered(true)
    window.electronAPI?.setIgnoreMouseEvents(false)
    onHoverEnter?.()
  }

  const handleMouseLeave = () => {
    if (!isDraggingRef.current) {
      setIsHovered(false)
      window.electronAPI?.setIgnoreMouseEvents(true)
      onHoverLeave?.()
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    isDraggingRef.current = true
    totalMovedRef.current = 0
    dragStartRef.current = { x: e.screenX, y: e.screenY }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !dragStartRef.current) return
      const dx = moveEvent.screenX - dragStartRef.current.x
      const dy = moveEvent.screenY - dragStartRef.current.y
      totalMovedRef.current += Math.abs(dx) + Math.abs(dy)
      dragStartRef.current = { x: moveEvent.screenX, y: moveEvent.screenY }
      window.electronAPI?.moveWindowBy(dx, dy)
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
      dragStartRef.current = null
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)

      if (totalMovedRef.current < 4) {
        onClick?.()
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const isThinking = state === 'thinking'
  const isTalking = state === 'talking'
  const isSleeping = state === 'sleeping'
  const isConfirm = state === 'confirm'

  return (
    <div
      className="relative flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none transition-all duration-300"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      style={{
        transform: `translateY(${jumpOffset}px) scaleX(${facingRight ? 1 : -1})`,
      }}
    >
      {/* Floating Collar Menu Buttons (Visible on Hover OR when dog is clicked/active) */}
      <div
        className={`absolute -top-11 flex items-center space-x-2 transition-all duration-300 ${
          isHovered ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-90 pointer-events-none'
        }`}
        style={{ transform: `scaleX(${facingRight ? 1 : -1})` }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            onStartChat?.()
          }}
          className="flex items-center space-x-1 px-3 py-1 rounded-full bg-sky-500/90 hover:bg-sky-400 text-slate-950 text-xs font-extrabold shadow-lg transition-transform active:scale-95 cursor-pointer"
          title="Start Friendly Talk with Nova Pup"
        >
          <MessageCircleHeart className="w-3.5 h-3.5" />
          <span>Chat</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onTestExplain?.()
          }}
          className="flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-500/90 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-lg transition-transform active:scale-95 cursor-pointer"
          title="Test / Explain Sample"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Test</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onOpenSettings?.()
          }}
          className="p-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-amber-400/50 shadow-lg transition-transform active:scale-95"
          title="Dog Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onHide?.()
          }}
          className="p-1.5 rounded-full bg-slate-900/90 hover:bg-red-500/80 text-slate-400 hover:text-white border border-slate-700 shadow-lg transition-transform active:scale-95"
          title="Sleep / Hide Dog"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Dog Collar Status Pill */}
      <div
        className="absolute -top-4 px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-amber-400/60 backdrop-blur-md text-[10px] font-bold text-amber-300 tracking-wide uppercase shadow-md flex items-center space-x-1"
        style={{ transform: `scaleX(${facingRight ? 1 : -1})` }}
      >
        <MessageCircleHeart className="w-3 h-3 text-amber-400 animate-bounce" />
        <span>
          {isThinking
            ? 'Thinking...'
            : isTalking
            ? 'Woof! Explaining!'
            : isConfirm
            ? 'Explain?'
            : isSleeping
            ? 'Zzz...'
            : 'Nova Pup'}
        </span>
      </div>

      {/* Cartoon Puppy Dog SVG Character */}
      <div className="w-28 h-28 relative flex items-center justify-center">
        {/* Soft Ambient Ground Shadow */}
        <div className="absolute bottom-1 w-20 h-3 bg-black/40 rounded-full blur-sm transform scale-x-110" />

        <svg
          viewBox="0 0 140 140"
          className="w-full h-full drop-shadow-xl overflow-visible"
        >
          {/* WAGGING TAIL */}
          <g className="origin-bottom-left animate-wag">
            <path
              d="M 32 95 Q 12 75 22 55 Q 28 58 35 78 Z"
              fill="#D97706"
              stroke="#B45309"
              strokeWidth="2.5"
            />
          </g>

          {/* DOG BODY */}
          <ellipse
            cx="70"
            cy="92"
            rx="34"
            ry="26"
            fill="#F59E0B"
            stroke="#B45309"
            strokeWidth="3"
          />
          {/* Belly Patch */}
          <ellipse cx="74" cy="95" rx="20" ry="15" fill="#FEF3C7" />

          {/* PAWS */}
          {/* Back Left Paw */}
          <ellipse cx="44" cy="113" rx="10" ry="6" fill="#D97706" stroke="#B45309" strokeWidth="2" />
          {/* Back Right Paw */}
          <ellipse cx="94" cy="113" rx="10" ry="6" fill="#D97706" stroke="#B45309" strokeWidth="2" />
          {/* Front Left Paw */}
          <ellipse cx="56" cy="115" rx="8" ry="5" fill="#FEF3C7" stroke="#B45309" strokeWidth="2" />
          {/* Front Right Paw */}
          <ellipse cx="82" cy="115" rx="8" ry="5" fill="#FEF3C7" stroke="#B45309" strokeWidth="2" />

          {/* COLLAR & GOLDEN TAG */}
          <path d="M 45 74 Q 70 86 95 74" stroke="#EF4444" strokeWidth="6" strokeLinecap="round" />
          <circle cx="70" cy="80" r="5" fill="#FBBF24" stroke="#B45309" strokeWidth="1.5" />

          {/* DOG HEAD */}
          <g className={isThinking ? 'animate-bounce' : ''}>
            {/* Left Floppy Ear */}
            <path
              d="M 38 42 Q 18 52 24 76 Q 34 78 44 58 Z"
              fill="#B45309"
              stroke="#78350F"
              strokeWidth="2.5"
            />
            {/* Right Floppy Ear */}
            <path
              d="M 102 42 Q 122 52 116 76 Q 106 78 96 58 Z"
              fill="#B45309"
              stroke="#78350F"
              strokeWidth="2.5"
            />

            {/* Main Head Shape */}
            <circle
              cx="70"
              cy="52"
              r="28"
              fill="#F59E0B"
              stroke="#B45309"
              strokeWidth="3"
            />

            {/* Cute White Muzzle Patch */}
            <ellipse cx="70" cy="62" rx="16" ry="11" fill="#FEF3C7" />

            {/* Cute Black Dog Nose */}
            <ellipse cx="70" cy="57" rx="5.5" ry="4" fill="#1E293B" />
            <ellipse cx="68.5" cy="55.5" rx="1.5" ry="1" fill="#FFFFFF" />

            {/* EYES */}
            {isSleeping ? (
              <>
                {/* Sleeping Closed Eye Curves */}
                <path d="M 54 48 Q 59 52 62 48" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <path d="M 78 48 Q 81 52 86 48" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </>
            ) : (
              <>
                {/* Left Eye */}
                <circle cx="58" cy="47" r="4.5" fill="#1E293B" />
                <circle cx="56.5" cy="45.5" r="1.5" fill="#FFFFFF" />

                {/* Right Eye */}
                <circle cx="82" cy="47" r="4.5" fill="#1E293B" />
                <circle cx="80.5" cy="45.5" r="1.5" fill="#FFFFFF" />

                {/* Cute Cheeks */}
                <ellipse cx="50" cy="55" rx="4" ry="2.5" fill="#F87171" opacity="0.6" />
                <ellipse cx="90" cy="55" rx="4" ry="2.5" fill="#F87171" opacity="0.6" />
              </>
            )}

            {/* MOUTH / SMILE */}
            {isTalking ? (
              <path
                d="M 64 64 Q 70 71 76 64"
                stroke="#B45309"
                strokeWidth="2.5"
                fill="#F87171"
              />
            ) : (
              <path
                d="M 64 63 Q 70 68 76 63"
                stroke="#B45309"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
            )}
          </g>

          {/* Sleeping Floating Zzz Bubbles */}
          {isSleeping && (
            <g className="animate-float text-amber-300 font-bold">
              <text x="105" y="30" fontSize="14" fill="#FBBF24">Z</text>
              <text x="115" y="18" fontSize="10" fill="#FDE68A">z</text>
            </g>
          )}
        </svg>
      </div>

      {/* Helper Pill Badge on Hover */}
      <div
        className={`absolute -bottom-6 px-3 py-1 rounded-full bg-slate-900/90 border border-amber-400/60 text-amber-300 font-bold text-[10px] tracking-wide shadow-xl transition-all duration-300 pointer-events-none ${
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
        }`}
      >
        Drag Me Anywhere • Click to Explain
      </div>
    </div>
  )
}
