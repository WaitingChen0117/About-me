import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'
import type { Line2 } from 'three-stdlib'
import { remainingWalkPath, type WalkPoint } from './pathfind'

type Props = {
  path: WalkPoint[] | null
  /** Accent / guide color from scene palette. */
  color: string
  /** Slight Y lift so the stroke clears the floor / shadows. */
  y?: number
  /**
   * Live operator XZ — when set, walked segments are erased each frame
   * so only the remaining route (feet → goal) is drawn.
   */
  followRef?: MutableRefObject<{ x: number; z: number }>
}

/**
 * Planned click-walk route + destination marker.
 * Hidden when path is null/empty (unreachable clicks never publish a path).
 * With `followRef`, the stroke shrinks behind the operator as they walk.
 */
export function WalkGuide({ path, color, y = 0.028, followRef }: Props) {
  const pulse = useRef(0)
  const ring = useRef<THREE.Mesh>(null)
  const disc = useRef<THREE.Mesh>(null)
  const lineRef = useRef<Line2>(null)

  const points = useMemo(() => {
    if (!path || path.length < 2) return null
    return path.map((p) => new THREE.Vector3(p.x, y, p.z))
  }, [path, y])

  const goal = path && path.length > 0 ? path[path.length - 1]! : null
  const pathRef = useRef(path)
  pathRef.current = path

  useFrame((_, dt) => {
    if (!goal) return
    pulse.current += dt * 3.2
    const s = 1 + Math.sin(pulse.current) * 0.08
    if (ring.current) ring.current.scale.setScalar(s)
    if (disc.current) {
      const mat = disc.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.28 + Math.sin(pulse.current) * 0.1
    }

    const line = lineRef.current
    const full = pathRef.current
    if (!line || !full || full.length < 2) return

    if (!followRef) {
      line.visible = true
      return
    }

    const rem = remainingWalkPath(full, followRef.current.x, followRef.current.z)
    if (rem.length < 2) {
      line.visible = false
      return
    }

    // Near-zero stub at arrival — hide stroke, keep destination ring until clear.
    const span = Math.hypot(
      rem[rem.length - 1]!.x - rem[0]!.x,
      rem[rem.length - 1]!.z - rem[0]!.z,
    )
    if (span < 0.05 && rem.length === 2) {
      line.visible = false
      return
    }

    const flat: number[] = []
    for (const p of rem) {
      flat.push(p.x, y, p.z)
    }
    line.geometry.setPositions(flat)
    line.computeLineDistances()
    line.visible = true
  })

  if (!points || !goal) return null

  return (
    <group name="walk-guide">
      <Line
        ref={lineRef}
        points={points}
        color={color}
        lineWidth={2.4}
        transparent
        opacity={0.62}
        depthWrite={false}
      />
      {/* Destination ring — click marker */}
      <mesh
        ref={ring}
        position={[goal.x, y + 0.002, goal.z]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.14, 0.24, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.72}
          depthWrite={false}
        />
      </mesh>
      <mesh
        ref={disc}
        position={[goal.x, y, goal.z]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[0.09, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.32}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
