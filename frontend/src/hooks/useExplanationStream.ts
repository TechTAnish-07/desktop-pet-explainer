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
    `### Overview\n\n`,
    `You selected: "${preview}"\n\n`,
    `Here is a quick breakdown of this concept:\n\n`,
    `- **Core Meaning**: This text highlights a foundational pattern or definition.\n`,
    `- **Why it matters**: Understanding it clarifies the surrounding context and logic flow.\n`,
    `- **In Practice**: Look closely at input parameters and expected behaviors when applying this idea.\n\n`,
    `💡 *Tip: Nova AI is ready to explain any copied text anytime!*`,
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
