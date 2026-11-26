import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { SECTION_ORDER, type SectionId } from '../../content/sections'
import { useDeviceProfile } from '../../lib/device-profile'
import { getPalette } from '../../themes/palettes'
import type { SceneProps } from '../types'
import { TerminalWorld } from './TerminalWorld'
import {
  SKYLINE_HOME_VIEW,
  SKYLINE_HOME_VIEW_NARROW,
  skylineHotspots,
} from './hotspots'
import './SkylineTerminal.css'

const SECTION_TITLES: Record<SectionId, string> = {
  about: '关于我',
  experience: '经历',
  works: '作品',
  projects: '项目',
  articles: '文章',
  hobbies: '爱好',
  contact: '联系',
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return reduced
}

export function SkylineTerminalScene({
  theme,
  activeSection,
  onFocusThenOpen,
  onSendOperator,
  avatarOpen,
  onToggleAvatar,
  operatorTarget,
  operatorTicket,
  onOperatorArrive,
  focusId,
  cameraCommand,
  onCameraArrive,
  flyLock,
  labelsAway,
}: SceneProps) {
  const { lowPower, isTouch, isNarrow } = useDeviceProfile()
  const reducedMotion = usePrefersReducedMotion()
  const labelPortal = useRef<HTMLDivElement>(null)

  const dpr = useMemo<[number, number]>(() => {
    if (lowPower && isNarrow) return [1, 1]
    if (lowPower) return [1, 1.15]
    return [1, 1.7]
  }, [lowPower, isNarrow])

  const homeView = isNarrow ? SKYLINE_HOME_VIEW_NARROW : SKYLINE_HOME_VIEW

  const camera = useMemo(
    () =>
      isNarrow
        ? { position: [4.4, 6.8, 10.2] as [number, number, number], fov: 44, near: 0.1, far: 80 }
        : { position: [3.8, 6.0, 9.4] as [number, number, number], fov: 40, near: 0.1, far: 80 },
    [isNarrow],
  )

  return (
    <div
      className="skyline-terminal"
      data-theme-mode={theme}
      data-low-power={lowPower ? 'true' : 'false'}
      data-touch={isTouch ? 'true' : 'false'}
    >
      <div className="skyline-hud-rail" aria-hidden="true">
        <div>
          Scene <strong>C · Skyline Terminal</strong>
        </div>
        <div className="skyline-status-marks">
          <span />
          <span />
          <span />
        </div>
        <div>
          Palette <strong>{getPalette(theme).label}</strong>
          {lowPower ? ' · Lite' : ' · Full'}
        </div>
      </div>

      <div className="skyline-canvas-wrap">
        <div className="world-labels-mount" ref={labelPortal} />
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
            gl.toneMappingExposure = lowPower ? 1 : 1.06
          }}
          performance={{ min: lowPower ? 0.45 : 0.7 }}
        >
          <Suspense fallback={null}>
            <TerminalWorld
              theme={theme}
              activeSection={activeSection}
              onFocusThenOpen={onFocusThenOpen}
              onSendOperator={onSendOperator}
              avatarOpen={avatarOpen}
              onToggleAvatar={onToggleAvatar}
              operatorTarget={operatorTarget}
              operatorTicket={operatorTicket}
              onOperatorArrive={onOperatorArrive}
              focusId={focusId}
              cameraCommand={cameraCommand}
              onCameraArrive={onCameraArrive}
              flyLock={flyLock}
              labelsAway={labelsAway}
              labelPortal={labelPortal}
              lowPower={lowPower}
              isTouch={isTouch}
              reducedMotion={reducedMotion}
              homeView={homeView}
            />
          </Suspense>
        </Canvas>
      </div>

      <nav className="skyline-legend" aria-label="终端板块图例">
        {skylineHotspots.map((spot) => (
          <button
            key={spot.id}
            type="button"
            className={[
              'skyline-legend-item',
              activeSection === spot.id ? 'is-active' : '',
              operatorTarget === spot.id ? 'is-target' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onFocusThenOpen(spot.id)}
          >
            <span className="skyline-legend-kicker">{spot.label}</span>
            <span className="skyline-legend-title">{SECTION_TITLES[spot.id]}</span>
          </button>
        ))}
      </nav>

      <div className="mobile-section-rail" aria-label="移动端板块快捷入口">
        {SECTION_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            className={activeSection === id ? 'is-active' : undefined}
            onClick={() => onFocusThenOpen(id)}
          >
            {SECTION_TITLES[id]}
          </button>
        ))}
      </div>
    </div>
  )
}
