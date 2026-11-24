import { useFrame } from '@react-three/fiber'
import { useRef, useState, type MutableRefObject } from 'react'
import * as THREE from 'three'
import type { SectionId } from '../../content/sections'
import type { HotspotDef } from '../types'
import type { DeckPalette } from './themeColors'

const HOVER_LIFT = 0.14

type Props = {
  spot: HotspotDef
  palette: DeckPalette
  active: boolean
  targeted: boolean
  externallyHovered?: boolean
  index?: number
  introRef: MutableRefObject<number>
  onOpen: (id: SectionId) => void
  onHoverChange?: (id: SectionId | null) => void
}

export function HotspotMesh({
  spot,
  palette,
  active,
  targeted,
  externallyHovered = false,
  index = 0,
  introRef,
  onOpen,
  onHoverChange,
}: Props) {
  const [hovered, setHovered] = useState(false)
  const root = useRef<THREE.Group>(null)
  const pulse = useRef(0)
  const scaleCurrent = useRef(1)
  const liftCurrent = useRef(0)

  const isHovered = hovered || externallyHovered
  const highlight = active || targeted || isHovered
  // Slightly brighter idle screens so duty-mode fixtures read against the room
  const emissive = active ? 0.48 : targeted ? 0.34 : isHovered ? 0.3 : 0.14

  useFrame((_, dt) => {
    const g = root.current
    if (!g) return

    pulse.current += dt
    const scaleTarget = isHovered || active ? 1.02 : targeted ? 1.012 : 1
    scaleCurrent.current = THREE.MathUtils.damp(scaleCurrent.current, scaleTarget, 10, dt)
    const liftTarget = isHovered && !active ? HOVER_LIFT : 0
    liftCurrent.current = THREE.MathUtils.damp(liftCurrent.current, liftTarget, 12, dt)

    const intro = introRef.current
    const stagger = Math.min(1, Math.max(0, (intro - index * 0.06) / 0.35))
    const eased = 1 - Math.pow(1 - stagger, 3)
    const introLift = (1 - eased) * 0.35
    const s = scaleCurrent.current * (0.82 + 0.18 * eased)

    g.scale.setScalar(s)
    g.position.set(
      spot.position[0],
      spot.position[1] + introLift + liftCurrent.current,
      spot.position[2],
    )
    g.visible = eased > 0.02

    if (targeted) {
      const ring = g.getObjectByName('target-ring') as THREE.Mesh | undefined
      if (ring) {
        const mat = ring.material as THREE.MeshBasicMaterial
        mat.opacity = 0.35 + Math.sin(pulse.current * 3.2) * 0.25
        ring.scale.setScalar(1 + Math.sin(pulse.current * 2.4) * 0.08)
      }
    }

    if (active) {
      const ring = g.getObjectByName('active-ring') as THREE.Mesh | undefined
      if (ring) {
        const mat = ring.material as THREE.MeshBasicMaterial
        mat.opacity = 0.4 + Math.sin(pulse.current * 2) * 0.12
      }
    }
  })

  return (
    <group
      ref={root}
      position={spot.position}
      onClick={(e) => {
        e.stopPropagation()
        onOpen(spot.id)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        onHoverChange?.(spot.id)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        onHoverChange?.(null)
        document.body.style.cursor = 'auto'
      }}
    >
      <HotspotShape id={spot.id} palette={palette} emissive={emissive} highlight={highlight} />
      {targeted && (
        <mesh name="target-ring" position={[0, 0.02, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.42, 28]} />
          <meshBasicMaterial color={palette.accent} transparent opacity={0.55} depthWrite={false} />
        </mesh>
      )}
      {active && (
        <mesh name="active-ring" position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.68, 32]} />
          <meshBasicMaterial color={palette.accent2} transparent opacity={0.45} depthWrite={false} />
        </mesh>
      )}
      {isHovered && !active && (
        <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.5, 28]} />
          <meshBasicMaterial color={palette.accent} transparent opacity={0.28} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

