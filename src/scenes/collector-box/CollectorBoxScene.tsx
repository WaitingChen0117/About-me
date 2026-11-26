import { Canvas } from '@react-three/fiber'
import { Suspense, useState } from 'react'
import { useDeviceProfile } from '../../lib/device-profile'
import type { SceneProps } from '../types'
import { BoxWorld } from './BoxWorld'
import './CollectorBox.css'

export function CollectorBoxScene(props: SceneProps) {
  const { lowPower } = useDeviceProfile()
  const [loaded, setLoaded] = useState(false)
  const [showFrontButton, setShowFrontButton] = useState(false)
  const [returnToFront, setReturnToFront] = useState(0)

  const dpr: [number, number] = lowPower ? [1, 1] : [1, 2]

  return (
    <div className="collector-box-scene">
      {!loaded && (
        <div className="box-poster">
          <div className="box-poster-content">
            <div className="poster-box">
              <div className="poster-window" />
              <div className="poster-label">WAITING CHEN</div>
              <div className="poster-subtitle">SENIOR FRONTEND · COLLECTOR EDITION</div>
            </div>
          </div>
        </div>
      )}

      <div className="collector-canvas-wrap" style={{ opacity: loaded ? 1 : 0 }}>
        <Canvas
          shadows={!lowPower}
          dpr={dpr}
          camera={{ position: [3, 1.5, 4], fov: 35, near: 0.1, far: 100 }}
          gl={{
            antialias: !lowPower,
            powerPreference: lowPower ? 'low-power' : 'high-performance',
            alpha: false,
          }}
          onCreated={() => {
            setTimeout(() => setLoaded(true), 100)
          }}
        >
          <Suspense fallback={null}>
            <BoxWorld 
              {...props} 
              lowPower={lowPower} 
              onShowFrontButton={setShowFrontButton}
              returnToFrontTrigger={returnToFront}
            />
          </Suspense>
        </Canvas>
        
        {showFrontButton && (
          <button className="front-button" onClick={() => {
            setReturnToFront(prev => prev + 1)
          }}>
            ↺ FRONT
          </button>
        )}
      </div>
    </div>
  )
}
