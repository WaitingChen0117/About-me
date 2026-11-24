import { useEffect, useRef, useState } from 'react'
import { avatarPresets } from '../content/avatar-qa'
import type { SectionId } from '../content/sections'
import './AvatarChat.css'

type Msg = { role: 'bot' | 'user'; text: string }

type Props = {
  open: boolean
  onClose: () => void
  onOpenSection: (id: SectionId) => void
}

const INTRO: Msg = {
  role: 'bot',
  text: '你好。我是站内 AI 分身（预设问答，非联网模型）。点下面的问题，或去点场景里的物件。',
}

export function AvatarChat({ open, onClose, onOpenSection }: Props) {
  const [messages, setMessages] = useState<Msg[]>([INTRO])
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  if (!open) return null

  const ask = (presetId: string) => {
    const preset = avatarPresets.find((p) => p.id === presetId)
    if (!preset) return
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: preset.question },
      { role: 'bot', text: preset.answer },
    ])
    if (preset.openSection) {
      window.setTimeout(() => onOpenSection(preset.openSection!), 450)
    }
  }

  return (
    <section className="avatar-chat" role="dialog" aria-label="AI 分身对话">
      <header className="avatar-chat-header">
        <div>
          <h2>AI 分身</h2>
          <p>Preset Q&A · Ops Deck</p>
        </div>
        <button type="button" className="section-panel-close" aria-label="关闭对话" onClick={onClose}>
          ×
        </button>
      </header>
      <div className="avatar-chat-body" ref={bodyRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role}`}>
            {m.text}
          </div>
        ))}
      </div>
      <div className="avatar-presets">
        {avatarPresets.map((p) => (
          <button type="button" key={p.id} onClick={() => ask(p.id)}>
            {p.question}
          </button>
        ))}
      </div>
    </section>
  )
}
