import { useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import type { MutableRefObject } from 'react'
import type { WalkObstacle, WalkRect } from './clampWalk'
import { findPath, isWalkablePoint, type WalkPoint } from './pathfind'

/** Pointer travel above this (css px) counts as orbit drag, not click-to-walk. */
const DRAG_THRESHOLD_PX = 7

type Props = {
  bounds: WalkRect
  obstacles?: WalkObstacle[]
  /** Live operator XZ — used for reachability / pathfinding. */
  fromRef: MutableRefObject<{ x: number; z: number }>
  /**
   * Called only when a reachable path exists.
   * Unreachable clicks (obstacle / OOB / no path) are silent no-ops.
   */
  onWalkPath: (path: WalkPoint[]) => void
  /** Plane size — keep larger than room so edge clicks still resolve. */
  size?: [number, number]
}

/**
 * Invisible floor pick plane. Hotspots / avatar / dock call stopPropagation
 * so their clicks never reach here. Orbit drag is filtered by comparing
 * pointerdown vs click client coords (move events may be stolen by OrbitControls).
 *
 * Hover over blocked / unreachable floor → `not-allowed` cursor.
 */
export function WalkSurface({
  bounds,
  obstacles = [],
  fromRef,
  onWalkPath,
  size = [16, 14],
}: Props) {
  const pointerDown = useRef({ x: 0, y: 0 })
  const cursorBlocked = useRef(false)
  const lastHoverCell = useRef({ c: 1e9, r: 1e9, blocked: false })

  const setCursor = (blocked: boolean) => {
    if (cursorBlocked.current === blocked) return
    cursorBlocked.current = blocked
    document.body.style.cursor = blocked ? 'not-allowed' : 'auto'
  }

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    pointerDown.current = { x: e.clientX, y: e.clientY }
  }

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    const { x, z } = e.point
    // Coarse cell latch so we don't A* on every mousemove pixel.
    const c = Math.round(x / 0.18)
    const r = Math.round(z / 0.18)
    if (c === lastHoverCell.current.c && r === lastHoverCell.current.r) {
      setCursor(lastHoverCell.current.blocked)
      return
    }
    let blocked = !isWalkablePoint(x, z, bounds, obstacles)
    if (!blocked) {
      const from = fromRef.current
      blocked = findPath(from.x, from.z, x, z, bounds, obstacles) == null
    }
    lastHoverCell.current = { c, r, blocked }
    setCursor(blocked)
  }

  const onPointerOut = () => {
    setCursor(false)
  }

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    // Primary button only (some browsers omit button on click → treat as left).
    if (e.button != null && e.button !== 0) return
    const dx = e.clientX - pointerDown.current.x
    const dy = e.clientY - pointerDown.current.y
    if (dx * dx + dy * dy >= DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return
    e.stopPropagation()

    const x = e.point.x
    const z = e.point.z
    // Inside furniture / outside room / no route → silent fail (no marker, no walk).
    if (!isWalkablePoint(x, z, bounds, obstacles)) return
    const from = fromRef.current
    const path = findPath(from.x, from.z, x, z, bounds, obstacles)
    if (!path || path.length < 2) return
    onWalkPath(path)
  }

  return (
    <mesh
      name="walk-surface"
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.012, 0]}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      <planeGeometry args={size} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}