function HotspotShape({
  id,
  palette,
  emissive,
  highlight,
}: {
  id: SectionId
  palette: DeckPalette
  emissive: number
  highlight: boolean
}) {
  const metalRough = highlight ? 0.36 : 0.48
  const panelRough = highlight ? 0.38 : 0.52

  switch (id) {
    case 'about':
      return (
        <group>
          <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.4, 1.7, 0.12]} />
            <meshStandardMaterial color={palette.metal} roughness={metalRough} metalness={0.42} />
          </mesh>
          <mesh position={[0, 0.98, 0.07]}>
            <boxGeometry args={[2.15, 1.4, 0.04]} />
            <meshStandardMaterial
              color={palette.screen}
              emissive={palette.accent}
              emissiveIntensity={emissive}
              roughness={0.22}
              metalness={0.08}
            />
          </mesh>
          <mesh position={[0, 0.08, 0.15]} castShadow>
            <boxGeometry args={[2.5, 0.16, 0.55]} />
            <meshStandardMaterial color={palette.panel} roughness={panelRough} metalness={0.22} />
          </mesh>
        </group>
      )
    case 'experience':
      return (
        <group>
          <mesh position={[0, 0.35, 0]} castShadow>
            <boxGeometry args={[1.6, 0.12, 0.45]} />
            <meshStandardMaterial color={palette.panel} roughness={panelRough} metalness={0.12} />
          </mesh>
          {[-0.5, -0.15, 0.2, 0.55].map((x, i) => (
            <mesh key={x} position={[x, 0.48, 0]}>
              <boxGeometry args={[0.22, 0.18, 0.08]} />
              <meshStandardMaterial
                color={i % 2 ? palette.accent : palette.accent2}
                emissive={i % 2 ? palette.accent : palette.accent2}
                emissiveIntensity={emissive}
                roughness={0.35}
              />
            </mesh>
          ))}
        </group>
      )
    case 'works':
      return (
        <group>
          <mesh position={[0, 0.55, 0]} castShadow>
            <boxGeometry args={[1.1, 0.85, 0.1]} />
            <meshStandardMaterial color={palette.metal} roughness={metalRough} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0.55, 0.06]}>
            <boxGeometry args={[0.95, 0.68, 0.03]} />
            <meshStandardMaterial
              color={palette.screen}
              emissive={palette.accent}
              emissiveIntensity={emissive}
              roughness={0.2}
            />
          </mesh>
          <mesh position={[0, 0.08, 0.05]} castShadow>
            <cylinderGeometry args={[0.12, 0.18, 0.16, 12]} />
            <meshStandardMaterial color={palette.panel} roughness={panelRough} />
          </mesh>
        </group>
      )
    case 'projects':
      return (
        <group>
          <mesh position={[0, 0.85, 0]} castShadow>
            <boxGeometry args={[0.7, 1.7, 0.55]} />
            <meshStandardMaterial color={palette.metal} roughness={metalRough} metalness={0.4} />
          </mesh>
          {[0.35, 0.7, 1.05, 1.4].map((y, i) => (
            <mesh key={y} position={[0.36, y, 0]}>
              <boxGeometry args={[0.04, 0.12, 0.35]} />
              <meshStandardMaterial
                color={i % 2 ? palette.accent : palette.accent2}
                emissive={i % 2 ? palette.accent : palette.accent2}
                emissiveIntensity={emissive}
              />
            </mesh>
          ))}
        </group>
      )
    case 'articles':
      return (
        <group>
          <mesh position={[0, 0.4, 0]} castShadow>
            <boxGeometry args={[0.9, 0.8, 0.7]} />
            <meshStandardMaterial color={palette.panel} roughness={panelRough} metalness={0.1} />
          </mesh>
          {[0.2, 0.4, 0.6].map((y) => (
            <mesh key={y} position={[0, y, 0.36]}>
              <boxGeometry args={[0.82, 0.08, 0.04]} />
              <meshStandardMaterial color={palette.metal} roughness={0.5} metalness={0.3} />
            </mesh>
          ))}
        </group>
      )
    case 'hobbies':
      return (
        <group>
          <mesh position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[0.7, 0.5, 0.55]} />
            <meshStandardMaterial color={palette.panel} roughness={panelRough} />
          </mesh>
          <mesh position={[-0.15, 0.58, 0.05]} castShadow>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshStandardMaterial
              color={palette.accent2}
              emissive={palette.accent2}
              emissiveIntensity={emissive}
            />
          </mesh>
          <mesh position={[0.18, 0.55, -0.05]} castShadow>
            <boxGeometry args={[0.18, 0.18, 0.18]} />
            <meshStandardMaterial
              color={palette.accent}
              emissive={palette.accent}
              emissiveIntensity={emissive}
            />
          </mesh>
        </group>
      )
    case 'contact':
      return (
        <group>
          <mesh position={[0, 0.15, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.28, 0.3, 12]} />
            <meshStandardMaterial color={palette.metal} metalness={0.42} roughness={metalRough} />
          </mesh>
          <mesh position={[0, 0.85, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
            <meshStandardMaterial
              color={palette.accent}
              emissive={palette.accent}
              emissiveIntensity={emissive}
            />
          </mesh>
          <mesh position={[0, 1.5, 0]}>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial
              color={palette.accent2}
              emissive={palette.accent2}
              emissiveIntensity={emissive + 0.15}
            />
          </mesh>
        </group>
      )
    default:
      return null
  }
}
