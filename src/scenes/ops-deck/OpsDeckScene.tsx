import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { SECTION_ORDER, type SectionId } from '../../content/sections'
import { useDeviceProfile } from '../../lib/device-profile'
import { getPalette } from '../../themes/palettes'
import type { SceneProps } from '../types'
import { DeckWorld } from './DeckWorld'
import { OPS_HOME_VIEW, OPS_HOME_VIEW_NARROW, opsDeckHotspots } from './hotspots'
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

export function OpsDeckScene({
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
  /** Seat-aware select from DeckWorld (stand first when needed). */
  const selectSectionRef = useRef<(id: SectionId) => void>(onFocusThenOpen)

  const selectSection = (id: SectionId) => {
    selectSectionRef.current(id)
  }

  const dpr = useMemo<[number, number]>(() => {
    if (lowPower && isNarrow) return [1, 1]
    if (lowPower) return [1, 1.15]
    return [1, 1.75]
  }, [lowPower, isNarrow])

  const homeView = isNarrow ? OPS_HOME_VIEW_NARROW : OPS_HOME_VIEW
  const preset = getPalette(theme)

  const camera = useMemo(
    () =>
      isNarrow
        ? { position: [4.2, 7.0, 10.2] as [number, number, number], fov: 44, near: 0.1, far: 80 }
        : { position: [3.6, 6.2, 9.4] as [number, number, number], fov: 40, near: 0.1, far: 80 },
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
          Scene <strong>A · Studio</strong>
        </div>
        <div className="ops-status-lights">
          <span />
          <span />
          <span />
        </div>
        <div>
          Palette <strong>{preset.label}</strong>
          {lowPower ? ' · Lite' : ' · Full'}
        </div>
      </div>

      <div className="ops-canvas-wrap">
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
            const lights = getPalette(theme).lights
            gl.toneMappingExposure = lowPower ? lights.exposureLite : lights.exposure
          }}
          performance={{ min: lowPower ? 0.45 : 0.7 }}
        >
          <Suspense fallback={null}>
            <DeckWorld
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
              selectSectionRef={selectSectionRef}
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
            onClick={() => selectSection(spot.id)}
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
            onClick={() => selectSection(id)}
          >
            {SECTION_TITLES[id]}
          </button>
        ))}
      </div>
    </div>
  )
}
