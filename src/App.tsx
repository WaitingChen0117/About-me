import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { AvatarChat } from './components/AvatarChat'
import { SectionPanel } from './components/SectionPanel'
import type { SectionId } from './content/sections'
import { defaultSceneId, getScene, switchableScenes } from './scenes/registry'
import type { CameraCommand, SceneId, ThemeMode } from './scenes/types'
import './styles/global.css'

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return reduced
}

export default function App() {
  const [sceneId, setSceneId] = useState<SceneId>(defaultSceneId)
  const [theme, setTheme] = useState<ThemeMode>('duty')
  const [activeSection, setActiveSection] = useState<SectionId | null>(null)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [operatorTarget, setOperatorTarget] = useState<SectionId | null>(null)
  const [operatorTicket, setOperatorTicket] = useState(0)
  const [hintVisible, setHintVisible] = useState(true)
  const [focusId, setFocusId] = useState<SectionId | null>(null)
  const [cameraCommand, setCameraCommand] = useState<CameraCommand>({
    ticket: 0,
    focusId: null,
  })
  const pendingOpen = useRef<SectionId | null>(null)
  const focusing = useRef(false)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('data-scene', sceneId)
  }, [theme, sceneId])

  const scene = getScene(sceneId)
  const Scene = scene.Component
  const isCraft = sceneId === 'craft-lab'

  const issueCamera = useCallback((nextFocus: SectionId | null) => {
    setCameraCommand((c) => ({ ticket: c.ticket + 1, focusId: nextFocus }))
  }, [])

  /** Unified entry: legend / rail / 3D / labels / avatar cite → focus then panel. */
  const focusThenOpen = useCallback(
    (id: SectionId) => {
      setHintVisible(false)
      if (activeSection === id && focusId === id) return

      if (reducedMotion) {
        pendingOpen.current = null
        focusing.current = false
        setFocusId(id)
        setActiveSection(id)
        issueCamera(id)
        return
      }

      pendingOpen.current = id
      focusing.current = true
      setFocusId(id)
      // Keep existing panel closed until arrive (switch target mid-flight ok)
      if (activeSection && activeSection !== id) {
        setActiveSection(null)
      }
      issueCamera(id)
    },
    [activeSection, focusId, issueCamera, reducedMotion],
  )

  const onCameraArrive = useCallback(() => {
    if (!focusing.current && !pendingOpen.current) return
    const id = pendingOpen.current
    pendingOpen.current = null
    focusing.current = false
    if (id) setActiveSection(id)
  }, [])

  const cameraHome = useCallback(() => {
    pendingOpen.current = null
    focusing.current = false
    setFocusId(null)
    issueCamera(null)
  }, [issueCamera])

  const closeSection = useCallback(() => {
    setActiveSection(null)
    cameraHome()
  }, [cameraHome])

  // Esc while focusing (before panel) cancels fly + homes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (activeSection) return // SectionPanel owns Esc when open
      if (focusId || focusing.current) {
        e.preventDefault()
        cameraHome()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeSection, focusId, cameraHome])

  /** Immediate open — only for paths that already completed focus (legacy alias). */
  const openSection = useCallback(
    (id: SectionId) => {
      focusThenOpen(id)
    },
    [focusThenOpen],
  )

  const sendOperator = useCallback((id: SectionId) => {
    setHintVisible(false)
    setOperatorTarget(id)
    setOperatorTicket((n) => n + 1)
  }, [])

  const onOperatorArrive = useCallback(
    (id: SectionId) => {
      focusThenOpen(id)
    },
    [focusThenOpen],
  )

  const switchScene = useCallback(
    (id: SceneId) => {
      if (id === sceneId) return
      setSceneId(id)
      setOperatorTarget(null)
      setOperatorTicket(0)
      setHintVisible(true)
      setActiveSection(null)
      setAvatarOpen(false)
      pendingOpen.current = null
      focusing.current = false
      setFocusId(null)
      setCameraCommand({ ticket: 0, focusId: null })
    },
    [sceneId],
  )

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
                {s.id === 'ops-deck' ? 'A · 工作室' : 'B · 工坊'}
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
                ? '夜间模式'
                : '日间暖光'}
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
              {isCraft ? '加载工坊…' : '加载工作室…'}
            </div>
          }
        >
          <Scene
            theme={theme}
            activeSection={activeSection}
            onOpenSection={openSection}
            onFocusThenOpen={focusThenOpen}
            onSendOperator={sendOperator}
            avatarOpen={avatarOpen}
            onToggleAvatar={() => setAvatarOpen((v) => !v)}
            operatorTarget={operatorTarget}
            operatorTicket={operatorTicket}
            onOperatorArrive={onOperatorArrive}
            focusId={focusId}
            cameraCommand={cameraCommand}
            onCameraArrive={onCameraArrive}
            labelsAway={Boolean(activeSection)}
          />
        </Suspense>
        {hintVisible ? (
          <div className="hint-toast">
            {isCraft
              ? '拖拽环视 · 点物件或铭牌开板块 · 派遣助手 · 副屏提问'
              : '拖拽环视 · 点物件或铭牌开板块 · 派遣助手 · 桌面分身提问'}
          </div>
        ) : null}
      </main>

      {activeSection ? (
        <SectionPanel sectionId={activeSection} onClose={closeSection} />
      ) : null}

      <AvatarChat
        open={avatarOpen}
        onClose={() => setAvatarOpen(false)}
        onOpenSection={focusThenOpen}
      />
    </div>
  )
}
