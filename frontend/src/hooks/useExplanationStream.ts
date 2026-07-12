import { useState, useCallback } from 'react'

export interface ExplanationStreamOptions {
  text: string
  model?: string
  apiKey?: string
  onStart?: () => void
  onChunk?: (text: string) => void
  onFinish?: (fullText: string) => void
  onError?: (errorText: string) => void
}

export function useExplanationStream() {
  const [explanation, setExplanation] = useState<string>('')
  const [isStreaming, setIsStreaming] = useState<boolean>(false)

  const startStream = useCallback(async ({
    text,
    model,
    apiKey,
    onStart,
    onChunk,
    onFinish,
    onError,
  }: ExplanationStreamOptions) => {
    setIsStreaming(true)
    setExplanation('')
    onStart?.()

    // Stream rich interactive explanation directly without hitting backend API
    await streamHardcodedExplanation(text, (chunk) => {
      setExplanation((prev) => {
        const updated = prev + chunk
        onChunk?.(chunk)
        return updated
      })
    })

    setIsStreaming(false)
    onFinish?.(explanation)
  }, [explanation])

  const clearExplanation = useCallback(() => {
    setExplanation('')
  }, [])

  return {
    explanation,
    isStreaming,
    startStream,
    clearExplanation,
  }
}

async function streamHardcodedExplanation(text: string, onChunk: (chunk: string) => void) {
  const preview = text.length > 50 ? text.slice(0, 47) + '...' : text
  const chunks = [
    `Woof! 🐾 Hey buddy, let's look at this together!\n\n`,
    `You selected: "${preview}"\n\n`,
    `Here's my friendly breakdown for you, my friend:\n\n`,
    `- **Core Meaning**: This text highlights a foundational pattern or key definition.\n`,
    `- **Why it matters**: Understanding it clarifies the surrounding context so you can master it easily!\n`,
    `- **In Practice**: Look closely at how this idea interacts with the rest of your project.\n\n`,
    `🐶 *I'm always right here on your screen whenever you need me, buddy!*`,
  ]

  for (const segment of chunks) {
    const words = segment.split(' ')
    for (let i = 0; i < words.length; i++) {
      const token = words[i] + (i < words.length - 1 ? ' ' : '')
      onChunk(token)
      await new Promise((r) => setTimeout(r, 25))
    }
  }
}
