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
  // Idle screens stay lit enough to read as monitors (esp. night studio)
  const emissive = active ? 0.62 : targeted ? 0.44 : isHovered ? 0.36 : 0.26

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

    // Soft screen / practical breath — rooms feel alive without toon FX
    const breath = 1 + Math.sin(pulse.current * 1.35 + index * 0.7) * 0.08
    g.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return
      if (!obj.name.startsWith('breath-')) return
      const mat = obj.material as THREE.MeshStandardMaterial
      if (typeof mat.emissiveIntensity !== 'number') return
      const base = (obj.userData.baseEmissive as number | undefined) ?? mat.emissiveIntensity
      obj.userData.baseEmissive = base
      mat.emissiveIntensity = base * breath
    })

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
      return <AboutMonitors palette={palette} emissive={emissive} metalRough={metalRough} panelRough={panelRough} />
    case 'experience':
      return <ExperienceBoard palette={palette} emissive={emissive} />
    case 'works':
      return <WorksMonitor palette={palette} emissive={emissive} metalRough={metalRough} />
    case 'projects':
      return <ProjectsShelf palette={palette} emissive={emissive} metalRough={metalRough} />
    case 'articles':
      return <ArticlesCabinet palette={palette} emissive={emissive} panelRough={panelRough} />
    case 'hobbies':
      return <HobbiesTable palette={palette} emissive={emissive} metalRough={metalRough} />
    case 'contact':
      return <ContactLamp palette={palette} emissive={emissive} metalRough={metalRough} panelRough={panelRough} />
    default:
      return null
  }
}

/** Dual ultrawide-ish monitors + keyboard/mouse — identity desk. */
function AboutMonitors({
  palette,
  emissive,
  metalRough,
  panelRough,
}: {
  palette: DeckPalette
  emissive: number
  metalRough: number
  panelRough: number
}) {
  return (
    <group>
      {/* Weighted stand base */}
      <mesh position={[0, 0.76, 0.02]} castShadow receiveShadow>
        <boxGeometry args={[0.72, 0.05, 0.36]} />
        <meshStandardMaterial color={palette.metal} roughness={metalRough} metalness={0.42} />
      </mesh>
      <mesh position={[0, 0.9, 0.0]} castShadow>
        <boxGeometry args={[0.1, 0.28, 0.08]} />
        <meshStandardMaterial color={palette.metal} roughness={0.48} metalness={0.35} />
      </mesh>
      <mesh position={[0, 1.08, -0.02]} castShadow>
        <boxGeometry args={[0.55, 0.06, 0.08]} />
        <meshStandardMaterial color={palette.metal} roughness={0.45} metalness={0.4} />
      </mesh>

      <MonitorPanel
        position={[-0.7, 1.28, 0]}
        width={1.22}
        height={0.78}
        palette={palette}
        emissive={emissive}
        metalRough={metalRough}
        glow={palette.accent}
        breathName="breath-about-l"
        uiBars={[
          [-0.28, 0.18, 0.55, 0.08],
          [-0.1, 0.02, 0.7, 0.06],
          [-0.18, -0.14, 0.48, 0.1],
          [0.22, -0.02, 0.28, 0.32],
        ]}
      />
      <MonitorPanel
        position={[0.7, 1.28, 0]}
        width={1.22}
        height={0.78}
        palette={palette}
        emissive={emissive * 0.9}
        metalRough={metalRough}
        glow={palette.glow}
        breathName="breath-about-r"
        uiBars={[
          [-0.32, 0.2, 0.42, 0.07],
          [0.12, 0.12, 0.38, 0.22],
          [-0.2, -0.12, 0.62, 0.08],
          [-0.05, -0.24, 0.5, 0.05],
        ]}
      />

      {/* Webcam nub */}
      <mesh position={[0, 1.72, 0.02]} castShadow>
        <boxGeometry args={[0.12, 0.06, 0.06]} />
        <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.45} />
      </mesh>
      <mesh name="breath-about-cam" position={[0, 1.72, 0.055]}>
        <circleGeometry args={[0.018, 10]} />
        <meshStandardMaterial
          color={palette.accent}
          emissive={palette.accent}
          emissiveIntensity={emissive * 0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Keyboard with key-cap suggestion */}
      <mesh position={[0, 0.78, 0.52]} castShadow>
        <boxGeometry args={[1.2, 0.045, 0.4]} />
        <meshStandardMaterial color={palette.panel} roughness={panelRough} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.81, 0.52]}>
        <boxGeometry args={[1.08, 0.02, 0.3]} />
        <meshStandardMaterial color={palette.metal} roughness={0.55} metalness={0.15} />
      </mesh>

      {/* Mouse + pad */}
      <mesh position={[0.78, 0.765, 0.55]} receiveShadow>
        <boxGeometry args={[0.32, 0.012, 0.38]} />
        <meshStandardMaterial color={palette.fabric} roughness={0.92} metalness={0.02} />
      </mesh>
      <mesh position={[0.78, 0.79, 0.55]} castShadow>
        <boxGeometry args={[0.12, 0.04, 0.2]} />
        <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Cable drop under desk lip */}
      <mesh position={[-0.35, 0.55, 0.15]} rotation={[0.2, 0, 0.15]}>
        <cylinderGeometry args={[0.012, 0.012, 0.45, 6]} />
        <meshStandardMaterial color={palette.metal} roughness={0.7} metalness={0.2} />
      </mesh>
    </group>
  )
}

