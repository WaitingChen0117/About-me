import { Suspense, useCallback, useEffect, useState } from 'react'
import { AvatarChat } from './components/AvatarChat'
import { SectionPanel } from './components/SectionPanel'
import type { SectionId } from './content/sections'
import { defaultSceneId, getScene, switchableScenes } from './scenes/registry'
import type { SceneId, ThemeMode } from './scenes/types'
import './styles/global.css'

export default function App() {
  const [sceneId, setSceneId] = useState<SceneId>(defaultSceneId)
  const [theme, setTheme] = useState<ThemeMode>('duty')
  const [activeSection, setActiveSection] = useState<SectionId | null>(null)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [operatorTarget, setOperatorTarget] = useState<SectionId | null>(null)
  const [operatorTicket, setOperatorTicket] = useState(0)
  const [hintVisible, setHintVisible] = useState(true)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('data-scene', sceneId)
  }, [theme, sceneId])

  const scene = getScene(sceneId)
  const Scene = scene.Component
  const isCraft = sceneId === 'craft-lab'

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

  const switchScene = useCallback((id: SceneId) => {
    if (id === sceneId) return
    setSceneId(id)
    setOperatorTarget(null)
    setOperatorTicket(0)
    setHintVisible(true)
  }, [sceneId])

  return (
    <div className="app-shell" data-scene={sceneId}>
      <header className="top-bar">
        <div className="brand-block">
          <div className="brand-name">Waiting Chen</div>
          <div className="brand-tag">Senior Frontend · Product UI · Agent systems</div>
        </div>
        <div className="top-actions">
          <div className="scene-switch" role="group" aria-label="场景切换">
            {switchableScenes.map((s) => (
              <button
                key={s.id}
                type="button"
                className="chip-btn scene-chip"
                aria-pressed={sceneId === s.id}
                title={s.description}
                onClick={() => switchScene(s.id)}
              >
                {s.id === 'ops-deck' ? 'A · 指挥台' : 'B · 工坊'}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="chip-btn"
            aria-pressed={theme === 'bright'}
            onClick={() => setTheme((t) => (t === 'duty' ? 'bright' : 'duty'))}
          >
            <span className="chip-dot" aria-hidden="true" />
            {isCraft
              ? theme === 'duty'
                ? '工作室灯'
                : '日间顶光'
              : theme === 'duty'
                ? '值班灯'
                : '全亮模式'}
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
        <Suspense
          fallback={
            <div className="scene-loading">
              {isCraft ? '加载工坊…' : '加载指挥台…'}
            </div>
          }
        >
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
        </Suspense>
        {hintVisible ? (
          <div className="hint-toast">
            {isCraft
              ? '拖拽环视 · 点击工作台物件或图例打开板块 · 派遣助手 · 副屏提问'
              : '拖拽环视 · 点击物件或图例打开板块 · 派遣操作员 · 对话舱提问'}
          </div>
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
