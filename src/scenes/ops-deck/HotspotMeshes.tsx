import { useFrame } from '@react-three/fiber'
import { useRef, useState, type MutableRefObject } from 'react'
import * as THREE from 'three'
import type { SectionId } from '../../content/sections'
import type { HotspotDef } from '../types'
import type { DeckPalette } from './themeColors'

const HOVER_LIFT = 0.12

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
  const emissive = active ? 0.52 : targeted ? 0.36 : isHovered ? 0.28 : 0.12

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
  const panelRough = highlight ? 0.42 : 0.58

  switch (id) {
    case 'about':
      // Dual main monitors on a monitor stand
      return (
        <group>
          <mesh position={[0, 0.72, 0.05]} castShadow receiveShadow>
            <boxGeometry args={[0.55, 0.08, 0.28]} />
            <meshStandardMaterial color={palette.metal} roughness={metalRough} metalness={0.35} />
          </mesh>
          <mesh position={[0, 0.42, 0.05]} castShadow>
            <boxGeometry args={[0.12, 0.55, 0.1]} />
            <meshStandardMaterial color={palette.metal} roughness={0.5} metalness={0.3} />
          </mesh>
          {/* Left panel */}
          <mesh position={[-0.72, 1.15, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.25, 0.85, 0.08]} />
            <meshStandardMaterial color={palette.metal} roughness={metalRough} metalness={0.4} />
          </mesh>
          <mesh position={[-0.72, 1.15, 0.05]}>
            <boxGeometry args={[1.12, 0.72, 0.03]} />
            <meshStandardMaterial
              color={palette.screen}
              emissive={palette.accent}
              emissiveIntensity={emissive}
              roughness={0.2}
              metalness={0.05}
            />
          </mesh>
          {/* Right panel */}
          <mesh position={[0.72, 1.15, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.25, 0.85, 0.08]} />
            <meshStandardMaterial color={palette.metal} roughness={metalRough} metalness={0.4} />
          </mesh>
          <mesh position={[0.72, 1.15, 0.05]}>
            <boxGeometry args={[1.12, 0.72, 0.03]} />
            <meshStandardMaterial
              color={palette.screen}
              emissive={palette.glow}
              emissiveIntensity={emissive * 0.85}
              roughness={0.2}
              metalness={0.05}
            />
          </mesh>
          {/* Keyboard */}
          <mesh position={[0, 0.76, 0.55]} castShadow>
            <boxGeometry args={[1.15, 0.04, 0.38]} />
            <meshStandardMaterial color={palette.panel} roughness={panelRough} metalness={0.08} />
          </mesh>
        </group>
      )
    case 'experience':
      // Wall corkboard / timeline strip
      return (
        <group>
          <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.55, 1.15, 0.06]} />
            <meshStandardMaterial color={palette.wood} roughness={0.85} metalness={0.04} />
          </mesh>
          {[-0.45, -0.15, 0.15, 0.45].map((x, i) => (
            <mesh key={x} position={[x, 1.05 + (i % 2) * 0.22, 0.05]}>
              <boxGeometry args={[0.28, 0.22, 0.03]} />
              <meshStandardMaterial
                color={i % 2 ? palette.accent : palette.panel}
                emissive={i % 2 ? palette.accent : palette.accent2}
                emissiveIntensity={emissive * (i % 2 ? 1 : 0.35)}
                roughness={0.55}
              />
            </mesh>
          ))}
          <mesh position={[0, 0.52, 0.02]} castShadow>
            <boxGeometry args={[1.6, 0.08, 0.1]} />
            <meshStandardMaterial color={palette.metal} roughness={0.5} metalness={0.25} />
          </mesh>
        </group>
      )
    case 'works':
      // Secondary preview monitor on desk arm
      return (
        <group>
          <mesh position={[0, 0.76, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.14, 0.08, 12]} />
            <meshStandardMaterial color={palette.metal} roughness={metalRough} metalness={0.4} />
          </mesh>
          <mesh position={[0, 1.0, -0.05]} castShadow>
            <boxGeometry args={[0.08, 0.42, 0.08]} />
            <meshStandardMaterial color={palette.metal} roughness={0.45} metalness={0.35} />
          </mesh>
          <mesh position={[0, 1.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.05, 0.78, 0.07]} />
            <meshStandardMaterial color={palette.metal} roughness={metalRough} metalness={0.4} />
          </mesh>
          <mesh position={[0, 1.35, 0.05]}>
            <boxGeometry args={[0.92, 0.64, 0.03]} />
            <meshStandardMaterial
              color={palette.screen}
              emissive={palette.accent}
              emissiveIntensity={emissive}
              roughness={0.18}
            />
          </mesh>
        </group>
      )
    case 'projects':
      // Tall bookshelf + mini tower
      return (
        <group>
          <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.85, 2.1, 0.42]} />
            <meshStandardMaterial color={palette.wood} roughness={0.78} metalness={0.05} />
          </mesh>
          {[0.35, 0.75, 1.15, 1.55, 1.9].map((y) => (
            <mesh key={y} position={[0, y, 0]}>
              <boxGeometry args={[0.82, 0.04, 0.4]} />
              <meshStandardMaterial color={palette.desk} roughness={0.7} metalness={0.06} />
            </mesh>
          ))}
          {[
            [-0.2, 0.55, 0.18],
            [0.18, 0.95, 0.14],
            [-0.12, 1.35, 0.2],
            [0.22, 1.72, 0.16],
          ].map(([x, y, w], i) => (
            <mesh key={i} position={[x, y, 0.05]} castShadow>
              <boxGeometry args={[w, 0.28, 0.28]} />
              <meshStandardMaterial
                color={i % 2 ? palette.accent : palette.panel}
                emissive={i % 2 ? palette.accent : palette.accent2}
                emissiveIntensity={emissive * 0.55}
                roughness={0.6}
              />
            </mesh>
          ))}
          {/* Mini PC tower beside shelf */}
          <mesh position={[0.55, 0.45, 0.1]} castShadow>
            <boxGeometry args={[0.28, 0.85, 0.38]} />
            <meshStandardMaterial color={palette.metal} roughness={metalRough} metalness={0.35} />
          </mesh>
          <mesh position={[0.55, 0.55, 0.3]}>
            <boxGeometry args={[0.12, 0.06, 0.02]} />
            <meshStandardMaterial
              color={palette.ok}
              emissive={palette.ok}
              emissiveIntensity={emissive + 0.2}
            />
          </mesh>
        </group>
      )
    case 'articles':
      // Filing drawers + notebook stack
      return (
        <group>
          <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.95, 1.05, 0.65]} />
            <meshStandardMaterial color={palette.wood} roughness={0.72} metalness={0.05} />
          </mesh>
          {[0.28, 0.55, 0.82].map((y) => (
            <mesh key={y} position={[0, y, 0.34]}>
              <boxGeometry args={[0.82, 0.08, 0.04]} />
              <meshStandardMaterial color={palette.metal} roughness={0.45} metalness={0.3} />
            </mesh>
          ))}
          <mesh position={[0.15, 1.15, 0.05]} castShadow>
            <boxGeometry args={[0.42, 0.08, 0.32]} />
            <meshStandardMaterial
              color={palette.panel}
              emissive={palette.accent}
              emissiveIntensity={emissive * 0.4}
              roughness={0.65}
            />
          </mesh>
          <mesh position={[-0.2, 1.22, 0]} castShadow>
            <boxGeometry args={[0.28, 0.22, 0.22]} />
            <meshStandardMaterial
              color={palette.accent2}
              emissive={palette.accent2}
              emissiveIntensity={emissive * 0.5}
              roughness={0.55}
            />
          </mesh>
        </group>
      )
    case 'hobbies':
      // Side table with personal tools / objects
      return (
        <group>
          <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.42, 0.45, 0.08, 20]} />
            <meshStandardMaterial color={palette.wood} roughness={0.7} metalness={0.05} />
          </mesh>
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 0.36, 10]} />
            <meshStandardMaterial color={palette.metal} roughness={0.5} metalness={0.25} />
          </mesh>
          {/* Camera body */}
          <mesh position={[-0.12, 0.55, 0.05]} castShadow>
            <boxGeometry args={[0.28, 0.16, 0.18]} />
            <meshStandardMaterial color={palette.metal} roughness={metalRough} metalness={0.4} />
          </mesh>
          <mesh position={[-0.12, 0.55, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.06, 14]} />
            <meshStandardMaterial
              color={palette.accent}
              emissive={palette.accent}
              emissiveIntensity={emissive}
            />
          </mesh>
          {/* Plant pot */}
          <mesh position={[0.22, 0.52, -0.05]} castShadow>
            <cylinderGeometry args={[0.1, 0.12, 0.14, 10]} />
            <meshStandardMaterial color={palette.accent2} roughness={0.7} />
          </mesh>
          <mesh position={[0.22, 0.68, -0.05]}>
            <sphereGeometry args={[0.12, 10, 10]} />
            <meshStandardMaterial
              color={palette.ok}
              emissive={palette.ok}
              emissiveIntensity={emissive * 0.45}
              roughness={0.85}
            />
          </mesh>
        </group>
      )
    case 'contact':
      // Desk lamp + mail tray
      return (
        <group>
          <mesh position={[0, 0.08, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.22, 0.06, 14]} />
            <meshStandardMaterial color={palette.metal} roughness={metalRough} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.035, 0.9, 8]} />
            <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.45} />
          </mesh>
          <mesh position={[0.12, 1.05, 0]} rotation={[0, 0, -0.55]} castShadow>
            <coneGeometry args={[0.22, 0.28, 16]} />
            <meshStandardMaterial
              color={palette.lamp}
              emissive={palette.lamp}
              emissiveIntensity={emissive + 0.25}
              roughness={0.35}
              metalness={0.15}
            />
          </mesh>
          <mesh position={[0.35, 0.12, 0.25]} castShadow>
            <boxGeometry args={[0.45, 0.08, 0.35]} />
            <meshStandardMaterial
              color={palette.panel}
              emissive={palette.accent2}
              emissiveIntensity={emissive * 0.3}
              roughness={panelRough}
            />
          </mesh>
        </group>
      )
    default:
      return null
  }
}
