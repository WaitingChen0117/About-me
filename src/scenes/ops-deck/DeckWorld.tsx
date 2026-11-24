import { ContactShadows, Grid, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState, type MutableRefObject, type RefObject } from 'react'
import * as THREE from 'three'
import type { SectionId } from '../../content/sections'
import { SceneCameraRig } from '../camera/SceneCameraRig'
import { WorldLabels } from '../labels/WorldLabels'
import type { CameraCommand, CameraView, HotspotDef, ThemeMode } from '../types'
import { AVATAR_POD_POSITION, opsDeckHotspots } from './hotspots'
import { HotspotMesh } from './HotspotMeshes'
import { Operator3D } from './Operator3D'
import { deckPalette, type DeckPalette } from './themeColors'

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
  labelsAway: boolean
  labelPortal: RefObject<HTMLElement | null>
  lowPower: boolean
  isTouch: boolean
  reducedMotion: boolean
  homeView: CameraView
}

export function DeckWorld({
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
  labelsAway,
  labelPortal,
  lowPower,
  isTouch,
  reducedMotion,
  homeView,
}: Props) {
  const palette = useMemo(() => deckPalette(theme), [theme])
  const hotspots = opsDeckHotspots as HotspotDef[]
  const introRef = useRef(0)
  const roomGroup = useRef<THREE.Group>(null)
  const [hoveredId, setHoveredId] = useState<SectionId | null>(null)

  const onOperatorTap = () => {
    const pool = hotspots.map((h) => h.id)
    const next = pool[Math.floor(Math.random() * pool.length)]!
    onSendOperator(next)
  }

  useFrame((_, dt) => {
    if (introRef.current < 1) {
      introRef.current = Math.min(1, introRef.current + dt * 0.9)
    }
    if (roomGroup.current) {
      const e = 1 - Math.pow(1 - Math.min(1, introRef.current / 0.55), 3)
      roomGroup.current.position.y = (1 - e) * -0.18
      roomGroup.current.scale.setScalar(0.96 + 0.04 * e)
    }
  })

  const duty = theme === 'duty'
  const keyIntensity = duty ? 0.72 : 1.08
  const fillIntensity = duty ? 0.42 : 0.26
  const coveIntensity = duty ? 0.85 : 0.22
  const windowGlow = duty ? 0.55 : 0.12
  const fixturePoint = duty ? 0.78 : 0.24

  return (
    <>
      <color attach="background" args={[palette.bg]} />
      <fog attach="fog" args={[palette.bg, lowPower ? 14 : 12, lowPower ? 30 : 26]} />

      <hemisphereLight
        color={duty ? '#1a2a44' : '#e8eef8'}
        groundColor={duty ? '#05080f' : '#b8c4d4'}
        intensity={duty ? (lowPower ? 0.36 : 0.26) : 0.55}
      />
      <ambientLight intensity={duty ? (lowPower ? 0.26 : 0.16) : 0.44} />

      <directionalLight
        position={[6.2, 10.5, 4.2]}
        intensity={lowPower ? keyIntensity * 1.1 : keyIntensity}
        castShadow={!lowPower}
        shadow-mapSize-width={lowPower ? 512 : 1024}
        shadow-mapSize-height={lowPower ? 512 : 1024}
        shadow-bias={-0.00025}
        shadow-camera-far={28}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <directionalLight position={[-5.5, 4.2, -2.5]} intensity={fillIntensity} color={palette.rim} />

      {/* Duty-mode cove / fixture points — deepen theme read */}
      <pointLight
        position={[0, 3.15, -1.2]}
        intensity={coveIntensity}
        color={palette.accent}
        distance={14}
        decay={2}
      />
      <pointLight
        position={[-3.8, 2.4, 0.6]}
        intensity={fixturePoint * 0.7}
        color={palette.accent2}
        distance={9}
        decay={2}
      />
      <pointLight
        position={[3.8, 2.2, -0.8]}
        intensity={fixturePoint * 0.55}
        color={palette.ok}
        distance={8}
        decay={2}
      />
      <pointLight
        position={[0.2, 1.9, 1.4]}
        intensity={duty ? 0.55 : 0.18}
        color={palette.accent}
        distance={7}
        decay={2}
      />
      <pointLight
        position={[-5.05, 1.8, -1]}
        intensity={windowGlow * (duty ? 1.15 : 0.85)}
        color={palette.accent2}
        distance={10}
        decay={2}
      />

      {/* Outer floor slab */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[22, 18]} />
        <meshStandardMaterial color={palette.floor} roughness={0.94} metalness={0.04} />
      </mesh>

      {!lowPower && (
        <Grid
          position={[0, 0.001, 0]}
          args={[16, 12]}
          cellSize={0.5}
          cellThickness={0.4}
          cellColor={palette.accent2}
          sectionSize={2}
          sectionThickness={0.85}
          sectionColor={palette.accent}
          fadeDistance={15}
          fadeStrength={1.45}
          infiniteGrid={false}
        />
      )}

      <group ref={roomGroup}>
        <CommandRoomShell palette={palette} theme={theme} lowPower={lowPower} />

        {/* Center command island — smaller than former desk diorama */}
        <mesh position={[0.15, 0.05, 0.15]} receiveShadow castShadow>
          <boxGeometry args={[5.6, 0.1, 3.4]} />
          <meshStandardMaterial color={palette.desk} roughness={0.78} metalness={0.08} />
        </mesh>
        <mesh position={[0.15, 0.11, 0.15]} receiveShadow>
          <boxGeometry args={[5.68, 0.02, 3.48]} />
          <meshStandardMaterial color={palette.metal} roughness={0.45} metalness={0.35} />
        </mesh>
        <mesh position={[0.15, -0.32, 0.15]} castShadow>
          <boxGeometry args={[5.1, 0.64, 3.0]} />
          <meshStandardMaterial color={palette.metal} roughness={0.58} metalness={0.32} />
        </mesh>

        {/* Island status LEDs — stronger duty emissive */}
        <group position={[0.15, 0.14, 1.75]}>
          {[-0.35, 0, 0.35].map((x, i) => (
            <mesh key={x} position={[x, 0, 0]}>
              <sphereGeometry args={[0.055, 12, 12]} />
              <meshStandardMaterial
                color={i === 0 ? palette.ok : i === 1 ? palette.accent : palette.accent2}
                emissive={i === 0 ? palette.ok : i === 1 ? palette.accent : palette.accent2}
                emissiveIntensity={duty ? 0.95 : 0.28}
                roughness={0.3}
              />
            </mesh>
          ))}
        </group>

        {hotspots.map((spot, i) => (
          <HotspotMesh
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

        <AvatarPod
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
          lookAtId={focusId}
        />
      </group>

      {!lowPower && (
        <ContactShadows
          position={[0, 0.011, 0]}
          opacity={duty ? 0.52 : 0.3}
          scale={16}
          blur={2.6}
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
        lockOrbit={Boolean(activeSection || focusId)}
        onArrive={onCameraArrive}
        reducedMotion={reducedMotion}
        limits={{
          minPolarAngle: 0.32,
          maxPolarAngle: Math.PI / 2.15,
          minDistance: isTouch ? 6.2 : 5.4,
          maxDistance: isTouch ? 14 : 15.5,
          enableDamping: !lowPower,
          dampingFactor: isTouch ? 0.12 : 0.08,
          rotateSpeed: isTouch ? 0.52 : 0.7,
          zoomSpeed: isTouch ? 0.62 : 0.85,
        }}
      />
    </>
  )
}

function CommandRoomShell({
  palette,
  theme,
  lowPower,
}: {
  palette: DeckPalette
  theme: ThemeMode
  lowPower: boolean
}) {
  const duty = theme === 'duty'
  const wallEmissive = duty ? 0.08 : 0.02
  const coveEmissive = duty ? 0.72 : 0.14
  const windowEmissive = duty ? 0.48 : 0.08

  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, 1.7, -4.35]} receiveShadow castShadow>
        <boxGeometry args={[11.2, 3.4, 0.16]} />
        <meshStandardMaterial
          color={palette.panel}
          roughness={0.88}
          metalness={0.06}
          emissive={palette.accent2}
          emissiveIntensity={wallEmissive}
        />
      </mesh>
      {/* Back wall trim / console bay ledge */}
      <mesh position={[0, 0.22, -3.95]} receiveShadow castShadow>
        <boxGeometry args={[10.6, 0.44, 0.9]} />
        <meshStandardMaterial color={palette.desk} roughness={0.72} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.46, -3.95]} receiveShadow>
        <boxGeometry args={[10.7, 0.04, 0.96]} />
        <meshStandardMaterial color={palette.metal} roughness={0.42} metalness={0.4} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-5.45, 1.6, -0.4]} receiveShadow castShadow>
        <boxGeometry args={[0.14, 3.2, 8.2]} />
        <meshStandardMaterial color={palette.desk} roughness={0.9} metalness={0.04} />
      </mesh>
      {/* Left wall window strip — duty glow */}
      <mesh position={[-5.36, 1.85, -1.1]}>
        <boxGeometry args={[0.06, 1.1, 3.4]} />
        <meshStandardMaterial
          color={palette.screen}
          emissive={palette.accent2}
          emissiveIntensity={windowEmissive}
          roughness={0.25}
          metalness={0.15}
        />
      </mesh>

      {/* Right wall — partial / open bay with frame */}
      <mesh position={[5.45, 1.55, -1.6]} receiveShadow>
        <boxGeometry args={[0.14, 3.1, 5.4]} />
        <meshStandardMaterial color={palette.desk} roughness={0.9} metalness={0.04} />
      </mesh>
      <mesh position={[5.45, 1.55, 2.55]} receiveShadow>
        <boxGeometry args={[0.14, 3.1, 1.6]} />
        <meshStandardMaterial color={palette.metal} roughness={0.55} metalness={0.28} />
      </mesh>
      {/* Doorway frame on right-front (open boundary cue) */}
      <mesh position={[5.45, 2.95, 1.35]}>
        <boxGeometry args={[0.18, 0.18, 2.4]} />
        <meshStandardMaterial color={palette.metal} metalness={0.45} roughness={0.4} />
      </mesh>
      <mesh position={[5.45, 1.4, 0.25]}>
        <boxGeometry args={[0.18, 3.0, 0.18]} />
        <meshStandardMaterial color={palette.metal} metalness={0.45} roughness={0.4} />
      </mesh>

      {/* Ceiling cove light bars */}
      {[
        [0, 3.25, -2.8],
        [0, 3.25, -0.4],
        [0, 3.25, 1.8],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[9.2, 0.06, 0.22]} />
          <meshStandardMaterial
            color={palette.metal}
            emissive={palette.accent}
            emissiveIntensity={coveEmissive * (i === 1 ? 1.15 : 0.85)}
            roughness={0.35}
            metalness={0.4}
          />
        </mesh>
      ))}

      {/* Floor zones — rear bay / island ring / front walk */}
      {!lowPower && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, -3.5]}>
            <planeGeometry args={[10.2, 1.6]} />
            <meshBasicMaterial color={palette.accent2} transparent opacity={duty ? 0.1 : 0.06} depthWrite={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.15, 0.003, 0.15]}>
            <planeGeometry args={[6.2, 4.0]} />
            <meshBasicMaterial color={palette.accent} transparent opacity={duty ? 0.07 : 0.04} depthWrite={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 2.9]}>
            <planeGeometry args={[10.4, 1.4]} />
            <meshBasicMaterial color={palette.metal} transparent opacity={duty ? 0.12 : 0.07} depthWrite={false} />
          </mesh>
        </>
      )}

      {/* Baseboards */}
      <mesh position={[0, 0.08, -4.24]}>
        <boxGeometry args={[11.0, 0.16, 0.08]} />
        <meshStandardMaterial color={palette.metal} roughness={0.5} metalness={0.35} />
      </mesh>
      <mesh position={[-5.35, 0.08, -0.4]}>
        <boxGeometry args={[0.08, 0.16, 8.0]} />
        <meshStandardMaterial color={palette.metal} roughness={0.5} metalness={0.35} />
      </mesh>
    </group>
  )
}

