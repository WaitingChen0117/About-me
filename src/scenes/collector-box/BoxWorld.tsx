import { PerspectiveCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { getPalette } from '../../themes/palettes'
import type { SceneProps } from '../types'
import { FigureInBox } from './FigureInBox'
import { PackageBox } from './PackageBox'

type BoxWorldProps = SceneProps & {
  lowPower: boolean
}

type TargetFace = 'front' | 'back' | 'left' | 'right' | null

const WORK_URLS = [
  { href: 'https://waitingchen0117.github.io/mini-cut/', gh: 'https://github.com/WaitingChen0117/mini-cut' },
  { gh: 'https://github.com/WaitingChen0117/collab-table-demo' },
  { gh: 'https://github.com/WaitingChen0117/agent-workbench' },
  { gh: 'https://github.com/WaitingChen0117/Full-Stack' },
  { href: 'https://waitingchen0117.github.io/', gh: 'https://github.com/WaitingChen0117' },
]

export function BoxWorld({
  theme,
  lowPower,
}: BoxWorldProps) {
  const { gl } = useThree()
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  const targetRotation = useRef(new THREE.Euler(0, 0, 0))
  const currentRotation = useRef(new THREE.Euler(0, 0, 0))
  const boxGroup = useRef<THREE.Group>(null)
  const figureGroup = useRef<THREE.Group>(null)
  
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const rotationStart = useRef(new THREE.Euler(0, 0, 0))
  const dragTarget = useRef<'box' | 'figure' | null>(null)
  
  const [showFrontButton, setShowFrontButton] = useState(false)

  const preset = getPalette(theme)

  useEffect(() => {
    gl.toneMappingExposure = lowPower ? preset.lights.exposureLite : preset.lights.exposure
  }, [gl, theme, lowPower, preset.lights])

  // Hero three-quarter angle (front + thin right edge)
  const HERO_ROTATION = { y: -0.3, x: 0.1 }

  const rotateTo = useCallback((face: TargetFace) => {
    if (!face) {
      targetRotation.current.set(HERO_ROTATION.x, HERO_ROTATION.y, 0)
      setShowFrontButton(false)
      return
    }

    setShowFrontButton(true)

    switch (face) {
      case 'front':
        targetRotation.current.set(HERO_ROTATION.x, HERO_ROTATION.y, 0)
        setShowFrontButton(false)
        break
      case 'back':
        targetRotation.current.set(0, Math.PI, 0)
        break
      case 'left':
        targetRotation.current.set(0, Math.PI / 2, 0)
        break
      case 'right':
        targetRotation.current.set(0, -Math.PI / 2, 0)
        break
    }
  }, [])

  const handlePointerDown = useCallback((e: PointerEvent, target: 'box' | 'figure') => {
    isDragging.current = true
    dragTarget.current = target
    dragStart.current = { x: e.clientX, y: e.clientY }
    rotationStart.current.copy(currentRotation.current)
    e.stopPropagation()
  }, [])

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current) return

    const deltaX = e.clientX - dragStart.current.x
    const deltaY = e.clientY - dragStart.current.y

    if (dragTarget.current === 'box') {
      // Orbit camera around box
      targetRotation.current.y = rotationStart.current.y - deltaX * 0.005
      targetRotation.current.x = THREE.MathUtils.clamp(
        rotationStart.current.x + deltaY * 0.005,
        -0.5,
        0.5,
      )
      
      // Show front button if rotated away from hero
      const isNearHero = 
        Math.abs(targetRotation.current.y - HERO_ROTATION.y) < 0.2 &&
        Math.abs(targetRotation.current.x - HERO_ROTATION.x) < 0.2
      setShowFrontButton(!isNearHero)
    } else if (dragTarget.current === 'figure' && figureGroup.current) {
      // Squash/tilt figure (spring effect)
      const tiltX = deltaX * 0.001
      const tiltZ = deltaY * 0.001
      figureGroup.current.rotation.x = tiltZ
      figureGroup.current.rotation.z = -tiltX
      figureGroup.current.scale.setScalar(0.95 - Math.abs(tiltX) * 0.1 - Math.abs(tiltZ) * 0.1)
    }
  }, [])

  const handlePointerUp = useCallback(() => {
    if (dragTarget.current === 'figure' && figureGroup.current) {
      // Spring back
      const springBack = () => {
        if (!figureGroup.current) return
        figureGroup.current.rotation.x *= 0.85
        figureGroup.current.rotation.z *= 0.85
        figureGroup.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.2)
        
        if (Math.abs(figureGroup.current.rotation.x) > 0.01 || 
            Math.abs(figureGroup.current.rotation.z) > 0.01) {
          requestAnimationFrame(springBack)
        } else {
          figureGroup.current.rotation.set(0, 0, 0)
          figureGroup.current.scale.setScalar(1)
        }
      }
      springBack()
    }
    
    isDragging.current = false
    dragTarget.current = null
  }, [])

  useEffect(() => {
    const canvas = gl.domElement
    const onPointerMove = (e: PointerEvent) => handlePointerMove(e)
    const onPointerUp = () => handlePointerUp()
    
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    
    return () => {
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
    }
  }, [gl, handlePointerMove, handlePointerUp])

  useFrame((_, delta) => {
    if (boxGroup.current) {
      // Smooth rotation
      currentRotation.current.x = THREE.MathUtils.damp(
        currentRotation.current.x,
        targetRotation.current.x,
        6,
        delta,
      )
      currentRotation.current.y = THREE.MathUtils.damp(
        currentRotation.current.y,
        targetRotation.current.y,
        6,
        delta,
      )
      boxGroup.current.rotation.copy(currentRotation.current)
    }
  })

  const handleWorkClick = useCallback((index: number) => {
    const work = WORK_URLS[index]
    if (!work) return
    const url = work.href || work.gh
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }, [])

  // Removed unused function

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={[3, 1.5, 4]}
        fov={35}
        near={0.1}
        far={100}
      />

      {/* Lighting */}
      <ambientLight intensity={preset.lights.ambient * 0.7} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={preset.lights.keyIntensity * 0.5}
        castShadow={!lowPower}
        shadow-mapSize-width={lowPower ? 512 : 2048}
        shadow-mapSize-height={lowPower ? 512 : 2048}
      />
      <directionalLight position={[-3, 4, -3]} intensity={preset.lights.fillIntensity * 0.3} />

      {/* Box with figure */}
      <group ref={boxGroup}>
        <PackageBox
          onPointerDown={(e: any) => handlePointerDown(e, 'box')}
          onClickWork={handleWorkClick}
          lowPower={lowPower}
        />
        
        <group ref={figureGroup}>
          <FigureInBox
            onPointerDown={(e: any) => handlePointerDown(e, 'figure')}
            theme={theme}
          />
        </group>
      </group>

      {/* Background field */}
      <mesh position={[0, 0, -8]} receiveShadow={false}>
        <planeGeometry args={[50, 50]} />
        <meshBasicMaterial color="#0d1117" />
      </mesh>

      {/* HTML overlay for FRONT button */}
      {showFrontButton && (
        <group position={[0, -2, 0]}>
          <mesh onClick={() => rotateTo('front')}>
            <planeGeometry args={[1, 0.3]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        </group>
      )}
    </>
  )
}
