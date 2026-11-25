import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { WalkPoint } from './pathfind'

type Props = {
  path: WalkPoint[] | null
  /** Accent / guide color from scene palette. */
  color: string
  /** Slight Y lift so the stroke clears the floor / shadows. */
  y?: number
}

/**
 * Planned click-walk route + destination marker.
 * Hidden when path is null/empty (unreachable clicks never publish a path).
 */
export function WalkGuide({ path, color, y = 0.028 }: Props) {
  const pulse = useRef(0)
  const ring = useRef<THREE.Mesh>(null)
  const disc = useRef<THREE.Mesh>(null)

  const points = useMemo(() => {
    if (!path || path.length < 2) return null
    return path.map((p) => new THREE.Vector3(p.x, y, p.z))
  }, [path, y])

  const goal = path && path.length > 0 ? path[path.length - 1]! : null

  useFrame((_, dt) => {
    if (!goal) return
    pulse.current += dt * 3.2
    const s = 1 + Math.sin(pulse.current) * 0.08
    if (ring.current) ring.current.scale.setScalar(s)
    if (disc.current) {
      const mat = disc.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.28 + Math.sin(pulse.current) * 0.1
    }
  })

  if (!points || !goal) return null

  return (
    <group name="walk-guide">
      <Line
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
