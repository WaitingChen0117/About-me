import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo } from 'react'
import { SECTION_ORDER, type SectionId } from '../../content/sections'
import { useDeviceProfile } from '../../lib/device-profile'
import type { SceneProps } from '../types'
import { LabWorld } from './LabWorld'
import { craftLabHotspots } from './hotspots'
import './CraftLab.css'

const SECTION_TITLES: Record<SectionId, string> = {
  about: '关于我',
  experience: '经历',
  works: '作品',
  projects: '项目',
  articles: '文章',
  hobbies: '爱好',
  contact: '联系',
}

export function CraftLabScene({
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
  const { lowPower, isTouch, isNarrow } = useDeviceProfile()

  const dpr = useMemo<[number, number]>(() => {
    if (lowPower && isNarrow) return [1, 1]
    if (lowPower) return [1, 1.15]
    return [1, 1.7]
  }, [lowPower, isNarrow])

  const camera = useMemo(
    () =>
      isNarrow
        ? { position: [3.6, 5.8, 8.2] as [number, number, number], fov: 44, near: 0.1, far: 60 }
        : { position: [3.0, 5.0, 7.4] as [number, number, number], fov: 40, near: 0.1, far: 60 },
    [isNarrow],
  )

  return (
    <div
      className="craft-lab"
      data-theme-mode={theme}
      data-low-power={lowPower ? 'true' : 'false'}
      data-touch={isTouch ? 'true' : 'false'}
    >
      <div className="craft-hud-rail" aria-hidden="true">
        <div>
          Scene <strong>B · Craft Lab</strong>
        </div>
        <div className="craft-status-marks">
          <span />
          <span />
          <span />
        </div>
        <div>
          Light <strong>{theme === 'duty' ? 'Studio' : 'Day'}</strong>
          {lowPower ? ' · Lite' : ' · Full'}
        </div>
      </div>

      <div className="craft-canvas-wrap">
        <Canvas
          shadows={!lowPower}
          dpr={dpr}
          camera={camera}
          gl={{
            antialias: !lowPower,
            powerPreference: lowPower ? 'low-power' : 'high-performance',
            alpha: false,
            stencil: false,
          }}
          onCreated={({ gl }) => {
            gl.toneMappingExposure = lowPower ? 1 : 1.04
          }}
          performance={{ min: lowPower ? 0.45 : 0.7 }}
        >
          <Suspense fallback={null}>
            <LabWorld
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
              isTouch={isTouch}
            />
          </Suspense>
        </Canvas>
      </div>

      <nav className="craft-legend" aria-label="工坊板块图例">
        {craftLabHotspots.map((spot) => (
          <button
            key={spot.id}
            type="button"
            className={[
              'craft-legend-item',
              activeSection === spot.id ? 'is-active' : '',
              operatorTarget === spot.id ? 'is-target' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onOpenSection(spot.id)}
          >
            <span className="craft-legend-kicker">{spot.label}</span>
            <span className="craft-legend-title">{SECTION_TITLES[spot.id]}</span>
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
