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

type DeviceProfile = {
  lowPower: boolean
  isTouch: boolean
  isNarrow: boolean
}

function readDeviceProfile(): DeviceProfile {
  if (typeof window === 'undefined') {
    return { lowPower: false, isTouch: false, isNarrow: false }
  }
  const narrow = window.matchMedia('(max-width: 720px)').matches
  const touch = window.matchMedia('(pointer: coarse)').matches
  const lowCpu =
    typeof navigator !== 'undefined' &&
    navigator.hardwareConcurrency > 0 &&
    navigator.hardwareConcurrency <= 4
  const saveData =
    typeof navigator !== 'undefined' &&
    'connection' in navigator &&
    Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return {
    isNarrow: narrow,
    isTouch: touch,
    lowPower: narrow || touch || lowCpu || saveData || reduceMotion,
  }
}

function useDeviceProfile(): DeviceProfile {
  const [profile, setProfile] = useState(readDeviceProfile)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px), (pointer: coarse), (prefers-reduced-motion: reduce)')
    const sync = () => setProfile(readDeviceProfile())
    sync()
    mq.addEventListener('change', sync)
    window.addEventListener('resize', sync)
    return () => {
      mq.removeEventListener('change', sync)
      window.removeEventListener('resize', sync)
    }
  }, [])

  return profile
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
  const { lowPower, isTouch, isNarrow } = useDeviceProfile()

  const dpr = useMemo<[number, number]>(() => {
    if (lowPower && isNarrow) return [1, 1]
    if (lowPower) return [1, 1.15]
    return [1, 1.75]
  }, [lowPower, isNarrow])

  const camera = useMemo(
    () =>
      isNarrow
        ? { position: [3.4, 6.2, 8.4] as [number, number, number], fov: 44, near: 0.1, far: 60 }
        : { position: [2.8, 5.2, 7.6] as [number, number, number], fov: 40, near: 0.1, far: 60 },
    [isNarrow],
  )

  return (
    <div
      className="ops-deck"
      data-theme-mode={theme}
      data-low-power={lowPower ? 'true' : 'false'}
      data-touch={isTouch ? 'true' : 'false'}
    >
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
          camera={camera}
          gl={{
            antialias: !lowPower,
            powerPreference: lowPower ? 'low-power' : 'high-performance',
            alpha: false,
            stencil: false,
          }}
          onCreated={({ gl }) => {
            // Soft exposure only on full quality; lite path stays neutral (no post stack)
            gl.toneMappingExposure = lowPower ? 1 : 1.06
          }}
          performance={{ min: lowPower ? 0.45 : 0.7 }}
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
              isTouch={isTouch}
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