function MonitorPanel({
  position,
  width,
  height,
  palette,
  emissive,
  metalRough,
  glow,
  breathName,
  uiBars,
}: {
  position: [number, number, number]
  width: number
  height: number
  palette: DeckPalette
  emissive: number
  metalRough: number
  glow: string
  breathName: string
  uiBars: [number, number, number, number][]
}) {
  const bezel = 0.07
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, 0.07]} />
        <meshStandardMaterial color={palette.metal} roughness={metalRough} metalness={0.42} />
      </mesh>
      <mesh name={breathName} position={[0, 0, 0.042]}>
        <boxGeometry args={[width - bezel, height - bezel, 0.02]} />
        <meshStandardMaterial
          color={palette.screen}
          emissive={glow}
          emissiveIntensity={emissive}
          roughness={0.18}
          metalness={0.04}
        />
      </mesh>
      {uiBars.map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0.055]}>
          <boxGeometry args={[w, h, 0.008]} />
          <meshStandardMaterial
            color={i % 2 ? palette.accent2 : palette.panel}
            emissive={i % 3 === 0 ? glow : palette.accent2}
            emissiveIntensity={emissive * (i % 3 === 0 ? 0.55 : 0.22)}
            roughness={0.4}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
      {/* Bottom chin / logo strip */}
      <mesh position={[0, -(height / 2) + 0.04, 0.04]}>
        <boxGeometry args={[width * 0.35, 0.02, 0.01]} />
        <meshStandardMaterial color={palette.panel} roughness={0.5} metalness={0.2} />
      </mesh>
    </group>
  )
}

