import { useFrame } from '@react-three/fiber'
import { useRef, useState, type MutableRefObject } from 'react'
import * as THREE from 'three'
import type { SectionId } from '../../content/sections'
import type { HotspotDef } from '../types'
import type { SkylinePalette } from './themeColors'

const HOVER_LIFT = 0.14

type Props = {
  spot: HotspotDef
  palette: SkylinePalette
  active: boolean
  targeted: boolean
  externallyHovered?: boolean
  index?: number
  introRef: MutableRefObject<number>
  onOpen: (id: SectionId) => void
  onHoverChange?: (id: SectionId | null) => void
}

export function SkylineHotspotMesh({
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
  const emissive = active ? 0.42 : targeted ? 0.3 : isHovered ? 0.24 : 0.12

  useFrame((_, dt) => {
    const g = root.current
    if (!g) return

    pulse.current += dt
    const scaleTarget = isHovered || active ? 1.018 : targeted ? 1.01 : 1
    scaleCurrent.current = THREE.MathUtils.damp(scaleCurrent.current, scaleTarget, 10, dt)
    const liftTarget = isHovered && !active ? HOVER_LIFT : 0
    liftCurrent.current = THREE.MathUtils.damp(liftCurrent.current, liftTarget, 12, dt)

    const intro = introRef.current
    const stagger = Math.min(1, Math.max(0, (intro - index * 0.055) / 0.38))
    const eased = 1 - Math.pow(1 - stagger, 3)
    const introLift = (1 - eased) * 0.28
    const s = scaleCurrent.current * (0.84 + 0.16 * eased)

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
        mat.opacity = 0.3 + Math.sin(pulse.current * 2.8) * 0.2
        ring.scale.setScalar(1 + Math.sin(pulse.current * 2.1) * 0.07)
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
      <SkylineHotspotShape id={spot.id} palette={palette} emissive={emissive} highlight={highlight} />
      {targeted && (
        <mesh name="target-ring" position={[0, 0.02, 0.45]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.28, 0.4, 28]} />
          <meshBasicMaterial color={palette.accent} transparent opacity={0.5} depthWrite={false} />
        </mesh>
      )}
      {active && (
        <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.62, 32]} />
          <meshBasicMaterial color={palette.accent2} transparent opacity={0.38} depthWrite={false} />
        </mesh>
      )}
      {isHovered && !active && (
        <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.38, 0.46, 28]} />
          <meshBasicMaterial color={palette.accent} transparent opacity={0.24} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

function SkylineHotspotShape({
  id,
  palette,
  emissive,
  highlight,
}: {
  id: SectionId
  palette: SkylinePalette
  emissive: number
  highlight: boolean
}) {
  const metalRough = highlight ? 0.38 : 0.5
  const woodRough = highlight ? 0.55 : 0.7

  switch (id) {
    case 'about':
      // Window-side identity card stand
      return (
        <group>
          <mesh position={[0, 0.55, 0]} castShadow>
            <boxGeometry args={[0.12, 1.1, 0.12]} />
            <meshStandardMaterial color={palette.metal} roughness={metalRough} metalness={0.45} />
          </mesh>
          <mesh position={[0, 1.2, 0.08]} castShadow>
            <boxGeometry args={[0.72, 0.95, 0.05]} />
            <meshStandardMaterial color={palette.panel} roughness={0.55} metalness={0.08} />
          </mesh>
          <mesh position={[0, 1.35, 0.12]}>
            <boxGeometry args={[0.55, 0.42, 0.02]} />
            <meshStandardMaterial
              color={palette.screen}
              emissive={palette.accent}
              emissiveIntensity={emissive}
              roughness={0.28}
            />
          </mesh>
          <mesh position={[0, 0.95, 0.12]}>
            <boxGeometry args={[0.48, 0.18, 0.02]} />
            <meshStandardMaterial
              color={palette.accent2}
              emissive={palette.accent2}
              emissiveIntensity={emissive * 0.5}
              roughness={0.4}
            />
          </mesh>
        </group>
      )
    case 'experience':
      // Window-sill time light strip
      return (
        <group>
          <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.4, 0.1, 0.42]} />
            <meshStandardMaterial color={palette.ledge} roughness={0.65} metalness={0.12} />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[2.2, 0.04, 0.12]} />
            <meshStandardMaterial
              color={palette.metal}
              emissive={palette.accent}
              emissiveIntensity={emissive}
              roughness={0.35}
              metalness={0.4}
            />
          </mesh>
          {[-0.8, -0.4, 0, 0.4, 0.8].map((x, i) => (
            <mesh key={x} position={[x, 0.56, 0]}>
              <boxGeometry args={[0.22, 0.06, 0.08]} />
              <meshStandardMaterial
                color={i % 2 ? palette.accent : palette.accent2}
                emissive={i % 2 ? palette.accent : palette.accent2}
                emissiveIntensity={emissive * (i === 2 ? 1.2 : 0.7)}
                roughness={0.35}
              />
            </mesh>
          ))}
        </group>
      )
    case 'works':
      // Projection screen on right bay — emissive face so focus never reads as a black slab
      return (
        <group>
          <mesh position={[0, 1.35, 0]} castShadow>
            <boxGeometry args={[0.08, 1.9, 1.55]} />
            <meshStandardMaterial color={palette.metal} roughness={metalRough} metalness={0.45} />
          </mesh>
          <mesh position={[-0.06, 1.35, 0]}>
            <boxGeometry args={[0.04, 1.7, 1.35]} />
            <meshStandardMaterial
              color={palette.screen}
              emissive={palette.accent2}
              emissiveIntensity={Math.max(0.35, emissive + 0.2)}
              roughness={0.22}
            />
          </mesh>
          {/* Soft projected wash on floor */}
          <mesh position={[-0.55, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.1, 1.4]} />
            <meshBasicMaterial
              color={palette.accent}
              transparent
              opacity={0.1 + emissive * 0.15}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[0, 2.35, 0]} castShadow>
            <boxGeometry args={[0.18, 0.08, 1.6]} />
            <meshStandardMaterial color={palette.metal} metalness={0.5} roughness={0.35} />
          </mesh>
        </group>
      )
    case 'projects':
      // Abstract city-node constellation (low-poly pillars + links)
      return (
        <group>
          <mesh position={[0, 0.35, 0]} castShadow>
            <cylinderGeometry args={[0.35, 0.4, 0.12, 8]} />
            <meshStandardMaterial color={palette.metal} roughness={metalRough} metalness={0.4} />
          </mesh>
          {[
            [-0.35, 0.85, -0.15],
            [0.3, 1.05, 0.1],
            [0.05, 0.7, 0.28],
            [-0.15, 1.25, 0.05],
          ].map(([x, y, z], i) => (
            <mesh key={i} position={[x, y, z]} castShadow>
              <boxGeometry args={[0.14, 0.14 + i * 0.04, 0.14]} />
              <meshStandardMaterial
                color={i % 2 ? palette.accent : palette.buildingLit}
                emissive={i % 2 ? palette.accent : palette.accent2}
                emissiveIntensity={emissive}
                roughness={0.35}
                metalness={0.25}
              />
            </mesh>
          ))}
          {/* Link bars */}
          <mesh position={[-0.05, 0.95, -0.02]} rotation={[0, 0.4, 0.55]}>
            <boxGeometry args={[0.6, 0.03, 0.03]} />
            <meshStandardMaterial
              color={palette.accent2}
              emissive={palette.accent2}
              emissiveIntensity={emissive * 0.6}
            />
          </mesh>
          <mesh position={[0.12, 0.9, 0.15]} rotation={[0.3, -0.5, -0.4]}>
            <boxGeometry args={[0.45, 0.03, 0.03]} />
            <meshStandardMaterial
              color={palette.glow}
              emissive={palette.glow}
              emissiveIntensity={emissive * 0.5}
            />
          </mesh>
        </group>
      )
    case 'articles':
      // Bookshelf with embedded terminal screen
      return (
        <group>
          <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.55, 1.9, 0.95]} />
            <meshStandardMaterial color={palette.wood} roughness={woodRough} metalness={0.04} />
          </mesh>
          {[0.45, 0.95, 1.45].map((y) => (
            <mesh key={y} position={[0.05, y, 0]}>
              <boxGeometry args={[0.42, 0.04, 0.85]} />
              <meshStandardMaterial color={palette.panel} roughness={0.6} />
            </mesh>
          ))}
          {[-0.28, -0.08, 0.12, 0.3].map((z, i) => (
            <mesh key={z} position={[0.12, 0.7, z]} castShadow>
              <boxGeometry args={[0.18, 0.32, 0.12]} />
              <meshStandardMaterial
                color={i % 2 ? palette.panel : palette.accent2}
                roughness={0.65}
                emissive={palette.accent}
                emissiveIntensity={emissive * 0.2}
              />
            </mesh>
          ))}
          <mesh position={[0.22, 1.55, 0]}>
            <boxGeometry args={[0.08, 0.45, 0.7]} />
            <meshStandardMaterial
              color={palette.screen}
              emissive={palette.accent}
              emissiveIntensity={emissive}
              roughness={0.25}
            />
          </mesh>
        </group>
      )
    case 'hobbies':
      // Plant + headphones on a low ledge
      return (
        <group>
          <mesh position={[0, 0.28, 0]} castShadow>
            <boxGeometry args={[0.85, 0.12, 0.5]} />
            <meshStandardMaterial color={palette.ledge} roughness={0.6} metalness={0.1} />
          </mesh>
          <mesh position={[-0.22, 0.42, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.1, 0.16, 10]} />
            <meshStandardMaterial color={palette.metal} roughness={0.45} metalness={0.35} />
          </mesh>
          <mesh position={[-0.22, 0.68, 0]} castShadow>
            <sphereGeometry args={[0.16, 10, 10]} />
            <meshStandardMaterial
              color={palette.ok}
              emissive={palette.ok}
              emissiveIntensity={emissive * 0.35}
              roughness={0.7}
            />
          </mesh>
          {/* Headphones */}
          <mesh position={[0.22, 0.48, 0]} castShadow>
            <torusGeometry args={[0.14, 0.035, 8, 16, Math.PI]} />
            <meshStandardMaterial
              color={palette.accent}
              emissive={palette.accent}
              emissiveIntensity={emissive}
              roughness={0.4}
              metalness={0.3}
            />
          </mesh>
          <mesh position={[0.08, 0.42, 0]} castShadow>
            <boxGeometry args={[0.08, 0.12, 0.06]} />
            <meshStandardMaterial color={palette.panel} roughness={0.5} />
          </mesh>
          <mesh position={[0.36, 0.42, 0]} castShadow>
            <boxGeometry args={[0.08, 0.12, 0.06]} />
            <meshStandardMaterial color={palette.panel} roughness={0.5} />
          </mesh>
        </group>
      )
    case 'contact':
      // Wall intercom / entry panel
      return (
        <group>
          <mesh position={[0, 1.05, 0]} castShadow>
            <boxGeometry args={[0.45, 0.85, 0.12]} />
            <meshStandardMaterial color={palette.metal} roughness={metalRough} metalness={0.5} />
          </mesh>
          <mesh position={[0, 1.2, 0.08]}>
            <boxGeometry args={[0.32, 0.28, 0.03]} />
            <meshStandardMaterial
              color={palette.screen}
              emissive={palette.accent2}
              emissiveIntensity={emissive}
              roughness={0.25}
            />
          </mesh>
          <mesh position={[0, 0.85, 0.08]}>
            <cylinderGeometry args={[0.08, 0.08, 0.05, 12]} />
            <meshStandardMaterial
              color={palette.accent}
              emissive={palette.accent}
              emissiveIntensity={emissive}
            />
          </mesh>
          <mesh position={[0, 0.55, 0]} castShadow>
            <boxGeometry args={[0.55, 0.08, 0.18]} />
            <meshStandardMaterial color={palette.metal} metalness={0.45} roughness={0.4} />
          </mesh>
        </group>
      )
    default:
      return null
  }
}
