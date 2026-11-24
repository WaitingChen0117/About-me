import { useEffect, useRef, useState, type FormEvent } from 'react'
import { suggestionChips } from '../content/knowledge'
import { matchKnowledge } from '../lib/avatar-match'
import { isLlmEnabled } from '../lib/llm-optional'
import type { SectionId } from '../content/sections'
import './AvatarChat.css'

type Msg = {
  role: 'bot' | 'user'
  text: string
  openSection?: SectionId
  citation?: string
}

type Props = {
  open: boolean
  onClose: () => void
  onOpenSection: (id: SectionId) => void
}

const INTRO: Msg = {
  role: 'bot',
  text: '我是站内 AI 分身，检索本站离线知识层（关键词与意图匹配）。可点建议问题或自行提问；命中后可跳转对应板块。',
}

export function AvatarChat({ open, onClose, onOpenSection }: Props) {
  const [messages, setMessages] = useState<Msg[]>([INTRO])
  const [draft, setDraft] = useState('')
  const bodyRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => inputRef.current?.focus(), 180)
    return () => window.clearTimeout(t)
  }, [open])

  if (!open) return null

  const reply = (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return

    const matched = matchKnowledge(trimmed)
    const bot: Msg = {
      role: 'bot',
      text: matched.answer,
      openSection: matched.openSection,
      citation: matched.citation,
    }

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }, bot])
    setDraft('')

    if (matched.openSection) {
      window.setTimeout(() => onOpenSection(matched.openSection!), 450)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    reply(draft)
  }

  const modeLabel = isLlmEnabled() ? '知识层 · LLM 可选' : '站内知识层 · 离线'

  return (
    <section className="avatar-chat" role="dialog" aria-label="AI 分身对话">
      <header className="avatar-chat-header">
        <div>
          <h2>AI 分身</h2>
          <p>{modeLabel}</p>
        </div>
        <button type="button" className="section-panel-close" aria-label="关闭对话" onClick={onClose}>
          ×
        </button>
      </header>

      <div className="avatar-chat-body" ref={bodyRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role}`}>
            <p className="chat-bubble-text">{m.text}</p>
            {m.role === 'bot' && m.openSection && m.citation ? (
              <button
                type="button"
                className="chat-cite"
                onClick={() => onOpenSection(m.openSection!)}
              >
                打开「{m.citation}」
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <div className="avatar-presets" aria-label="建议问题">
        {suggestionChips.map((chip) => (
          <button type="button" key={chip.id} onClick={() => reply(chip.label)}>
            {chip.label}
          </button>
        ))}
      </div>

      <form className="avatar-compose" onSubmit={onSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="问问经历、作品、Agent…"
          aria-label="输入问题"
          autoComplete="off"
          maxLength={200}
        />
        <button type="submit" disabled={!draft.trim()}>
          发送
        </button>
      </form>
    </section>
  )
}
