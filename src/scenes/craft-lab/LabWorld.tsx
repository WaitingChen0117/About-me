import { ContactShadows, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type RefObject,
} from 'react'
import * as THREE from 'three'
import type { SectionId } from '../../content/sections'
import { SceneCameraRig } from '../camera/SceneCameraRig'
import { WorldLabels } from '../labels/WorldLabels'
import { Operator3D, type FreeWalkCommand } from '../ops-deck/Operator3D'
import { getPalette } from '../../themes/palettes'
import type { CameraCommand, CameraView, HotspotDef, ThemeMode } from '../types'
import {
  CRAFT_WALK_BOUNDS,
  CRAFT_WALK_OBSTACLES,
} from '../walk/clampWalk'
import { type WalkPoint } from '../walk/pathfind'
import { WalkGuide } from '../walk/WalkGuide'
import { WalkSurface } from '../walk/WalkSurface'
import { CraftHotspotMesh } from './CraftHotspotMeshes'
import { ASSIST_MONITOR_POSITION, OPERATOR_HOME, craftLabHotspots } from './hotspots'
import { labPalette, type LabPalette } from './themeColors'

const SECTION_TITLES: Record<SectionId, string> = {
  about: '关于我',
  experience: '经历',
  works: '作品',
  projects: '项目',
  articles: '文章',
  hobbies: '爱好',
  contact: '联系',
}

type Props = {
  theme: ThemeMode
  activeSection: SectionId | null
  onFocusThenOpen: (id: SectionId) => void
  onSendOperator: (id: SectionId) => void
  avatarOpen: boolean
  onToggleAvatar: () => void
  operatorTarget: SectionId | null
  operatorTicket: number
  onOperatorArrive: (id: SectionId) => void
  focusId: SectionId | null
  cameraCommand: CameraCommand
  onCameraArrive: () => void
  flyLock: boolean
  labelsAway: boolean
  labelPortal: RefObject<HTMLElement | null>
  lowPower: boolean
  isTouch: boolean
  reducedMotion: boolean
  homeView: CameraView
}

