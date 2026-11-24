import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { SectionId } from '../../content/sections'
import type { HotspotDef } from '../types'
import { OPERATOR_HOME } from './hotspots'
import type { DeckPalette } from './themeColors'

type Props = {
  hotspots: HotspotDef[]
  target: SectionId | null
  ticket: number
  onArrive: (id: SectionId) => void
  onTap: () => void
  palette: DeckPalette
}

const WALK_SPEED = 2.4

export function Operator3D({
  hotspots,
  target,
  ticket,
  onArrive,
  onTap,
  palette,
}: Props) {
  const group = useRef<THREE.Group>(null)
  const pos = useRef(new THREE.Vector3(...OPERATOR_HOME))
  const goal = useRef(new THREE.Vector3(...OPERATOR_HOME))
  const pending = useRef<SectionId | null>(null)
  const arriveRef = useRef(onArrive)
  const walkingRef = useRef(false)

  const [walking, setWalking] = useState(false)
  const [hovered, setHovered] = useState(false)
  const stride = useRef(0)

  const legL = useRef<THREE.Mesh>(null)
  const legR = useRef<THREE.Mesh>(null)

  const materials = useMemo(
    () => ({
      skin: new THREE.MeshStandardMaterial({ color: palette.operatorSkin, roughness: 0.65 }),
      suit: new THREE.MeshStandardMaterial({
        color: palette.operatorSuit,
        roughness: 0.45,
        metalness: 0.15,
        emissive: palette.accent,
        emissiveIntensity: 0.08,
      }),
      leg: new THREE.MeshStandardMaterial({ color: palette.operatorLeg, roughness: 0.7 }),
    }),
    [palette],
  )

  useEffect(() => {
    arriveRef.current = onArrive
  }, [onArrive])

  useEffect(() => {
    if (!target || ticket === 0) return
    const spot = hotspots.find((h) => h.id === target)
    if (!spot) return
    const [x, , z] = spot.position
    // Stand slightly in front of the object
    goal.current.set(x * 0.72, 0, z * 0.72 + (z < 0 ? 0.45 : -0.15))
    pending.current = target
    walkingRef.current = true
    queueMicrotask(() => setWalking(true))
  }, [target, ticket, hotspots])

  useFrame((_, dt) => {
    const g = group.current
    if (!g) return

    const delta = Math.min(dt, 0.05)
    const dist = pos.current.distanceTo(goal.current)

    if (dist > 0.04) {
      const step = Math.min(WALK_SPEED * delta, dist)
      pos.current.lerp(goal.current, step / dist)
      const dir = goal.current.clone().sub(pos.current)
      if (dir.lengthSq() > 1e-6) {
        const angle = Math.atan2(dir.x, dir.z)
        g.rotation.y = angle
      }
      stride.current += delta * 10
      const swing = Math.sin(stride.current) * 0.45
      if (legL.current) legL.current.rotation.x = swing
      if (legR.current) legR.current.rotation.x = -swing
    } else if (pending.current) {
      const arrived = pending.current
      pending.current = null
      walkingRef.current = false
      queueMicrotask(() => setWalking(false))
      if (legL.current) legL.current.rotation.x = 0
      if (legR.current) legR.current.rotation.x = 0
      arriveRef.current(arrived)
    }

    g.position.copy(pos.current)
  })

  return (
    <group
      ref={group}
      position={OPERATOR_HOME}
      onClick={(e) => {
        e.stopPropagation()
        onTap()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
    >
      {/* Head */}
      <mesh position={[0, 0.92, 0]} castShadow material={materials.skin}>
        <sphereGeometry args={[0.12, 12, 12]} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 0.62, 0]} castShadow material={materials.suit}>
        <boxGeometry args={[0.28, 0.34, 0.18]} />
      </mesh>
      {/* Legs */}
      <mesh ref={legL} position={[-0.07, 0.28, 0]} castShadow material={materials.leg}>
        <boxGeometry args={[0.08, 0.32, 0.1]} />
      </mesh>
      <mesh ref={legR} position={[0.07, 0.28, 0]} castShadow material={materials.leg}>
        <boxGeometry args={[0.08, 0.32, 0.1]} />
      </mesh>
      {/* Soft ground marker */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.22, 20]} />
        <meshBasicMaterial
          color={palette.accent}
          transparent
          opacity={hovered || walking ? 0.35 : 0.15}
        />
      </mesh>
      {(hovered || walking) && (
        <Html position={[0, 1.25, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div className="ops-html-tip">{walking ? '巡视中…' : '点我逛逛'}</div>
        </Html>
      )}
    </group>
  )
}