/** Corkboard timeline — sticky notes + photo strip + pin rail. */
function ExperienceBoard({ palette, emissive }: { palette: DeckPalette; emissive: number }) {
  const notes: { x: number; y: number; w: number; h: number; accent: boolean; rot: number }[] = [
    { x: -0.48, y: 0.28, w: 0.3, h: 0.26, accent: true, rot: -0.08 },
    { x: -0.12, y: 0.38, w: 0.26, h: 0.22, accent: false, rot: 0.06 },
    { x: 0.22, y: 0.22, w: 0.32, h: 0.28, accent: true, rot: 0.04 },
    { x: 0.48, y: 0.4, w: 0.24, h: 0.2, accent: false, rot: -0.05 },
    { x: -0.28, y: -0.12, w: 0.34, h: 0.24, accent: false, rot: 0.03 },
    { x: 0.12, y: -0.18, w: 0.28, h: 0.22, accent: true, rot: -0.07 },
    { x: 0.42, y: -0.05, w: 0.22, h: 0.18, accent: false, rot: 0.09 },
  ]

  return (
    <group>
      {/* Frame */}
      <mesh position={[0, 1.2, -0.02]} castShadow receiveShadow>
        <boxGeometry args={[1.72, 1.32, 0.05]} />
        <meshStandardMaterial color={palette.wood} roughness={0.78} metalness={0.05} />
      </mesh>
      {/* Cork face */}
      <mesh position={[0, 1.2, 0.02]} castShadow>
        <boxGeometry args={[1.58, 1.18, 0.04]} />
        <meshStandardMaterial color={palette.desk} roughness={0.92} metalness={0.02} />
      </mesh>
      {/* Top pin rail */}
      <mesh position={[0, 1.72, 0.05]}>
        <boxGeometry args={[1.5, 0.04, 0.04]} />
        <meshStandardMaterial color={palette.metal} roughness={0.45} metalness={0.35} />
      </mesh>

      {notes.map((n, i) => (
        <group key={i} position={[n.x, 1.2 + n.y, 0.06]} rotation={[0, 0, n.rot]}>
          <mesh castShadow>
            <boxGeometry args={[n.w, n.h, 0.025]} />
            <meshStandardMaterial
              color={n.accent ? palette.accent : palette.panel}
              emissive={n.accent ? palette.accent : palette.accent2}
              emissiveIntensity={emissive * (n.accent ? 0.85 : 0.28)}
              roughness={0.62}
            />
          </mesh>
          {/* Pin head */}
          <mesh position={[0, n.h * 0.42, 0.02]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color={palette.metal} roughness={0.35} metalness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Photo strip */}
      <mesh position={[-0.02, 0.78, 0.07]} castShadow>
        <boxGeometry args={[0.95, 0.22, 0.02]} />
        <meshStandardMaterial color={palette.panel} roughness={0.55} metalness={0.08} />
      </mesh>
      {[-0.32, -0.1, 0.12, 0.34].map((x, i) => (
        <mesh key={x} name={i === 1 ? 'breath-exp-photo' : undefined} position={[x, 0.78, 0.085]}>
          <boxGeometry args={[0.18, 0.15, 0.01]} />
          <meshStandardMaterial
            color={palette.screen}
            emissive={i % 2 ? palette.glow : palette.accent2}
            emissiveIntensity={emissive * 0.35}
            roughness={0.4}
          />
        </mesh>
      ))}

      {/* Shelf ledge under board */}
      <mesh position={[0, 0.52, 0.05]} castShadow>
        <boxGeometry args={[1.7, 0.07, 0.14]} />
        <meshStandardMaterial color={palette.metal} roughness={0.5} metalness={0.28} />
      </mesh>
    </group>
  )
}

/** Articulated side monitor + phone mockup — works preview. */
function WorksMonitor({
  palette,
  emissive,
  metalRough,
}: {
  palette: DeckPalette
  emissive: number
  metalRough: number
}) {
  return (
    <group>
      <mesh position={[0, 0.76, 0.05]} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 0.06, 14]} />
        <meshStandardMaterial color={palette.metal} roughness={metalRough} metalness={0.42} />
      </mesh>
      {/* Arm segments */}
      <mesh position={[0.05, 0.95, 0]} rotation={[0, 0, 0.35]} castShadow>
        <boxGeometry args={[0.08, 0.38, 0.08]} />
        <meshStandardMaterial color={palette.metal} roughness={0.42} metalness={0.4} />
      </mesh>
      <mesh position={[0.18, 1.18, -0.02]} rotation={[0.15, 0, -0.5]} castShadow>
        <boxGeometry args={[0.07, 0.32, 0.07]} />
        <meshStandardMaterial color={palette.metal} roughness={0.42} metalness={0.4} />
      </mesh>

      <MonitorPanel
        position={[0.05, 1.42, 0.05]}
        width={1.0}
        height={0.72}
        palette={palette}
        emissive={emissive}
        metalRough={metalRough}
        glow={palette.accent}
        breathName="breath-works"
        uiBars={[
          [-0.22, 0.16, 0.48, 0.1],
          [0.2, 0.08, 0.22, 0.28],
          [-0.15, -0.12, 0.55, 0.08],
          [-0.05, -0.24, 0.4, 0.05],
        ]}
      />

      {/* Phone / sample device on desk */}
      <mesh position={[0.48, 0.82, 0.35]} rotation={[1.25, 0, 0.35]} castShadow>
        <boxGeometry args={[0.18, 0.34, 0.03]} />
        <meshStandardMaterial color={palette.metal} roughness={0.35} metalness={0.45} />
      </mesh>
      <mesh name="breath-works-phone" position={[0.48, 0.84, 0.36]} rotation={[1.25, 0, 0.35]}>
        <boxGeometry args={[0.14, 0.28, 0.012]} />
        <meshStandardMaterial
          color={palette.screen}
          emissive={palette.glow}
          emissiveIntensity={emissive * 0.75}
          roughness={0.2}
        />
      </mesh>
    </group>
  )
}

/** Open bookshelf with readable spines + mini tower. */
function ProjectsShelf({
  palette,
  emissive,
  metalRough,
}: {
  palette: DeckPalette
  emissive: number
  metalRough: number
}) {
  const books: { x: number; y: number; w: number; h: number; d: number; accent: boolean }[] = [
    { x: -0.22, y: 0.48, w: 0.08, h: 0.28, d: 0.22, accent: true },
    { x: -0.12, y: 0.5, w: 0.07, h: 0.32, d: 0.2, accent: false },
    { x: -0.02, y: 0.46, w: 0.09, h: 0.24, d: 0.24, accent: false },
    { x: 0.1, y: 0.52, w: 0.06, h: 0.34, d: 0.18, accent: true },
    { x: 0.2, y: 0.48, w: 0.08, h: 0.28, d: 0.22, accent: false },
    { x: -0.18, y: 0.88, w: 0.09, h: 0.26, d: 0.2, accent: false },
    { x: -0.06, y: 0.9, w: 0.07, h: 0.3, d: 0.22, accent: true },
    { x: 0.06, y: 0.86, w: 0.1, h: 0.22, d: 0.24, accent: false },
    { x: 0.18, y: 0.92, w: 0.06, h: 0.32, d: 0.18, accent: false },
    { x: -0.2, y: 1.28, w: 0.08, h: 0.28, d: 0.2, accent: true },
    { x: -0.08, y: 1.26, w: 0.1, h: 0.24, d: 0.24, accent: false },
    { x: 0.06, y: 1.3, w: 0.07, h: 0.3, d: 0.2, accent: false },
    { x: 0.18, y: 1.28, w: 0.08, h: 0.26, d: 0.22, accent: true },
    { x: -0.14, y: 1.68, w: 0.09, h: 0.24, d: 0.2, accent: false },
    { x: 0.0, y: 1.7, w: 0.08, h: 0.28, d: 0.22, accent: true },
    { x: 0.14, y: 1.66, w: 0.1, h: 0.22, d: 0.24, accent: false },
  ]

  return (
    <group>
      {/* Cabinet carcass — open front */}
      <mesh position={[0, 1.05, -0.08]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 2.1, 0.08]} />
        <meshStandardMaterial color={palette.wood} roughness={0.78} metalness={0.05} />
      </mesh>
      {/* Sides */}
      <mesh position={[-0.42, 1.05, 0.08]} castShadow>
        <boxGeometry args={[0.06, 2.1, 0.4]} />
        <meshStandardMaterial color={palette.wood} roughness={0.78} metalness={0.05} />
      </mesh>
      <mesh position={[0.42, 1.05, 0.08]} castShadow>
        <boxGeometry args={[0.06, 2.1, 0.4]} />
        <meshStandardMaterial color={palette.wood} roughness={0.78} metalness={0.05} />
      </mesh>
      {/* Top / bottom */}
      <mesh position={[0, 2.08, 0.08]} castShadow>
        <boxGeometry args={[0.9, 0.06, 0.42]} />
        <meshStandardMaterial color={palette.wood} roughness={0.75} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.05, 0.08]} castShadow>
        <boxGeometry args={[0.9, 0.08, 0.42]} />
        <meshStandardMaterial color={palette.wood} roughness={0.75} metalness={0.05} />
      </mesh>
      {/* Shelves */}
      {[0.35, 0.75, 1.15, 1.55, 1.9].map((y) => (
        <mesh key={y} position={[0, y, 0.08]}>
          <boxGeometry args={[0.82, 0.035, 0.38]} />
          <meshStandardMaterial color={palette.desk} roughness={0.7} metalness={0.06} />
        </mesh>
      ))}

      {books.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, 0.12]} castShadow>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial
            color={b.accent ? palette.accent : i % 3 === 0 ? palette.panel : palette.metal}
            emissive={b.accent ? palette.accent : palette.accent2}
            emissiveIntensity={emissive * (b.accent ? 0.45 : 0.08)}
            roughness={0.65}
            metalness={0.08}
          />
        </mesh>
      ))}

      {/* Small plant on top */}
      <mesh position={[0.18, 2.18, 0.1]} castShadow>
        <cylinderGeometry args={[0.07, 0.08, 0.1, 10]} />
        <meshStandardMaterial color={palette.accent2} roughness={0.7} />
      </mesh>
      <mesh position={[0.18, 2.3, 0.1]}>
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshStandardMaterial color={palette.ok} roughness={0.85} emissive={palette.ok} emissiveIntensity={0.15} />
      </mesh>

      {/* Mini PC tower */}
      <mesh position={[0.62, 0.48, 0.12]} castShadow>
        <boxGeometry args={[0.3, 0.9, 0.4]} />
        <meshStandardMaterial color={palette.metal} roughness={metalRough} metalness={0.4} />
      </mesh>
      {/* Vent slits */}
      {[0.2, 0.32, 0.44, 0.56].map((y) => (
        <mesh key={y} position={[0.62, y, 0.33]}>
          <boxGeometry args={[0.22, 0.03, 0.01]} />
          <meshStandardMaterial color={palette.panel} roughness={0.5} metalness={0.2} />
        </mesh>
      ))}
      <mesh name="breath-projects-led" position={[0.62, 0.72, 0.33]}>
        <boxGeometry args={[0.1, 0.05, 0.015]} />
        <meshStandardMaterial
          color={palette.ok}
          emissive={palette.ok}
          emissiveIntensity={emissive + 0.25}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0.62, 0.18, 0.33]}>
        <boxGeometry args={[0.14, 0.04, 0.01]} />
        <meshStandardMaterial color={palette.panel} roughness={0.45} metalness={0.25} />
      </mesh>
    </group>
  )
}

