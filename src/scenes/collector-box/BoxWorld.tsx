import { PerspectiveCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { getPalette } from '../../themes/palettes'
import type { SceneProps } from '../types'
import { FigureInBox, type FigureInBoxHandle, type DragPart } from './FigureInBox'
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
  
  // Figure outer wrapper for body drag (position/scale/tilt)
  const figureWrapperRef = useRef<THREE.Group>(null)
  // Figure inner handle for part motion (head/arms/feet)
  const figureHandleRef = useRef<FigureInBoxHandle>(null)
  
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const dragLast = useRef({ x: 0, y: 0 })
  const rotationStart = useRef(new THREE.Euler(0, 0, 0))
  const dragTarget = useRef<DragPart | 'box' | null>(null)
  const cupVelocityBuffer = useRef<Array<{ vx: number; vy: number; time: number }>>([])
  
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

  const handlePointerDown = useCallback((e: PointerEvent, target: DragPart | 'box') => {
    isDragging.current = true
    dragTarget.current = target
    dragStart.current = { x: e.clientX, y: e.clientY }
    dragLast.current = { x: e.clientX, y: e.clientY }
    rotationStart.current.copy(currentRotation.current)
    cupVelocityBuffer.current = []
    document.body.style.cursor = 'grabbing'
    e.stopPropagation()
  }, [])

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current || !dragTarget.current) return

    const deltaX = e.clientX - dragStart.current.x
    const deltaY = e.clientY - dragStart.current.y
    const frameDeltaX = e.clientX - dragLast.current.x
    const frameDeltaY = e.clientY - dragLast.current.y

    if (dragTarget.current === 'box') {
      // Orbit camera around box
      targetRotation.current.y = rotationStart.current.y + deltaX * 0.005
      targetRotation.current.x = THREE.MathUtils.clamp(
        rotationStart.current.x - deltaY * 0.005,
        -0.5,
        0.5,
      )
      
      if (onShowFrontButton) {
        const isNearFront = 
          Math.abs(targetRotation.current.y - FRONT_ROTATION.y) < 0.2 &&
          Math.abs(targetRotation.current.x - FRONT_ROTATION.x) < 0.2
        onShowFrontButton(!isNearFront)
      }
    } else if (dragTarget.current === 'body' && figureWrapperRef.current) {
      // Body drag: move whole figure inside cavity
      const moveX = deltaX * 0.002
      const moveY = -deltaY * 0.002
      
      const constrainedX = THREE.MathUtils.clamp(moveX, -0.8, 0.8)
      const constrainedY = THREE.MathUtils.clamp(moveY, -0.6, 0.6)
      
      figureWrapperRef.current.position.x = constrainedX
      figureWrapperRef.current.position.y = constrainedY
      
      // Vinyl toy tilt
      const tiltX = deltaX * 0.0008
      const tiltZ = deltaY * 0.0008
      figureWrapperRef.current.rotation.x = tiltZ
      figureWrapperRef.current.rotation.z = -tiltX
      
      // Squash when moved far
      const dist = Math.sqrt(constrainedX * constrainedX + constrainedY * constrainedY)
      const squash = Math.max(0.92, 1 - dist * 0.08)
      figureWrapperRef.current.scale.setScalar(squash)
      
    } else if (figureHandleRef.current && (
      dragTarget.current === 'head' || 
      dragTarget.current === 'cup' || 
      dragTarget.current === 'laptop' ||
      dragTarget.current === 'foot-left' ||
      dragTarget.current === 'foot-right'
    )) {
      // Part-specific motion through the handle interface
      figureHandleRef.current.applyPartMotion(dragTarget.current, {
        x: frameDeltaX,
        y: frameDeltaY,
      })
      
      // Track cup velocity for spill detection
      if (dragTarget.current === 'cup') {
        cupVelocityBuffer.current.push({
          vx: frameDeltaX,
          vy: frameDeltaY,
          time: Date.now(),
        })
        // Keep only last 200ms
        const now = Date.now()
        cupVelocityBuffer.current = cupVelocityBuffer.current.filter(v => now - v.time < 200)
      }
    }
    
    dragLast.current = { x: e.clientX, y: e.clientY }
  }, [onShowFrontButton])

  const handlePointerUp = useCallback(() => {
    // Check for coffee spill on cup release
    if (dragTarget.current === 'cup' && figureHandleRef.current && cupVelocityBuffer.current.length >= 1) {
      // Calculate average velocity over last frames
      const avgVx = cupVelocityBuffer.current.reduce((sum, v) => sum + v.vx, 0) / cupVelocityBuffer.current.length
      const avgVy = cupVelocityBuffer.current.reduce((sum, v) => sum + v.vy, 0) / cupVelocityBuffer.current.length
      const speed = Math.sqrt(avgVx * avgVx + avgVy * avgVy)
      
      // Trigger spill if flicked fast enough (lowered threshold for low-FPS environments)
      if (speed > 3) {
        const spillDir = new THREE.Vector3(avgVx * 0.02, -avgVy * 0.02, 0)
        figureHandleRef.current.triggerSpill(spillDir)
      }
    }
    
    // Reset part motion on release
    if (dragTarget.current && dragTarget.current !== 'box' && dragTarget.current !== 'body' && figureHandleRef.current) {
      figureHandleRef.current.resetPartMotion(dragTarget.current)
    }
    
    // Spring body drag back to rest
    if (dragTarget.current === 'body' && figureWrapperRef.current) {
      const springBack = () => {
        if (!figureWrapperRef.current) return
        
        figureWrapperRef.current.position.x *= 0.88
        figureWrapperRef.current.position.y *= 0.88
        figureWrapperRef.current.rotation.x *= 0.85
        figureWrapperRef.current.rotation.z *= 0.85
        figureWrapperRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.2)
        
        if (Math.abs(figureWrapperRef.current.position.x) > 0.01 ||
            Math.abs(figureWrapperRef.current.position.y) > 0.01 ||
            Math.abs(figureWrapperRef.current.rotation.x) > 0.01 || 
            Math.abs(figureWrapperRef.current.rotation.z) > 0.01) {
          requestAnimationFrame(springBack)
        } else {
          figureWrapperRef.current.position.set(0, 0, 0)
          figureWrapperRef.current.rotation.set(0, 0, 0)
          figureWrapperRef.current.scale.setScalar(1)
        }
      }
      springBack()
    }
    
    document.body.style.cursor = 'auto'
    isDragging.current = false
    dragTarget.current = null
    cupVelocityBuffer.current = []
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

      <ambientLight intensity={preset.lights.ambient * 1.2} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={preset.lights.keyIntensity * 0.8}
        castShadow={!lowPower}
        shadow-mapSize-width={lowPower ? 512 : 2048}
        shadow-mapSize-height={lowPower ? 512 : 2048}
      />
      <directionalLight position={[-3, 4, -3]} intensity={preset.lights.fillIntensity * 0.5} />
      <pointLight position={[0, 0, 0]} intensity={0.8} distance={3} decay={2} />

      <group ref={boxGroup}>
        <PackageBox
          onPointerDown={(e: any) => handlePointerDown(e, 'box')}
          onClickWork={handleWorkClick}
          onClickAbout={handleClickAbout}
          onClickWorks={handleClickWorks}
          onClickStudio={handleEnterStudio}
          lowPower={lowPower}
        />
        
        {/* Figure wrapper for body drag (position/scale/tilt) */}
        <group ref={figureWrapperRef}>
          <FigureInBox
            ref={figureHandleRef}
            onPointerDown={(e: any, part: any) => handlePointerDown(e, part || 'body')}
            theme={theme}
          />
        </group>
      </group>

      <mesh position={[0, 0, -8]} receiveShadow={false}>
        <planeGeometry args={[50, 50]} />
        <meshBasicMaterial color="#0d1117" depthWrite={false} />
      </mesh>
    </>
  )
}
