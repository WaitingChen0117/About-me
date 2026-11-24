import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { SectionId } from '../../content/sections'
import type { CameraCommand, CameraView, HotspotDef } from '../types'
import { positionFromView, resolveHotspotView } from './viewUtils'

export const FOCUS_DURATION_MS = 620
export const FOCUS_LERP = 3.35

type OrbitControlsHandle = {
  target: THREE.Vector3
  update: () => void
  enabled: boolean
}

type OrbitLimits = {
  minPolarAngle: number
  maxPolarAngle: number
  minDistance: number
  maxDistance: number
  enableDamping: boolean
  dampingFactor: number
  rotateSpeed: number
  zoomSpeed: number
}

type Props = {
  home: CameraView
  hotspots: HotspotDef[]
  cameraCommand: CameraCommand
  /** While panel open / focusing — lock user orbit */
  lockOrbit: boolean
  onArrive: () => void
  reducedMotion: boolean
  limits: OrbitLimits
}

/**
 * Wraps OrbitControls with programmatic HOME / hotspot focus.
 * Goal lerp uses exponential smoothing; arrive fires after FOCUS_DURATION_MS
 * (or immediately when prefers-reduced-motion).
 */
export function SceneCameraRig({
  home,
  hotspots,
  cameraCommand,
  lockOrbit,
  onArrive,
  reducedMotion,
  limits,
}: Props) {
  const camera = useThree((s) => s.camera)
  const controlsRef = useRef<OrbitControlsHandle | null>(null)
  const goalPos = useRef(new THREE.Vector3())
  const goalTarget = useRef(new THREE.Vector3(...home.target))
  const arriveRef = useRef(onArrive)
  /** Match App initial ticket=0 so mount does not fire a spurious home fly. */
  const lastTicket = useRef(0)
  const homeView = useRef(home)
  const [isFlying, setIsFlying] = useState(false)

  homeView.current = home
  arriveRef.current = onArrive

  useEffect(() => {
    if (cameraCommand.ticket === lastTicket.current) return
    lastTicket.current = cameraCommand.ticket

    const view = resolveCommandView(cameraCommand.focusId, hotspots, homeView.current)
    goalTarget.current.set(...view.target)
    positionFromView(view, goalPos.current)

    if (reducedMotion) {
      camera.position.copy(goalPos.current)
      const ctrl = controlsRef.current
      if (ctrl) {
        ctrl.target.copy(goalTarget.current)
        ctrl.update()
      }
      setIsFlying(false)
      queueMicrotask(() => arriveRef.current())
      return
    }

    setIsFlying(true)
    const t = window.setTimeout(() => {
      camera.position.copy(goalPos.current)
      const ctrl = controlsRef.current
      if (ctrl) {
        ctrl.target.copy(goalTarget.current)
        ctrl.update()
      }
      setIsFlying(false)
      arriveRef.current()
    }, FOCUS_DURATION_MS)

    return () => window.clearTimeout(t)
  }, [cameraCommand.ticket, cameraCommand.focusId, hotspots, reducedMotion, camera])

  useFrame((_, dt) => {
    if (!isFlying) return
    const ctrl = controlsRef.current
    if (!ctrl) return
    const k = 1 - Math.exp(-dt * FOCUS_LERP)
    camera.position.lerp(goalPos.current, k)
    ctrl.target.lerp(goalTarget.current, k)
    ctrl.update()
  })

  const userEnabled = !lockOrbit && !isFlying

  return (
    <OrbitControls
      ref={controlsRef as never}
      makeDefault
      enablePan={false}
      enabled={userEnabled}
      enableRotate={userEnabled}
      enableZoom={userEnabled}
      minPolarAngle={limits.minPolarAngle}
      maxPolarAngle={limits.maxPolarAngle}
      minDistance={limits.minDistance}
      maxDistance={limits.maxDistance}
      target={home.target}
      enableDamping={limits.enableDamping}
      dampingFactor={limits.dampingFactor}
      rotateSpeed={limits.rotateSpeed}
      zoomSpeed={limits.zoomSpeed}
      touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
    />
  )
}

function resolveCommandView(
  focusId: SectionId | null,
  hotspots: HotspotDef[],
  home: CameraView,
): CameraView {
  if (!focusId) return home
  const spot = hotspots.find((h) => h.id === focusId)
  if (!spot) return home
  return resolveHotspotView(spot, home)
}