export function LabWorld({
  theme,
  activeSection,
  onFocusThenOpen,
  onSendOperator,
  avatarOpen,
  onToggleAvatar,
  operatorTarget,
  operatorTicket,
  onOperatorArrive,
  focusId,
  cameraCommand,
  onCameraArrive,
  flyLock,
  labelsAway,
  labelPortal,
  lowPower,
  isTouch,
  reducedMotion,
  homeView,
}: Props) {
  const palette = useMemo(() => labPalette(theme), [theme])
  const hotspots = craftLabHotspots as HotspotDef[]
  const introRef = useRef(0)
  const labGroup = useRef<THREE.Group>(null)
  const [hoveredId, setHoveredId] = useState<SectionId | null>(null)
  const [freeWalk, setFreeWalk] = useState<FreeWalkCommand | null>(null)
  const [walkPath, setWalkPath] = useState<WalkPoint[] | null>(null)
  const operatorPosRef = useRef({ x: OPERATOR_HOME[0], z: OPERATOR_HOME[2] })

  const onOperatorTap = () => {
    const pool = hotspots.map((h) => h.id)
    const next = pool[Math.floor(Math.random() * pool.length)]!
    onSendOperator(next)
  }

  const onWalkPath = useCallback((path: WalkPoint[]) => {
    const goal = path[path.length - 1]!
    setWalkPath(path)
    setFreeWalk((prev) => ({
      ticket: (prev?.ticket ?? 0) + 1,
      x: goal.x,
      z: goal.z,
      path,
    }))
  }, [])

  const onFreeWalkDone = useCallback(() => {
    setWalkPath(null)
  }, [])

  useFrame((_, dt) => {
    if (introRef.current < 1) {
      introRef.current = Math.min(1, introRef.current + dt * 0.85)
    }
    if (labGroup.current) {
      const e = 1 - Math.pow(1 - Math.min(1, introRef.current / 0.5), 3)
      labGroup.current.position.y = (1 - e) * -0.16
      labGroup.current.scale.setScalar(0.97 + 0.03 * e)
    }
  })

  const duty = getPalette(theme).family === 'dark'
  const keyIntensity = duty ? 0.86 : 1.08
  const fillIntensity = duty ? 0.38 : 0.28
  const pendantIntensity = duty ? 0.82 : 0.2
  const windowFill = duty ? 0.5 : 0.14

  return (
    <>
      <color attach="background" args={[palette.bg]} />
      <fog attach="fog" args={[palette.bg, lowPower ? 14 : 12.5, lowPower ? 30 : 26]} />

      <hemisphereLight
        color={duty ? '#303840' : '#eceef2'}
        groundColor={duty ? '#0a0c10' : '#a8acb4'}
        intensity={duty ? (lowPower ? 0.42 : 0.34) : 0.54}
      />
      <ambientLight intensity={duty ? (lowPower ? 0.34 : 0.24) : 0.44} />

      <directionalLight
        position={[3.2, 10.2, 2.0]}
        intensity={lowPower ? keyIntensity * 1.1 : keyIntensity}
        castShadow={!lowPower}
        color={duty ? '#e8e0d4' : '#f4f5f7'}
        shadow-mapSize-width={lowPower ? 512 : 1024}
        shadow-mapSize-height={lowPower ? 512 : 1024}
        shadow-bias={-0.00025}
        shadow-camera-far={28}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <directionalLight position={[-6.0, 4.0, -1.5]} intensity={fillIntensity} color={palette.rim} />

      {/* Task / pendant points — duty reads warmer & brighter */}
      <pointLight
        position={[0.2, 3.0, -0.2]}
        intensity={pendantIntensity}
        color={palette.accent}
        distance={12}
        decay={2}
      />
      <pointLight
        position={[3.6, 2.4, -1.2]}
        intensity={pendantIntensity * 0.55}
        color={palette.accent2}
        distance={8}
        decay={2}
      />
      <pointLight
        position={[-3.8, 2.2, -0.6]}
        intensity={pendantIntensity * 0.45}
        color={palette.glow}
        distance={8}
        decay={2}
      />
      <pointLight
        position={[-5.0, 1.9, -1.4]}
        intensity={windowFill}
        color={palette.accent2}
        distance={9}
        decay={2}
      />
      <spotLight
        position={[-1.2, 5.2, 1.8]}
        angle={0.52}
        penumbra={0.72}
        intensity={duty ? 0.42 : 0.2}
        color="#d8d4cc"
        castShadow={false}
        distance={14}
        decay={2}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[22, 18]} />
        <meshStandardMaterial color={palette.floor} roughness={0.88} metalness={0.06} />
      </mesh>

      {!lowPower && (
        <group>
          {[-4, -1.5, 1.2, 3.8].map((x) => (
            <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.002, 0.2]}>
              <planeGeometry args={[0.05, 10]} />
              <meshBasicMaterial
                color={palette.tape}
                transparent
                opacity={duty ? 0.22 : 0.14}
                depthWrite={false}
              />
            </mesh>
          ))}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 2.7]}>
            <planeGeometry args={[11, 0.08]} />
            <meshBasicMaterial
              color={palette.metal}
              transparent
              opacity={duty ? 0.28 : 0.18}
              depthWrite={false}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -2.9]}>
            <planeGeometry args={[10.5, 0.06]} />
            <meshBasicMaterial
              color={palette.accent}
              transparent
              opacity={duty ? 0.12 : 0.07}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}

      <WalkSurface
        bounds={CRAFT_WALK_BOUNDS}
        obstacles={CRAFT_WALK_OBSTACLES}
        fromRef={operatorPosRef}
        onWalkPath={onWalkPath}
      />
      <WalkGuide path={walkPath} color={palette.accent} />

      <group ref={labGroup}>
        <WorkshopShell palette={palette} theme={theme} lowPower={lowPower} />

        {/* Central workbench island */}
        <mesh position={[0.2, 0.2, 0.15]} receiveShadow castShadow>
          <boxGeometry args={[4.8, 0.4, 2.8]} />
          <meshStandardMaterial color={palette.wood} roughness={0.7} metalness={0.08} />
        </mesh>
        <mesh position={[0.2, 0.42, 0.15]} receiveShadow>
          <boxGeometry args={[4.9, 0.05, 2.9]} />
          <meshStandardMaterial color={palette.desk} roughness={0.62} metalness={0.12} />
        </mesh>

        {/* Pendant fixtures over bench — theme-linked emissive */}
        {[
          [-1.1, 2.85, 0.1],
          [1.4, 2.85, 0.1],
        ].map(([x, y, z], i) => (
          <group key={i} position={[x, y, z]}>
            <mesh>
              <cylinderGeometry args={[0.04, 0.04, 0.55, 8]} />
              <meshStandardMaterial color={palette.metal} metalness={0.5} roughness={0.35} />
            </mesh>
            <mesh position={[0, -0.38, 0]}>
              <cylinderGeometry args={[0.22, 0.28, 0.16, 16]} />
              <meshStandardMaterial
                color={palette.metal}
                emissive={palette.accent}
                emissiveIntensity={duty ? 0.85 : 0.16}
                roughness={0.35}
                metalness={0.4}
              />
            </mesh>
          </group>
        ))}

        {hotspots.map((spot, i) => (
          <CraftHotspotMesh
            key={`mesh-${spot.id}`}
            spot={spot}
            palette={palette}
            active={activeSection === spot.id}
            targeted={operatorTarget === spot.id}
            externallyHovered={hoveredId === spot.id}
            index={i}
            introRef={introRef}
            onOpen={onFocusThenOpen}
            onHoverChange={setHoveredId}
          />
        ))}

        <AssistMonitor
          open={avatarOpen}
          onToggle={onToggleAvatar}
          palette={palette}
          theme={theme}
          introRef={introRef}
        />

        <Operator3D
          hotspots={hotspots}
          target={operatorTarget}
          ticket={operatorTicket}
          onArrive={onOperatorArrive}
          onTap={onOperatorTap}
          palette={palette}
          introRef={introRef}
          home={OPERATOR_HOME}
          tipClassName="craft-html-tip"
          lookAtId={focusId}
          freeWalk={freeWalk}
          walkBounds={CRAFT_WALK_BOUNDS}
          walkObstacles={CRAFT_WALK_OBSTACLES}
          onFreeWalkDone={onFreeWalkDone}
          positionRef={operatorPosRef}
        />
      </group>

      {!lowPower && (
        <ContactShadows
          position={[0, 0.011, 0]}
          opacity={duty ? 0.48 : 0.26}
          scale={16}
          blur={2.7}
          far={5}
        />
      )}

      <WorldLabels
        hotspots={hotspots}
        sectionTitles={SECTION_TITLES}
        hoveredId={hoveredId}
        onHover={setHoveredId}
        onSelect={onFocusThenOpen}
        away={labelsAway}
        portal={labelPortal}
      />

      <SceneCameraRig
        home={homeView}
        hotspots={hotspots}
        cameraCommand={cameraCommand}
        lockOrbit={Boolean(activeSection || focusId || flyLock)}
        onArrive={onCameraArrive}
        reducedMotion={reducedMotion}
        limits={{
          minPolarAngle: 0.34,
          maxPolarAngle: Math.PI / 2.12,
          minDistance: isTouch ? 6.4 : 5.5,
          maxDistance: isTouch ? 14.5 : 15.8,
          enableDamping: !lowPower,
          dampingFactor: isTouch ? 0.12 : 0.08,
          rotateSpeed: isTouch ? 0.52 : 0.68,
          zoomSpeed: isTouch ? 0.62 : 0.85,
        }}
      />
    </>
  )
}

