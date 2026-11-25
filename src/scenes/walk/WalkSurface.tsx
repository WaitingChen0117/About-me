import { useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import type { WalkObstacle, WalkRect } from './clampWalk'
import { clampWalkPoint } from './clampWalk'

/** Pointer travel above this (css px) counts as orbit drag, not click-to-walk. */
const DRAG_THRESHOLD_PX = 7

type Props = {
  bounds: WalkRect
  obstacles?: WalkObstacle[]
  /** Called with a clamped floor point when the user clicks empty ground. */
  onWalkTo: (x: number, z: number) => void
  /** Plane size — keep larger than room so edge clicks still resolve. */
  size?: [number, number]
}

/**
 * Invisible floor pick plane. Hotspots / avatar / dock call stopPropagation
 * so their clicks never reach here. Orbit drag is filtered by comparing
 * pointerdown vs click client coords (move events may be stolen by OrbitControls).
 */
export function WalkSurface({
  bounds,
  obstacles = [],
  onWalkTo,
  size = [16, 14],
}: Props) {
  const pointerDown = useRef({ x: 0, y: 0 })

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    pointerDown.current = { x: e.clientX, y: e.clientY }
  }

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    // Primary button only (some browsers omit button on click → treat as left).
    if (e.button != null && e.button !== 0) return
    const dx = e.clientX - pointerDown.current.x
    const dy = e.clientY - pointerDown.current.y
    if (dx * dx + dy * dy >= DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return
    e.stopPropagation()
    const clamped = clampWalkPoint(e.point.x, e.point.z, bounds, obstacles)
    onWalkTo(clamped.x, clamped.z)
  }

  return (
    <mesh
      name="walk-surface"
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.012, 0]}
      onPointerDown={onPointerDown}
      onClick={onClick}
    >
      <planeGeometry args={size} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}
