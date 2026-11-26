import { useFrame } from '@react-three/fiber'
import { useRef, useState, type MutableRefObject } from 'react'
import * as THREE from 'three'
import type { SectionId } from '../../content/sections'
import { SoftBox, SoftMonitor } from '../primitives'
import type { HotspotDef } from '../types'
import type { LabPalette } from './themeColors'

const HOVER_LIFT = 0.14

type Props = {
  spot: HotspotDef
  palette: LabPalette
  active: boolean
  targeted: boolean
  externallyHovered?: boolean
  index?: number
  introRef: MutableRefObject<number>
  onOpen: (id: SectionId) => void
  onHoverChange?: (id: SectionId | null) => void
}

export function CraftHotspotMesh({
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
      <CraftHotspotShape id={spot.id} palette={palette} emissive={emissive} highlight={highlight} />
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

function CraftHotspotShape({
  id,
  palette,
  emissive,
  highlight,
}: {
  id: SectionId
  palette: LabPalette
  emissive: number
  highlight: boolean
}) {
  const woodRough = highlight ? 0.55 : 0.7
  const metalRough = highlight ? 0.38 : 0.5

  switch (id) {
    case 'about':
      // Badge wall / ID board
      return (
        <group>
          <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.9, 1.45, 0.08]} />
            <meshStandardMaterial color={palette.wood} roughness={woodRough} metalness={0.05} />
          </mesh>
          {[
            [-0.45, 1.25],
            [0.2, 1.25],
            [-0.45, 0.85],
            [0.2, 0.85],
          ].map(([x, y], i) => (
            <mesh key={i} position={[x, y, 0.06]} castShadow>
              <boxGeometry args={[0.5, 0.32, 0.03]} />
              <meshStandardMaterial
                color={i % 2 ? palette.canvas : palette.panel}
                roughness={0.55}
                emissive={palette.accent}
                emissiveIntensity={emissive * 0.35}
              />
            </mesh>
          ))}
        </group>
      )
    case 'experience':
      // Wall filmstrip / tape timeline
      return (
        <group>
          <mesh position={[0, 1.1, 0]} castShadow>
            <boxGeometry args={[0.12, 1.6, 0.08]} />
            <meshStandardMaterial color={palette.metal} roughness={metalRough} metalness={0.45} />
          </mesh>
          <mesh position={[0.55, 1.35, 0.02]} castShadow>
            <boxGeometry args={[1.1, 0.08, 0.04]} />
            <meshStandardMaterial color={palette.tape} roughness={0.55} metalness={0.08} />
          </mesh>
          {[-0.05, 0.35, 0.75, 1.15].map((x, i) => (
            <mesh key={x} position={[0.35 + x * 0.15, 1.05 - i * 0.28, 0.06]}>
              <boxGeometry args={[0.55, 0.22, 0.03]} />
              <meshStandardMaterial
                color={palette.canvas}
                emissive={i % 2 ? palette.accent : palette.accent2}
                emissiveIntensity={emissive}
                roughness={0.45}
              />
            </mesh>
          ))}
        </group>
      )
    case 'works':
      // Main timeline desk / canvas table (MiniCut vibe)
      return (
        <group>
          <SoftBox args={[2.6, 0.08, 1.35]} radius={0.03} position={[0, 0.42, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={palette.wood} roughness={woodRough} metalness={0.04} />
          </SoftBox>
          <SoftBox args={[2.35, 0.03, 1.1]} radius={0.015} position={[0, 0.48, 0]} receiveShadow>
            <meshStandardMaterial
              color={palette.canvas}
              emissive={palette.accent}
              emissiveIntensity={emissive * 0.45}
              roughness={0.65}
            />
          </SoftBox>
          <SoftBox args={[2.1, 0.02, 0.12]} radius={0.01} position={[0, 0.52, -0.42]}>
            <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.35} />
          </SoftBox>
          {[-0.7, -0.25, 0.2, 0.65].map((x, i) => (
            <SoftBox key={x} args={[0.28, 0.04, 0.35]} radius={0.012} position={[x, 0.55, -0.15]}>
              <meshStandardMaterial
                color={i === 1 ? palette.accent : palette.panel}
                emissive={i === 1 ? palette.accent : palette.accent2}
                emissiveIntensity={i === 1 ? emissive : emissive * 0.4}
                roughness={0.4}
              />
            </SoftBox>
          ))}
          <SoftBox args={[0.04, 0.12, 0.18]} radius={0.01} position={[0.05, 0.58, -0.42]}>
            <meshStandardMaterial
              color={palette.tape}
              emissive={palette.tape}
              emissiveIntensity={emissive + 0.15}
            />
          </SoftBox>
        </group>
      )
    case 'projects':
      // Prototype lightbox / rack
      return (
        <group>
          <SoftBox args={[1.05, 1.55, 0.55]} radius={0.045} position={[0, 0.95, 0]} castShadow>
            <meshStandardMaterial color={palette.metal} roughness={metalRough} metalness={0.48} />
          </SoftBox>
          <group position={[0, 0.95, 0.22]}>
            <SoftMonitor
              width={0.85}
              height={1.25}
              depth={0.06}
              bezel={0.08}
              frameColor={palette.metal}
              screenColor={palette.screen}
              glow={palette.accent2}
              emissive={emissive}
              metalRough={metalRough}
              castShadow={false}
            />
          </group>
          {[0.4, 0.75, 1.1, 1.45].map((y, i) => (
            <SoftBox key={y} args={[0.05, 0.1, 0.28]} radius={0.012} position={[0.52, y, 0]}>
              <meshStandardMaterial
                color={i % 2 ? palette.accent : palette.ok}
                emissive={i % 2 ? palette.accent : palette.ok}
                emissiveIntensity={emissive}
              />
            </SoftBox>
          ))}
        </group>
      )
    case 'articles':
      // Notebook / folder stack
      return (
        <group>
          {[0, 0.08, 0.16].map((y, i) => (
            <mesh key={y} position={[0.05 * i, 0.35 + y, -0.04 * i]} castShadow rotation={[0, 0.08 * i, 0]}>
              <boxGeometry args={[0.85, 0.06, 0.65]} />
              <meshStandardMaterial
                color={i === 1 ? palette.accent2 : palette.panel}
                roughness={0.7}
                metalness={0.05}
                emissive={palette.accent}
                emissiveIntensity={emissive * (i === 0 ? 0.5 : 0.15)}
              />
            </mesh>
          ))}
          <mesh position={[0.1, 0.62, 0]} castShadow>
            <boxGeometry args={[0.55, 0.45, 0.08]} />
            <meshStandardMaterial color={palette.canvas} roughness={0.6} />
          </mesh>
        </group>
      )
    case 'hobbies':
      // Shelf collectibles
      return (
        <group>
          <mesh position={[0, 0.55, 0]} castShadow>
            <boxGeometry args={[0.95, 0.08, 0.45]} />
            <meshStandardMaterial color={palette.wood} roughness={woodRough} />
          </mesh>
          <mesh position={[0, 0.2, 0]} castShadow>
            <boxGeometry args={[0.08, 0.55, 0.4]} />
            <meshStandardMaterial color={palette.wood} roughness={woodRough} />
          </mesh>
          <mesh position={[-0.25, 0.72, 0]} castShadow>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshStandardMaterial
              color={palette.accent}
              emissive={palette.accent}
              emissiveIntensity={emissive}
            />
          </mesh>
          <mesh position={[0.05, 0.7, 0.05]} castShadow>
            <boxGeometry args={[0.16, 0.2, 0.14]} />
            <meshStandardMaterial
              color={palette.accent2}
              emissive={palette.accent2}
              emissiveIntensity={emissive}
            />
          </mesh>
          <mesh position={[0.28, 0.68, -0.02]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 0.18, 10]} />
            <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.4} />
          </mesh>
        </group>
      )
    case 'contact':
      // Doorway mailbox
      return (
        <group>
          <mesh position={[0, 0.55, 0]} castShadow>
            <boxGeometry args={[0.55, 0.7, 0.35]} />
            <meshStandardMaterial color={palette.metal} roughness={metalRough} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.7, 0.18]}>
            <boxGeometry args={[0.38, 0.08, 0.04]} />
            <meshStandardMaterial
              color={palette.accent}
              emissive={palette.accent}
              emissiveIntensity={emissive}
            />
          </mesh>
          <mesh position={[0, 1.05, 0]} castShadow>
            <boxGeometry args={[0.62, 0.08, 0.4]} />
            <meshStandardMaterial color={palette.metal} metalness={0.45} roughness={0.4} />
          </mesh>
          <mesh position={[0.22, 0.42, 0.2]}>
            <boxGeometry args={[0.06, 0.14, 0.04]} />
            <meshStandardMaterial color={palette.tape} roughness={0.5} />
          </mesh>
        </group>
      )
    default:
      return null
  }
}
