import { useState, useCallback } from 'react'

export interface ExplanationStreamOptions {
  text: string
  model?: string
  apiKey?: string
  endpoint?: 'explain' | 'chat'
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
    endpoint = 'explain',
    onStart,
    onChunk,
    onFinish,
    onError,
  }: ExplanationStreamOptions) => {
    setIsStreaming(true)
    setExplanation('')
    onStart?.()

    let fullOutput = ''
    try {
      const backendUrl = `http://127.0.0.1:8000/${endpoint}`
      const payload = endpoint === 'chat'
        ? { message: text, model, api_key: apiKey }
        : { text, model, api_key: apiKey }

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok || !response.body) {
        throw new Error(`Backend sidecar returned HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const payloadStr = line.slice(6).trim()
            if (payloadStr === '[DONE]') {
              break
            }
            try {
              const parsed = JSON.parse(payloadStr)
              if (parsed.chunk) {
                fullOutput += parsed.chunk
                setExplanation((prev) => {
                  const updated = prev + parsed.chunk
                  onChunk?.(parsed.chunk)
                  return updated
                })
              }
            } catch (e) {
              // ignore partial line JSON parse errors
            }
          }
        }
      }
    } catch (err) {
      console.warn(`[Stream] Could not connect to live Python sidecar backend (${err}), switching to local simulation:`, err)
      await streamHardcodedExplanation(text, (chunk) => {
        fullOutput += chunk
        setExplanation((prev) => {
          const updated = prev + chunk
          onChunk?.(chunk)
          return updated
        })
      })
    }

    setIsStreaming(false)
    onFinish?.(fullOutput)
  }, [])

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
