import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { SectionId } from '../../content/sections'
import type { CameraCommand, CameraView, HotspotDef } from '../types'
import { positionFromView, resolveHotspotView } from './viewUtils'

/** Focus-in duration (ms). Time-based ease reaches u=1 — no end snap. */
export const FOCUS_DURATION_MS = 720
/** Return-to-home gets a slightly longer settle. */
export const HOME_DURATION_MS = 880

type OrbitControlsHandle = {
  target: THREE.Vector3
  update: () => void
  enabled: boolean
  enableDamping: boolean
  dampingFactor: number
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
  /** While panel open / focusing / flying — lock user orbit */
  lockOrbit: boolean
  onArrive: () => void
  reducedMotion: boolean
  limits: OrbitLimits
}

type Flight = {
  startPos: THREE.Vector3
  startTarget: THREE.Vector3
  endPos: THREE.Vector3
  endTarget: THREE.Vector3
  startedAt: number
  durationMs: number
}

const _look = new THREE.Vector3()

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * Burn leftover orbit inertia in one update without leaving a visible kick:
 * dampingFactor=1 applies the residual delta once then zeros it; caller restores pose.
 */
function clearOrbitInertia(ctrl: OrbitControlsHandle) {
  const prevFactor = ctrl.dampingFactor
  const prevDamping = ctrl.enableDamping
  ctrl.enableDamping = true
  ctrl.dampingFactor = 1
  ctrl.update()
  ctrl.dampingFactor = prevFactor
  ctrl.enableDamping = prevDamping
}

/**
 * Wraps OrbitControls with programmatic HOME / hotspot focus.
 * Time-based easeInOutCubic on position + look target; controls stay disabled for
 * the whole flight (via lockOrbit / flyLock) so damping never fights the tween.
 * Arrive fires exactly when u hits 1 — no hard copy pop.
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
  const arriveRef = useRef(onArrive)
  /** Match App initial ticket=0 so mount does not fire a spurious home fly. */
  const lastTicket = useRef(0)
  const homeView = useRef(home)
  const flightRef = useRef<Flight | null>(null)
  const seededTarget = useRef(false)

  homeView.current = home
  arriveRef.current = onArrive

  // Seed look-at once from home; never pass `target` as a controlled prop —
  // R3F would fromArray(home) on every re-render and snap look-at mid-flight / on return.
  useEffect(() => {
    const ctrl = controlsRef.current
    if (!ctrl || seededTarget.current) return
    ctrl.target.set(...homeView.current.target)
    ctrl.update()
    seededTarget.current = true
  }, [])

  useEffect(() => {
    if (cameraCommand.ticket === lastTicket.current) return
    lastTicket.current = cameraCommand.ticket

    const view = resolveCommandView(cameraCommand.focusId, hotspots, homeView.current)
    const endPos = positionFromView(view)
    const endTarget = new THREE.Vector3(...view.target)
    const ctrl = controlsRef.current

    if (reducedMotion) {
      flightRef.current = null
      camera.position.copy(endPos)
      if (ctrl) {
        clearOrbitInertia(ctrl)
        camera.position.copy(endPos)
        ctrl.target.copy(endTarget)
        ctrl.update()
      } else {
        camera.lookAt(endTarget)
      }
      queueMicrotask(() => arriveRef.current())
      return
    }

    const startPos = camera.position.clone()
    const startTarget = (ctrl?.target ?? new THREE.Vector3(...homeView.current.target)).clone()

    if (ctrl) {
      clearOrbitInertia(ctrl)
      // Inertia clear may nudge pose — restore the captured start.
      camera.position.copy(startPos)
      ctrl.target.copy(startTarget)
      camera.lookAt(startTarget)
    }

    flightRef.current = {
      startPos,
      startTarget,
      endPos,
      endTarget,
      startedAt: performance.now(),
      durationMs: cameraCommand.focusId == null ? HOME_DURATION_MS : FOCUS_DURATION_MS,
    }
  }, [cameraCommand.ticket, cameraCommand.focusId, hotspots, reducedMotion, camera])

  useFrame(() => {
    const flight = flightRef.current
    if (!flight) return

    const uRaw = (performance.now() - flight.startedAt) / flight.durationMs
    const u = uRaw >= 1 ? 1 : easeInOutCubic(uRaw < 0 ? 0 : uRaw)

    camera.position.lerpVectors(flight.startPos, flight.endPos, u)
    _look.lerpVectors(flight.startTarget, flight.endTarget, u)

    const ctrl = controlsRef.current
    if (ctrl) ctrl.target.copy(_look)
    // Do not call ctrl.update() while tweening — closed-over sphericalDelta would fight.
    camera.lookAt(_look)

    if (u < 1) return

    flightRef.current = null
    camera.position.copy(flight.endPos)
    if (ctrl) {
      ctrl.target.copy(flight.endTarget)
      clearOrbitInertia(ctrl)
      camera.position.copy(flight.endPos)
      ctrl.target.copy(flight.endTarget)
      ctrl.update()
    } else {
      camera.lookAt(flight.endTarget)
    }
    arriveRef.current()
  })

  const userEnabled = !lockOrbit

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
