import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
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
  introRef: MutableRefObject<number>
  /** Override spawn / idle position (defaults to Ops Deck home). */
  home?: [number, number, number]
  /** Optional CSS class for the hover tip bubble. */
  tipClassName?: string
  /** Camera / panel focus — turn to face this hotspot while idle */
  lookAtId?: SectionId | null
}

const WALK_SPEED = 2.55

export function Operator3D({
  hotspots,
  target,
  ticket,
  onArrive,
  onTap,
  palette,
  introRef,
  home = OPERATOR_HOME,
  tipClassName = 'ops-html-tip',
  lookAtId = null,
}: Props) {
  const group = useRef<THREE.Group>(null)
  const pos = useRef(new THREE.Vector3(...home))
  const goal = useRef(new THREE.Vector3(...home))
  const pending = useRef<SectionId | null>(null)
  const arriveRef = useRef(onArrive)

  const [walking, setWalking] = useState(false)
  const [hovered, setHovered] = useState(false)
  const stride = useRef(0)
  const bob = useRef(0)

  const legL = useRef<THREE.Mesh>(null)
  const legR = useRef<THREE.Mesh>(null)
  const armL = useRef<THREE.Mesh>(null)
  const armR = useRef<THREE.Mesh>(null)
  const torso = useRef<THREE.Mesh>(null)
  const marker = useRef<THREE.Mesh>(null)

  const materials = useMemo(
    () => ({
      skin: new THREE.MeshStandardMaterial({
        color: palette.operatorSkin,
        roughness: 0.78,
        metalness: 0.04,
      }),
      suit: new THREE.MeshStandardMaterial({
        color: palette.operatorSuit,
        roughness: 0.55,
        metalness: 0.22,
        emissive: palette.accent2,
        emissiveIntensity: 0.04,
      }),
      leg: new THREE.MeshStandardMaterial({
        color: palette.operatorLeg,
        roughness: 0.8,
        metalness: 0.08,
      }),
      accent: new THREE.MeshStandardMaterial({
        color: palette.accent,
        emissive: palette.accent,
        emissiveIntensity: 0.18,
        roughness: 0.42,
        metalness: 0.35,
      }),
      helm: new THREE.MeshStandardMaterial({
        color: palette.operatorLeg,
        roughness: 0.4,
        metalness: 0.45,
      }),
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
    goal.current.set(x * 0.72, 0, z * 0.72 + (z < 0 ? 0.45 : -0.15))
    pending.current = target
    queueMicrotask(() => setWalking(true))
  }, [target, ticket, hotspots])

  useFrame((_, dt) => {
    const g = group.current
    if (!g) return

    const delta = Math.min(dt, 0.05)
    const dist = pos.current.distanceTo(goal.current)
    const isWalking = dist > 0.04

    if (isWalking) {
      const step = Math.min(WALK_SPEED * delta, dist)
      pos.current.lerp(goal.current, step / dist)
      const dir = goal.current.clone().sub(pos.current)
      if (dir.lengthSq() > 1e-6) {
        const angle = Math.atan2(dir.x, dir.z)
        g.rotation.y = THREE.MathUtils.damp(g.rotation.y, angle, 12, delta)
      }
      stride.current += delta * 11.5
      bob.current = Math.abs(Math.sin(stride.current)) * 0.045
      const swing = Math.sin(stride.current) * 0.62
      const armSwing = Math.sin(stride.current) * 0.55
      if (legL.current) legL.current.rotation.x = swing
      if (legR.current) legR.current.rotation.x = -swing
      if (armL.current) armL.current.rotation.x = -armSwing
      if (armR.current) armR.current.rotation.x = armSwing
    } else {
      bob.current = THREE.MathUtils.damp(bob.current, 0, 8, delta)
      if (pending.current) {
        const arrived = pending.current
        pending.current = null
        queueMicrotask(() => setWalking(false))
        if (legL.current) legL.current.rotation.x = 0
        if (legR.current) legR.current.rotation.x = 0
        if (armL.current) armL.current.rotation.x = 0
        if (armR.current) armR.current.rotation.x = 0
        arriveRef.current(arrived)
      } else {
        if (legL.current) legL.current.rotation.x = THREE.MathUtils.damp(legL.current.rotation.x, 0, 10, delta)
        if (legR.current) legR.current.rotation.x = THREE.MathUtils.damp(legR.current.rotation.x, 0, 10, delta)
        if (armL.current) armL.current.rotation.x = THREE.MathUtils.damp(armL.current.rotation.x, 0, 10, delta)
        if (armR.current) armR.current.rotation.x = THREE.MathUtils.damp(armR.current.rotation.x, 0, 10, delta)

        // Idle: face the focused hotspot (atan2 look-at)
        if (lookAtId) {
          const spot = hotspots.find((h) => h.id === lookAtId)
          if (spot) {
            const dx = spot.position[0] - pos.current.x
            const dz = spot.position[2] - pos.current.z
            if (dx * dx + dz * dz > 1e-4) {
              const angle = Math.atan2(dx, dz)
              g.rotation.y = THREE.MathUtils.damp(g.rotation.y, angle, 6, delta)
            }
          }
        }
      }
    }

    const appear = Math.min(1, Math.max(0, (introRef.current - 0.15) / 0.4))
    const eased = 1 - Math.pow(1 - appear, 3)
    g.scale.setScalar(0.7 + 0.3 * eased)
    g.visible = eased > 0.05
    g.position.set(pos.current.x, bob.current, pos.current.z)

    if (marker.current) {
      const mat = marker.current.material as THREE.MeshBasicMaterial
      const base = hovered || walking ? 0.42 : 0.18
      mat.opacity = walking ? base + Math.sin(stride.current * 0.5) * 0.12 : base
      const pulse = walking ? 1 + Math.sin(stride.current * 0.5) * 0.12 : 1
      marker.current.scale.setScalar(pulse)
    }

    if (torso.current) {
      const mat = torso.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = hovered || walking ? 0.1 : 0.04
    }
  })

  return (
    <group
      ref={group}
      position={home}
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
      {/* Low-poly workwear operator — geometric, not chibi */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[0.28, 0.06, 0.2]} />
        <meshStandardMaterial color={palette.operatorLeg} roughness={0.88} metalness={0.06} />
      </mesh>

      <mesh position={[0, 1.0, 0]} castShadow material={materials.skin}>
        <boxGeometry args={[0.2, 0.22, 0.18]} />
      </mesh>
      <mesh position={[0, 1.1, 0]} castShadow material={materials.helm}>
        <boxGeometry args={[0.22, 0.08, 0.2]} />
      </mesh>
      <mesh position={[0, 1.02, 0.1]}>
        <boxGeometry args={[0.16, 0.03, 0.02]} />
        <meshStandardMaterial
          color={palette.accent}
          emissive={palette.accent}
          emissiveIntensity={hovered || walking ? 0.32 : 0.12}
          roughness={0.35}
          metalness={0.4}
        />
      </mesh>

      <mesh ref={torso} position={[0, 0.68, 0]} castShadow material={materials.suit}>
        <boxGeometry args={[0.34, 0.42, 0.18]} />
      </mesh>
      <mesh position={[0, 0.82, 0.1]} material={materials.accent}>
        <boxGeometry args={[0.14, 0.04, 0.015]} />
      </mesh>
      {/* Shoulder plates */}
      <mesh position={[-0.2, 0.86, 0]} castShadow material={materials.helm}>
        <boxGeometry args={[0.1, 0.08, 0.16]} />
      </mesh>
      <mesh position={[0.2, 0.86, 0]} castShadow material={materials.helm}>
        <boxGeometry args={[0.1, 0.08, 0.16]} />
      </mesh>

      <mesh ref={armL} position={[-0.24, 0.68, 0]} castShadow material={materials.suit}>
        <boxGeometry args={[0.09, 0.3, 0.1]} />
      </mesh>
      <mesh ref={armR} position={[0.24, 0.68, 0]} castShadow material={materials.suit}>
        <boxGeometry args={[0.09, 0.3, 0.1]} />
      </mesh>

      <mesh ref={legL} position={[-0.09, 0.28, 0]} castShadow material={materials.leg}>
        <boxGeometry args={[0.11, 0.38, 0.12]} />
      </mesh>
      <mesh ref={legR} position={[0.09, 0.28, 0]} castShadow material={materials.leg}>
        <boxGeometry args={[0.11, 0.38, 0.12]} />
      </mesh>

      <mesh ref={marker} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <ringGeometry args={[0.16, 0.24, 20]} />
        <meshBasicMaterial color={palette.accent} transparent opacity={0.14} depthWrite={false} />
      </mesh>

      {(hovered || walking) && (
        <Html position={[0, 1.38, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div className={tipClassName}>{walking ? '巡航中' : '派遣巡视'}</div>
        </Html>
      )}
    </group>
  )
}
