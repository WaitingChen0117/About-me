import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'
import { useDeviceProfile } from '../../lib/device-profile'
import type { SceneProps } from '../types'
import { BoxWorld } from './BoxWorld'
import './CollectorBox.css'

export function CollectorBoxScene(props: SceneProps) {
  const { onSwitchScene } = props
  const { lowPower, isTouch } = useDeviceProfile()
  const labelPortal = useRef<HTMLDivElement>(null)

  const dpr: [number, number] = useMemo(
    () => (lowPower ? [1, 1] : [1, 1.75]),
    [lowPower],
  )

  return (
    <div className="collector-box-scene" data-low-power={lowPower ? 'true' : 'false'}>
      <div className="collector-hud">
        <div className="collector-brand">
          <div className="collector-logo">□</div>
          <div>
            <div className="collector-title">Waiting's Collection</div>
            <div className="collector-subtitle">拖拽旋转 · 点击标签切换面</div>
          </div>
        </div>
      </div>

      <div className="collector-canvas-wrap">
        <div className="world-labels-mount" ref={labelPortal} />
        <Canvas
          shadows={!lowPower}
          dpr={dpr}
          camera={{ position: [0, 0, 8], fov: 45, near: 0.1, far: 100 }}
          gl={{
            antialias: !lowPower,
            powerPreference: lowPower ? 'low-power' : 'high-performance',
            alpha: false,
            stencil: false,
          }}
        >
          <Suspense fallback={null}>
            <BoxWorld
              {...props}
              labelPortal={labelPortal}
              lowPower={lowPower}
              isTouch={isTouch}
              onSwitchScene={onSwitchScene}
            />
          </Suspense>
        </Canvas>
      </div>
    </div>
  )
}