/** Filing cabinet + notebook stack + pen cup. */
function ArticlesCabinet({
  palette,
  emissive,
  panelRough,
}: {
  palette: DeckPalette
  emissive: number
  panelRough: number
}) {
  return (
    <group>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.98, 1.08, 0.68]} />
        <meshStandardMaterial color={palette.wood} roughness={0.72} metalness={0.05} />
      </mesh>
      {[0.28, 0.55, 0.82].map((y, i) => (
        <group key={y}>
          <mesh position={[0, y, 0.35]}>
            <boxGeometry args={[0.88, 0.22, 0.03]} />
            <meshStandardMaterial color={palette.desk} roughness={0.65} metalness={0.06} />
          </mesh>
          <mesh position={[0, y, 0.38]}>
            <boxGeometry args={[0.22, 0.03, 0.04]} />
            <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.4} />
          </mesh>
          {/* Paper peeking from middle drawer */}
          {i === 1 && (
            <mesh position={[0.15, y, 0.42]} rotation={[0.15, 0, 0.05]}>
              <boxGeometry args={[0.28, 0.02, 0.18]} />
              <meshStandardMaterial color={palette.panel} roughness={0.7} />
            </mesh>
          )}
        </group>
      ))}

      {/* Notebook stack */}
      {[
        { y: 1.14, color: palette.panel, rot: 0.05 },
        { y: 1.21, color: palette.accent2, rot: -0.04 },
        { y: 1.28, color: palette.accent, rot: 0.08 },
      ].map((n, i) => (
        <mesh
          key={i}
          name={i === 2 ? 'breath-articles-note' : undefined}
          position={[0.12, n.y, 0.05]}
          rotation={[0, n.rot, 0]}
          castShadow
        >
          <boxGeometry args={[0.4, 0.055, 0.3]} />
          <meshStandardMaterial
            color={n.color}
            emissive={i === 2 ? palette.accent : palette.accent2}
            emissiveIntensity={emissive * (i === 2 ? 0.45 : 0.12)}
            roughness={panelRough}
          />
        </mesh>
      ))}

      {/* Pen cup */}
      <mesh position={[-0.28, 1.18, 0.08]} castShadow>
        <cylinderGeometry args={[0.07, 0.08, 0.16, 10]} />
        <meshStandardMaterial color={palette.metal} roughness={0.45} metalness={0.35} />
      </mesh>
      <mesh position={[-0.28, 1.3, 0.08]} rotation={[0.15, 0, 0.1]}>
        <cylinderGeometry args={[0.01, 0.01, 0.22, 6]} />
        <meshStandardMaterial color={palette.accent} roughness={0.5} />
      </mesh>
      <mesh position={[-0.26, 1.28, 0.1]} rotation={[-0.2, 0, -0.15]}>
        <cylinderGeometry args={[0.01, 0.01, 0.18, 6]} />
        <meshStandardMaterial color={palette.ok} roughness={0.5} />
      </mesh>
    </group>
  )
}

