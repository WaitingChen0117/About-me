import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { getPalette } from '../../themes/palettes'
import type { SceneProps } from '../types'
import { CollectorBox } from './CollectorBox'
import { FigureOperator } from './FigureOperator'

type BoxWorldProps = SceneProps & {
  labelPortal: RefObject<HTMLDivElement | null>
  lowPower: boolean
  isTouch: boolean
  onSwitchScene?: (id: any) => void
}

type BoxFace = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'

export function BoxWorld({
  theme,
  onSwitchScene,
  lowPower,
}: BoxWorldProps) {
  const { gl } = useThree()
  const orbitRef = useRef<any>(null)
  const [activeFace, setActiveFace] = useState<BoxFace>('front')

  const preset = getPalette(theme)

  useEffect(() => {
    gl.toneMappingExposure = lowPower ? preset.lights.exposureLite : preset.lights.exposure
  }, [gl, theme, lowPower, preset.lights])

  const rotateTo = useCallback((face: BoxFace) => {
    if (!orbitRef.current) return
    setActiveFace(face)

    const target = new THREE.Vector3(0, 0, 0)
    const distance = 8

    let newPos = new THREE.Vector3()
    switch (face) {
      case 'front':
        newPos.set(0, 0, distance)
        break
      case 'back':
        newPos.set(0, 0, -distance)
        break
      case 'left':
        newPos.set(-distance, 0, 0)
        break
      case 'right':
        newPos.set(distance, 0, 0)
        break
      case 'top':
        newPos.set(0, distance, 0)
        break
      case 'bottom':
        newPos.set(0, -distance, 0)
        break
    }

    const camera = orbitRef.current.object
    const startPos = camera.position.clone()
    const duration = 1000
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      camera.position.lerpVectors(startPos, newPos, eased)
      orbitRef.current.target.lerp(target, eased)
      orbitRef.current.update()

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    animate()
  }, [])

  const handleFaceClick = useCallback(
    (face: BoxFace) => {
      rotateTo(face)
    },
    [rotateTo],
  )

  const handleWorkClick = useCallback(
    (href?: string, githubHref?: string) => {
      if (href) {
        window.open(href, '_blank', 'noopener,noreferrer')
      } else if (githubHref) {
        window.open(githubHref, '_blank', 'noopener,noreferrer')
      }
    },
    [],
  )

  const handleEnterStudio = useCallback(() => {
    if (onSwitchScene) {
      onSwitchScene('ops-deck')
    }
  }, [onSwitchScene])

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} near={0.1} far={100} />

      <OrbitControls
        ref={orbitRef}
        enablePan={false}
        enableZoom={true}
        minDistance={5}
        maxDistance={12}
      />

      <ambientLight intensity={preset.lights.ambient * 0.8} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={preset.lights.keyIntensity * 0.6}
        castShadow={!lowPower}
      />
      <directionalLight position={[-3, 4, -3]} intensity={preset.lights.fillIntensity * 0.4} />

      <CollectorBox
        activeFace={activeFace}
        onFaceClick={handleFaceClick}
        onWorkClick={handleWorkClick}
        onEnterStudio={handleEnterStudio}
        theme={theme}
        lowPower={lowPower}
      />

      <FigureOperator position={[0, -1.2, 0]} theme={theme} />
    </>
  )
}