function WorkshopShell({
  palette,
  theme,
  lowPower,
}: {
  palette: LabPalette
  theme: ThemeMode
  lowPower: boolean
}) {
  const duty = getPalette(theme).family === 'dark'
  const wallGlow = duty ? 0.1 : 0.025
  const windowGlow = duty ? 0.42 : 0.08
  const coveGlow = duty ? 0.65 : 0.12

  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, 1.75, -4.25]} receiveShadow castShadow>
        <boxGeometry args={[11.4, 3.5, 0.14]} />
        <meshStandardMaterial
          color={palette.panel}
          roughness={0.88}
          metalness={0.04}
          emissive={palette.accent2}
          emissiveIntensity={wallGlow}
        />
      </mesh>
      {/* Tool rail on back wall */}
      <mesh position={[1.9, 2.0, -4.14]} castShadow>
        <boxGeometry args={[2.8, 0.08, 0.08]} />
        <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.5} />
      </mesh>
      {[-0.7, -0.2, 0.3, 0.8, 1.3].map((ox, i) => (
        <mesh key={ox} position={[1.5 + ox, 1.65, -4.1]} castShadow>
          <boxGeometry args={[0.08, 0.5, 0.06]} />
          <meshStandardMaterial
            color={i % 2 ? palette.accent : palette.metal}
            roughness={0.45}
            metalness={0.4}
            emissive={i % 2 ? palette.accent : palette.metal}
            emissiveIntensity={duty && i % 2 ? 0.35 : 0}
          />
        </mesh>
      ))}

      {/* Left wall */}
      <mesh position={[-5.4, 1.6, -0.35]} receiveShadow>
        <boxGeometry args={[0.12, 3.2, 8.0]} />
        <meshStandardMaterial color={palette.desk} roughness={0.9} metalness={0.03} />
      </mesh>
      <mesh position={[-5.32, 1.9, -1.2]}>
        <boxGeometry args={[0.05, 1.2, 3.2]} />
        <meshStandardMaterial
          color={palette.screen}
          emissive={palette.accent2}
          emissiveIntensity={windowGlow}
          roughness={0.28}
        />
      </mesh>

      {/* Right side — semi-open: columns + beam instead of full wall */}
      {[
        [5.35, 1.55, -3.2],
        [5.35, 1.55, -0.6],
        [5.35, 1.55, 2.0],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <boxGeometry args={[0.28, 3.1, 0.28]} />
          <meshStandardMaterial color={palette.metal} roughness={0.5} metalness={0.4} />
        </mesh>
      ))}
      <mesh position={[5.35, 3.05, -0.6]}>
        <boxGeometry args={[0.22, 0.18, 6.0]} />
        <meshStandardMaterial color={palette.metal} metalness={0.45} roughness={0.4} />
      </mesh>
      {/* Partial rear-right panel */}
      <mesh position={[5.35, 1.4, -2.0]} receiveShadow>
        <boxGeometry args={[0.1, 2.8, 2.2]} />
        <meshStandardMaterial color={palette.panel} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Ceiling cove strip */}
      <mesh position={[0, 3.3, -2.6]}>
        <boxGeometry args={[9.5, 0.05, 0.2]} />
        <meshStandardMaterial
          color={palette.metal}
          emissive={palette.accent}
          emissiveIntensity={coveGlow}
          roughness={0.35}
          metalness={0.4}
        />
      </mesh>
      <mesh position={[0, 3.3, 0.4]}>
        <boxGeometry args={[8.5, 0.05, 0.18]} />
        <meshStandardMaterial
          color={palette.metal}
          emissive={palette.glow}
          emissiveIntensity={coveGlow * 0.85}
          roughness={0.35}
          metalness={0.4}
        />
      </mesh>

      {/* Floor zone washes — kept on lite for room read */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, -3.4]}>
        <planeGeometry args={[10.5, 1.5]} />
        <meshBasicMaterial
          color={palette.accent2}
          transparent
          opacity={duty ? (lowPower ? 0.18 : 0.15) : 0.07}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.2, 0.003, 0.15]}>
        <planeGeometry args={[5.6, 3.4]} />
        <meshBasicMaterial
          color={palette.accent}
          transparent
          opacity={duty ? (lowPower ? 0.15 : 0.12) : 0.05}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.6, 0.003, 2.6]}>
        <planeGeometry args={[3.2, 1.8]} />
        <meshBasicMaterial
          color={palette.metal}
          transparent
          opacity={duty ? (lowPower ? 0.2 : 0.16) : 0.08}
          depthWrite={false}
        />
      </mesh>

      {/* Baseboards */}
      <mesh position={[0, 0.08, -4.15]}>
        <boxGeometry args={[11.2, 0.16, 0.08]} />
        <meshStandardMaterial color={palette.metal} roughness={0.5} metalness={0.35} />
      </mesh>
      <mesh position={[-5.3, 0.08, -0.35]}>
        <boxGeometry args={[0.08, 0.16, 7.8]} />
        <meshStandardMaterial color={palette.metal} roughness={0.5} metalness={0.35} />
      </mesh>
    </group>
  )
}