/** Side table: camera, headphones, plant. */
function HobbiesTable({
  palette,
  emissive,
  metalRough,
}: {
  palette: DeckPalette
  emissive: number
  metalRough: number
}) {
  return (
    <group>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.48, 0.5, 0.07, 22]} />
        <meshStandardMaterial color={palette.wood} roughness={0.7} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.38, 10]} />
        <meshStandardMaterial color={palette.metal} roughness={0.5} metalness={0.28} />
      </mesh>
      <mesh position={[0, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.24, 0.04, 16]} />
        <meshStandardMaterial color={palette.metal} roughness={0.45} metalness={0.35} />
      </mesh>

      {/* Camera body + lens + flash */}
      <mesh position={[-0.14, 0.55, 0.06]} castShadow>
        <boxGeometry args={[0.32, 0.18, 0.2]} />
        <meshStandardMaterial color={palette.metal} roughness={metalRough} metalness={0.42} />
      </mesh>
      <mesh position={[-0.14, 0.62, 0.06]}>
        <boxGeometry args={[0.12, 0.06, 0.12]} />
        <meshStandardMaterial color={palette.panel} roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[-0.14, 0.55, 0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.09, 0.1, 14]} />
        <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.45} />
      </mesh>
      <mesh name="breath-hobbies-lens" position={[-0.14, 0.55, 0.26]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.02, 14]} />
        <meshStandardMaterial
          color={palette.accent}
          emissive={palette.accent}
          emissiveIntensity={emissive}
          roughness={0.25}
        />
      </mesh>

      {/* Over-ear headphones */}
      <mesh position={[0.22, 0.58, 0.12]} rotation={[0.3, -0.4, 0.15]} castShadow>
        <torusGeometry args={[0.12, 0.025, 8, 20, Math.PI]} />
        <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.35} />
      </mesh>
      <mesh position={[0.12, 0.52, 0.14]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.05, 12]} />
        <meshStandardMaterial color={palette.panel} roughness={0.55} metalness={0.15} />
      </mesh>
      <mesh position={[0.32, 0.52, 0.1]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.05, 12]} />
        <meshStandardMaterial color={palette.panel} roughness={0.55} metalness={0.15} />
      </mesh>

      {/* Plant */}
      <mesh position={[0.08, 0.5, -0.18]} castShadow>
        <cylinderGeometry args={[0.09, 0.11, 0.14, 10]} />
        <meshStandardMaterial color={palette.accent2} roughness={0.72} />
      </mesh>
      <mesh position={[0.08, 0.64, -0.18]}>
        <sphereGeometry args={[0.11, 10, 10]} />
        <meshStandardMaterial color={palette.ok} emissive={palette.ok} emissiveIntensity={emissive * 0.35} roughness={0.88} />
      </mesh>
      <mesh position={[0.02, 0.72, -0.14]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color={palette.ok} roughness={0.9} />
      </mesh>
    </group>
  )
}

