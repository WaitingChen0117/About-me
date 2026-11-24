import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { SECTION_ORDER, type SectionId } from '../../content/sections'
import type { SceneProps } from '../types'
import { DeckWorld } from './DeckWorld'
import { opsDeckHotspots } from './hotspots'
import './OpsDeck.css'

const SECTION_TITLES: Record<SectionId, string> = {
  about: '关于我',
  experience: '经历',
  works: '作品',
  projects: '项目',
  articles: '文章',
  hobbies: '爱好',
  contact: '联系',
}

function useLowPower(): boolean {
  const [low, setLow] = useState(() => {
    if (typeof window === 'undefined') return false
    return (
      window.matchMedia('(max-width: 720px)').matches ||
      window.matchMedia('(pointer: coarse)').matches ||
      (typeof navigator !== 'undefined' && navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4)
    )
  })

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px), (pointer: coarse)')
    const sync = () => setLow(mq.matches || (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4))
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return low
}

export function OpsDeckScene({
  theme,
  activeSection,
  onOpenSection,
  onSendOperator,
  avatarOpen,
  onToggleAvatar,
  operatorTarget,
  operatorTicket,
  onOperatorArrive,
}: SceneProps) {
  const lowPower = useLowPower()
  const dpr = useMemo<[number, number]>(
    () => (lowPower ? [1, 1.25] : [1, 1.75]),
    [lowPower],
  )

  return (
    <div className="ops-deck" data-theme-mode={theme} data-low-power={lowPower ? 'true' : 'false'}>
      <div className="ops-hud-rail" aria-hidden="true">
        <div>
          Scene <strong>A · Ops Deck · 3D</strong>
        </div>
        <div className="ops-status-lights">
          <span />
          <span />
          <span />
        </div>
        <div>
          Mode <strong>{theme === 'duty' ? 'Duty' : 'Bright'}</strong>
          {lowPower ? ' · Lite' : ''}
        </div>
      </div>

      <div className="ops-canvas-wrap">
        <Canvas
          shadows={!lowPower}
          dpr={dpr}
          camera={{ position: [2.8, 5.2, 7.6], fov: 40, near: 0.1, far: 60 }}
          gl={{
            antialias: !lowPower,
            powerPreference: lowPower ? 'low-power' : 'high-performance',
            alpha: false,
          }}
        >
          <Suspense fallback={null}>
            <DeckWorld
              theme={theme}
              activeSection={activeSection}
              onOpenSection={onOpenSection}
              onSendOperator={onSendOperator}
              avatarOpen={avatarOpen}
              onToggleAvatar={onToggleAvatar}
              operatorTarget={operatorTarget}
              operatorTicket={operatorTicket}
              onOperatorArrive={onOperatorArrive}
              lowPower={lowPower}
            />
          </Suspense>
        </Canvas>
      </div>

      <nav className="ops-legend" aria-label="板块图例">
        {opsDeckHotspots.map((spot) => (
          <button
            key={spot.id}
            type="button"
            className={[
              'ops-legend-item',
              activeSection === spot.id ? 'is-active' : '',
              operatorTarget === spot.id ? 'is-target' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onOpenSection(spot.id)}
          >
            <span className="ops-legend-kicker">{spot.label}</span>
            <span className="ops-legend-title">{SECTION_TITLES[spot.id]}</span>
          </button>
        ))}
      </nav>

      <div className="mobile-section-rail" aria-label="移动端板块快捷入口">
        {SECTION_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            className={activeSection === id ? 'is-active' : undefined}
            onClick={() => onOpenSection(id)}
          >
            {SECTION_TITLES[id]}
          </button>
        ))}
      </div>
    </div>
  )
}