function AssistMonitor({
  open,
  onToggle,
  palette,
  theme,
  introRef,
}: {
  open: boolean
  onToggle: () => void
  palette: LabPalette
  theme: ThemeMode
  introRef: MutableRefObject<number>
}) {
  const [hovered, setHovered] = useState(false)
  const root = useRef<THREE.Group>(null)
  const duty = getPalette(theme).family === 'dark'

  useFrame(() => {
    if (!root.current) return
    const appear = Math.min(1, Math.max(0, (introRef.current - 0.1) / 0.4))
    const eased = 1 - Math.pow(1 - appear, 3)
    root.current.scale.setScalar(0.88 + 0.12 * eased)
    root.current.visible = eased > 0.05
  })

  return (
    <group
      ref={root}
      position={ASSIST_MONITOR_POSITION}
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
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
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.95, 0.72, 0.08]} />
        <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.55, 0.05]}>
        <boxGeometry args={[0.82, 0.58, 0.03]} />
        <meshStandardMaterial
          color={palette.screen}
          emissive={palette.accent2}
          emissiveIntensity={
            open || hovered ? (duty ? 0.38 : 0.24) : duty ? 0.16 : 0.08
          }
          roughness={0.22}
        />
      </mesh>
      <mesh position={[0, 0.12, 0.05]} castShadow>
        <boxGeometry args={[0.35, 0.12, 0.25]} />
        <meshStandardMaterial color={palette.panel} roughness={0.55} />
      </mesh>
      <mesh position={[-0.55, 0.7, -0.05]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
        <meshStandardMaterial color={palette.metal} metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[-0.55, 1.05, 0.15]} castShadow>
        <boxGeometry args={[0.22, 0.08, 0.35]} />
        <meshStandardMaterial
          color={palette.accent}
          emissive={palette.accent}
          emissiveIntensity={open ? (duty ? 0.35 : 0.18) : duty ? 0.14 : 0.06}
        />
      </mesh>
      {(open || hovered) && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.68, 32]} />
          <meshBasicMaterial color={palette.accent} transparent opacity={0.3} depthWrite={false} />
        </mesh>
      )}
      <Html position={[0, 1.15, 0]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
        <div className={`craft-html-label craft-html-pod${open || hovered ? ' is-hot' : ''}`}>
          <span className="craft-html-kicker">副屏对话</span>
          <span className="craft-html-title">AI 分身</span>
        </div>
      </Html>
    </group>
  )
}
