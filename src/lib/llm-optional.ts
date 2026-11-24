/**
 * Optional remote LLM hook — OFF by default.
 *
 * To experiment later (not required for M4):
 *   VITE_LLM_ENDPOINT=https://api.example.com/v1/chat/completions
 *   VITE_LLM_API_KEY=...          // prefer proxy; avoid shipping keys in Pages
 *   VITE_LLM_MODEL=gpt-4o-mini
 *
 * The site must keep working with these unset. Privacy: never send private
 * identity fields; only public section knowledge may be used as context.
 */

export type LlmMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export type LlmReply = {
  text: string
  /** When the model suggests opening a section — still validated by caller. */
  openSectionHint?: string
}

const endpoint = import.meta.env.VITE_LLM_ENDPOINT as string | undefined
const apiKey = import.meta.env.VITE_LLM_API_KEY as string | undefined
const model = (import.meta.env.VITE_LLM_MODEL as string | undefined) || 'gpt-4o-mini'

/** True only when an endpoint is configured. Default: false (offline). */
export function isLlmEnabled(): boolean {
  return Boolean(endpoint && endpoint.trim())
}

/**
 * Call a chat-completions-compatible endpoint.
 * Returns null when disabled, misconfigured, or on any network/API failure
 * so the offline knowledge matcher remains the source of truth.
 */
export async function tryLlmReply(
  messages: LlmMessage[],
  signal?: AbortSignal,
): Promise<LlmReply | null> {
  if (!isLlmEnabled() || !endpoint) return null

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.4,
      }),
      signal,
    })

    if (!res.ok) return null
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const text = data.choices?.[0]?.message?.content?.trim()
    if (!text) return null
    return { text }
  } catch {
    return null
  }
}

/* --- Interface sketch for a future wiring (kept as documentation) ---
 *
 * async function answerWithOptionalLlm(query: string, knowledgeContext: string) {
 *   const offline = matchKnowledge(query)
 *   if (!isLlmEnabled()) return offline
 *   const llm = await tryLlmReply([
 *     { role: 'system', content: `你是站内分身。只依据下列公开知识作答，勿编造隐私。\n${knowledgeContext}` },
 *     { role: 'user', content: query },
 *   ])
 *   return llm ? { ...offline, answer: llm.text } : offline
 * }
 */