/** Articulated floor/desk lamp + mail tray with envelopes. */
function ContactLamp({
  palette,
  emissive,
  metalRough,
  panelRough,
}: {
  palette: DeckPalette
  emissive: number
  metalRough: number
  panelRough: number
}) {
  return (
    <group>
      {/* Weighted base */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.24, 0.08, 16]} />
        <meshStandardMaterial color={palette.metal} roughness={metalRough} metalness={0.42} />
      </mesh>
      {/* Stem */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.035, 0.95, 8]} />
        <meshStandardMaterial color={palette.metal} roughness={0.38} metalness={0.48} />
      </mesh>
      {/* Joint */}
      <mesh position={[0.02, 1.02, 0]} castShadow>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial color={palette.metal} roughness={0.35} metalness={0.5} />
      </mesh>
      {/* Boom arm */}
      <mesh position={[0.22, 1.12, 0]} rotation={[0, 0, -0.65]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.48, 8]} />
        <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.45} />
      </mesh>
      {/* Shade */}
      <mesh name="breath-contact-lamp" position={[0.42, 1.22, 0]} rotation={[0, 0, -0.55]} castShadow>
        <coneGeometry args={[0.24, 0.3, 18]} />
        <meshStandardMaterial
          color={palette.lamp}
          emissive={palette.lamp}
          emissiveIntensity={emissive + 0.35}
          roughness={0.32}
          metalness={0.12}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Bulb hint */}
      <mesh position={[0.38, 1.12, 0]}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshStandardMaterial
          color={palette.lamp}
          emissive={palette.lamp}
          emissiveIntensity={emissive + 0.5}
          roughness={0.2}
        />
      </mesh>

      {/* Mail tray */}
      <mesh position={[0.42, 0.08, 0.32]} castShadow>
        <boxGeometry args={[0.5, 0.05, 0.38]} />
        <meshStandardMaterial color={palette.panel} roughness={panelRough} metalness={0.1} />
      </mesh>
      <mesh position={[0.42, 0.14, 0.48]}>
        <boxGeometry args={[0.48, 0.1, 0.02]} />
        <meshStandardMaterial color={palette.metal} roughness={0.45} metalness={0.3} />
      </mesh>
      {/* Envelopes */}
      {[
        { y: 0.12, z: 0.28, rot: 0.08 },
        { y: 0.15, z: 0.3, rot: -0.05 },
        { y: 0.18, z: 0.26, rot: 0.12 },
      ].map((e, i) => (
        <mesh
          key={i}
          name={i === 2 ? 'breath-contact-mail' : undefined}
          position={[0.42, e.y, e.z]}
          rotation={[-0.05, e.rot, 0]}
          castShadow
        >
          <boxGeometry args={[0.36, 0.02, 0.24]} />
          <meshStandardMaterial
            color={i === 1 ? palette.accent2 : palette.panel}
            emissive={i === 2 ? palette.accent2 : '#000000'}
            emissiveIntensity={i === 2 ? emissive * 0.35 : 0}
            roughness={0.7}
          />
        </mesh>
      ))}
    </group>
  )
}