function AvatarPod({
  open,
  onToggle,
  palette,
  theme,
  introRef,
}: {
  open: boolean
  onToggle: () => void
  palette: DeckPalette
  theme: ThemeMode
  introRef: MutableRefObject<number>
}) {
  const [hovered, setHovered] = useState(false)
  const root = useRef<THREE.Group>(null)
  const duty = theme === 'duty'

  useFrame(() => {
    if (!root.current) return
    const appear = Math.min(1, Math.max(0, (introRef.current - 0.08) / 0.4))
    const eased = 1 - Math.pow(1 - appear, 3)
    root.current.scale.setScalar(0.85 + 0.15 * eased)
    root.current.visible = eased > 0.05
  })

  return (
    <group
      ref={root}
      position={AVATAR_POD_POSITION}
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
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.65, 0.7, 24]} />
        <meshStandardMaterial
          color={palette.panel}
          roughness={0.32}
          metalness={0.28}
          emissive={palette.accent}
          emissiveIntensity={open || hovered ? (duty ? 0.42 : 0.28) : duty ? 0.16 : 0.08}
        />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <sphereGeometry args={[0.42, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={palette.accent}
          transparent
          opacity={duty ? 0.36 : 0.2}
          roughness={0.18}
          metalness={0.35}
          emissive={palette.accent}
          emissiveIntensity={open ? (duty ? 0.62 : 0.42) : hovered ? 0.38 : duty ? 0.24 : 0.14}
        />
      </mesh>
      {(open || hovered) && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 0.82, 32]} />
          <meshBasicMaterial color={palette.accent} transparent opacity={0.35} depthWrite={false} />
        </mesh>
      )}
      <Html position={[0, 1.35, 0]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
        <div className={`ops-html-label ops-html-pod${open || hovered ? ' is-hot' : ''}`}>
          <span className="ops-html-kicker">对话舱</span>
          <span className="ops-html-title">AI 分身</span>
        </div>
      </Html>
    </group>
  )
}
