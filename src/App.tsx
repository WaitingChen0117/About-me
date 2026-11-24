import { useCallback, useEffect, useState } from 'react'
import { AvatarChat } from './components/AvatarChat'
import { SectionPanel } from './components/SectionPanel'
import type { SectionId } from './content/sections'
import { defaultSceneId, getScene } from './scenes/registry'
import type { SceneId, ThemeMode } from './scenes/types'
import './styles/global.css'

export default function App() {
  const [sceneId] = useState<SceneId>(defaultSceneId)
  const [theme, setTheme] = useState<ThemeMode>('duty')
  const [activeSection, setActiveSection] = useState<SectionId | null>(null)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [operatorTarget, setOperatorTarget] = useState<SectionId | null>(null)
  const [operatorTicket, setOperatorTicket] = useState(0)
  const [hintVisible, setHintVisible] = useState(true)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const scene = getScene(sceneId)
  const Scene = scene.Component

  const openSection = useCallback((id: SectionId) => {
    setHintVisible(false)
    setActiveSection(id)
  }, [])

  const sendOperator = useCallback((id: SectionId) => {
    setHintVisible(false)
    setOperatorTarget(id)
    setOperatorTicket((n) => n + 1)
  }, [])

  const onOperatorArrive = useCallback((id: SectionId) => {
    setActiveSection(id)
  }, [])

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand-block">
          <div className="brand-name">Waiting Chen</div>
          <div className="brand-tag">Frontend · Interactive products · Agent systems</div>
        </div>
        <div className="top-actions">
          <button
            type="button"
            className="chip-btn"
            aria-pressed={theme === 'bright'}
            onClick={() => setTheme((t) => (t === 'duty' ? 'bright' : 'duty'))}
          >
            <span className="chip-dot" aria-hidden="true" />
            {theme === 'duty' ? '值班灯' : '全亮模式'}
          </button>
          <button
            type="button"
            className="chip-btn"
            aria-pressed={avatarOpen}
            onClick={() => setAvatarOpen((v) => !v)}
          >
            AI 分身
          </button>
        </div>
      </header>

      <main className="scene-stage">
        <Scene
          theme={theme}
          activeSection={activeSection}
          onOpenSection={openSection}
          onSendOperator={sendOperator}
          avatarOpen={avatarOpen}
          onToggleAvatar={() => setAvatarOpen((v) => !v)}
          operatorTarget={operatorTarget}
          operatorTicket={operatorTicket}
          onOperatorArrive={onOperatorArrive}
        />
        {hintVisible ? (
          <div className="hint-toast">点击物件打开板块 · 点小人随机巡视 · 中央对话舱提问</div>
        ) : null}
      </main>

      {activeSection ? (
        <SectionPanel sectionId={activeSection} onClose={() => setActiveSection(null)} />
      ) : null}

      <AvatarChat
        open={avatarOpen}
        onClose={() => setAvatarOpen(false)}
        onOpenSection={openSection}
      />
    </div>
  )
}
