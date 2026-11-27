import { PerspectiveCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { getPalette } from '../../themes/palettes'
import type { SceneProps } from '../types'
import { FigureInBox } from './FigureInBox'
import { PackageBox } from './PackageBox'

type BoxWorldProps = SceneProps & {
  lowPower: boolean
  onShowFrontButton?: (show: boolean) => void
  returnToFrontTrigger?: number
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
  onSwitchScene,
  onShowFrontButton,
  returnToFrontTrigger,
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
  
  const preset = getPalette(theme)

  useEffect(() => {
    gl.toneMappingExposure = lowPower ? preset.lights.exposureLite : preset.lights.exposure
  }, [gl, theme, lowPower, preset.lights])

  // Front-facing angle: figure straight-on to camera
  // Camera at [3, 1.5, 4] → need Y rotation ~0.64 to face it
  const FRONT_ROTATION = { y: 0.64, x: 0 }

  const rotateTo = useCallback((face: TargetFace) => {
    if (!face) {
      targetRotation.current.set(FRONT_ROTATION.x, FRONT_ROTATION.y, 0)
      if (onShowFrontButton) onShowFrontButton(false)
      return
    }

    if (onShowFrontButton) onShowFrontButton(true)

    switch (face) {
      case 'front':
        targetRotation.current.set(FRONT_ROTATION.x, FRONT_ROTATION.y, 0)
        if (onShowFrontButton) onShowFrontButton(false)
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
  }, [onShowFrontButton])

  const handlePointerDown = useCallback((e: PointerEvent, target: 'box' | 'figure') => {
    isDragging.current = true
    dragTarget.current = target
    dragStart.current = { x: e.clientX, y: e.clientY }
    rotationStart.current.copy(currentRotation.current)
    document.body.style.cursor = target === 'box' ? 'grabbing' : 'grabbing'
    e.stopPropagation()
  }, [])

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current) return

    const deltaX = e.clientX - dragStart.current.x
    const deltaY = e.clientY - dragStart.current.y

    if (dragTarget.current === 'box') {
      // Orbit camera around box - box surface follows drag direction like a physical toy
      // Right drag → box turns right (Y += deltaX)
      // Up drag → top comes toward viewer (X -= deltaY)
      targetRotation.current.y = rotationStart.current.y + deltaX * 0.005
      targetRotation.current.x = THREE.MathUtils.clamp(
        rotationStart.current.x - deltaY * 0.005,
        -0.5,
        0.5,
      )
      
      // Update front button visibility
      if (onShowFrontButton) {
        const isNearFront = 
          Math.abs(targetRotation.current.y - FRONT_ROTATION.y) < 0.2 &&
          Math.abs(targetRotation.current.x - FRONT_ROTATION.x) < 0.2
        onShowFrontButton(!isNearFront)
      }
    } else if (dragTarget.current === 'figure' && figureGroup.current) {
      // Drag figure inside cavity like a vinyl toy
      // Convert screen delta to 3D movement (constrained to cavity)
      const moveX = deltaX * 0.002
      const moveY = -deltaY * 0.002
      
      // Constrain to cavity bounds (roughly ±0.8 from center)
      const constrainedX = THREE.MathUtils.clamp(moveX, -0.8, 0.8)
      const constrainedY = THREE.MathUtils.clamp(moveY, -0.6, 0.6)
      
      // Apply movement (maintain base Y position of -1.05 from FigureInBox)
      figureGroup.current.position.x = constrainedX
      figureGroup.current.position.y = -1.05 + constrainedY
      
      // Add squash/tilt for toy-like feel
      const tiltX = deltaX * 0.0008
      const tiltZ = deltaY * 0.0008
      figureGroup.current.rotation.x = tiltZ
      figureGroup.current.rotation.z = -tiltX
      
      // Slight squash when moved far
      const dist = Math.sqrt(constrainedX * constrainedX + constrainedY * constrainedY)
      const squash = Math.max(0.92, 1 - dist * 0.08)
      figureGroup.current.scale.setScalar(squash)
    }
  }, [])

  const handlePointerUp = useCallback(() => {
    if (dragTarget.current === 'figure' && figureGroup.current) {
      // Spring back to rest position with vinyl toy bounce
      const restY = -1.05 // FigureInBox base Y position
      
      const springBack = () => {
        if (!figureGroup.current) return
        
        // Spring X position back to 0
        figureGroup.current.position.x *= 0.88
        
        // Spring Y position back to rest (-1.05)
        const deltaY = figureGroup.current.position.y - restY
        figureGroup.current.position.y = restY + deltaY * 0.88
        
        // Spring rotation back
        figureGroup.current.rotation.x *= 0.85
        figureGroup.current.rotation.z *= 0.85
        
        // Spring scale back to 1
        figureGroup.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.2)
        
        // Continue spring if still moving
        if (Math.abs(figureGroup.current.position.x) > 0.01 ||
            Math.abs(figureGroup.current.position.y - restY) > 0.01 ||
            Math.abs(figureGroup.current.rotation.x) > 0.01 || 
            Math.abs(figureGroup.current.rotation.z) > 0.01) {
          requestAnimationFrame(springBack)
        } else {
          figureGroup.current.position.set(0, restY, 0)
          figureGroup.current.rotation.set(0, 0, 0)
          figureGroup.current.scale.setScalar(1)
        }
      }
      springBack()
    }
    
    document.body.style.cursor = 'auto'
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
    if (cameraRef.current) {
      cameraRef.current.lookAt(0, 0, 0)
    }
    
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

  // Handle return to front trigger
  useEffect(() => {
    if (returnToFrontTrigger && returnToFrontTrigger > 0) {
      rotateTo('front')
    }
  }, [returnToFrontTrigger, rotateTo])

  const handleEnterStudio = useCallback(() => {
    if (onSwitchScene) {
      onSwitchScene('ops-deck')
    }
  }, [onSwitchScene])
  
  const handleClickAbout = useCallback(() => {
    rotateTo('left')
  }, [rotateTo])
  
  const handleClickWorks = useCallback(() => {
    rotateTo('back')
  }, [rotateTo])

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

      {/* Lighting - brighter to show interior */}
      <ambientLight intensity={preset.lights.ambient * 1.2} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={preset.lights.keyIntensity * 0.8}
        castShadow={!lowPower}
        shadow-mapSize-width={lowPower ? 512 : 2048}
        shadow-mapSize-height={lowPower ? 512 : 2048}
      />
      <directionalLight position={[-3, 4, -3]} intensity={preset.lights.fillIntensity * 0.5} />
      {/* Interior fill light */}
      <pointLight position={[0, 0, 0]} intensity={0.8} distance={3} decay={2} />

      {/* Box with figure */}
      <group ref={boxGroup}>
        <PackageBox
          onPointerDown={(e: any) => handlePointerDown(e, 'box')}
          onClickWork={handleWorkClick}
          onClickAbout={handleClickAbout}
          onClickWorks={handleClickWorks}
          onClickStudio={handleEnterStudio}
          lowPower={lowPower}
        />
        
        <FigureInBox
          ref={figureGroup}
          onPointerDown={(e: any) => handlePointerDown(e, 'figure')}
          theme={theme}
        />
      </group>

      {/* Background field - single stable plane */}
      <mesh position={[0, 0, -8]} receiveShadow={false}>
        <planeGeometry args={[50, 50]} />
        <meshBasicMaterial color="#0d1117" depthWrite={false} />
      </mesh>
    </>
  )
}
