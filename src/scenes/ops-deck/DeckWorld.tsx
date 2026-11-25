import { ContactShadows, Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState, type MutableRefObject, type RefObject } from 'react'
import * as THREE from 'three'
import type { SectionId } from '../../content/sections'
import { SceneCameraRig } from '../camera/SceneCameraRig'
import { WorldLabels } from '../labels/WorldLabels'
import { getPalette } from '../../themes/palettes'
import type { CameraCommand, CameraView, HotspotDef, ThemeMode } from '../types'
import { AVATAR_POD_POSITION, opsDeckHotspots } from './hotspots'
import { HotspotMesh } from './HotspotMeshes'
import { Operator3D } from './Operator3D'
import { StudioDecor } from './StudioDecor'
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
  flyLock: boolean
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
  flyLock,
  labelsAway,
  labelPortal,
  lowPower,
  isTouch,
  reducedMotion,
  homeView,
}: Props) {
  const palette = useMemo(() => deckPalette(theme), [theme])
  const lights = useMemo(() => getPalette(theme).lights, [theme])
  const dark = getPalette(theme).family === 'dark'
  const { gl } = useThree()
  const hotspots = opsDeckHotspots as HotspotDef[]
  const introRef = useRef(0)
  const roomGroup = useRef<THREE.Group>(null)
  const [hoveredId, setHoveredId] = useState<SectionId | null>(null)

  useEffect(() => {
    gl.toneMappingExposure = lowPower ? lights.exposureLite : lights.exposure
  }, [gl, lights, lowPower])

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

  const {
    keyIntensity,
    fillIntensity,
    lampIntensity,
    screenFill,
    windowGlow,
    hemiSky,
    hemiGround,
    hemiIntensity,
    hemiIntensityLite,
    ambient,
    ambientLite,
    keyColor,
    keyPosition,
    fillColor,
    windowColor,
    ceilingColor,
    ceilingIntensity,
    fogNear,
    fogNearLite,
    fogFar,
    fogFarLite,
  } = lights

  return (
    <>
      <color attach="background" args={[palette.bg]} />
      {/* Push fog out on dark presets so mid-room furniture doesn't crush to black */}
      <fog
        attach="fog"
        args={[palette.bg, lowPower ? fogNearLite : fogNear, lowPower ? fogFarLite : fogFar]}
      />

      <hemisphereLight
        color={hemiSky}
        groundColor={hemiGround}
        intensity={lowPower ? hemiIntensityLite : hemiIntensity}
      />
      <ambientLight intensity={lowPower ? ambientLite : ambient} />

      <directionalLight
        position={keyPosition}
        intensity={lowPower ? keyIntensity * 1.1 : keyIntensity}
        color={keyColor}
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
      <directionalLight position={[-4.5, 2.8, 3.5]} intensity={fillIntensity} color={fillColor} />

      {/* Practical desk lamp — night gets a slightly warmer pool for lived-in read */}
      <pointLight
        position={[2.95, 1.35, 2.55]}
        intensity={lampIntensity * (dark ? 1.18 : 1)}
        color={palette.lamp}
        distance={dark ? 9 : 9}
        decay={2}
      />
      {dark && (
        <pointLight
          position={[2.85, 1.15, 2.55]}
          intensity={lampIntensity * 0.35}
          color={palette.lamp}
          distance={4.5}
          decay={2}
        />
      )}

      {/* Screen spill — accent from active preset */}
      <pointLight
        position={[0, 1.4, -1.0]}
        intensity={screenFill}
        color={palette.accent}
        distance={dark ? 11 : 6}
        decay={2}
      />
      <pointLight
        position={[2.45, 1.4, -0.95]}
        intensity={screenFill * 0.55}
        color={palette.glow}
        distance={8}
        decay={2}
      />

      {/* Window daylight / city glow */}
      <pointLight
        position={[-5.0, 2.0, -1.0]}
        intensity={windowGlow}
        color={windowColor}
        distance={12}
        decay={2}
      />

      {/* Soft ceiling wash */}
      <pointLight
        position={[0, 3.1, 0.2]}
        intensity={ceilingIntensity}
        color={ceilingColor}
        distance={14}
        decay={2}
      />

      {/* Outer floor slab */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[22, 18]} />
        <meshStandardMaterial color={palette.floor} roughness={0.92} metalness={0.03} />
      </mesh>

      {/* Area rug under desk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.1, 0.004, 0.35]} receiveShadow>
        <planeGeometry args={[5.4, 4.2]} />
        <meshStandardMaterial
          color={palette.fabric}
          roughness={0.95}
          metalness={0.02}
          transparent
          opacity={dark ? 0.55 : 0.72}
        />
      </mesh>

      <group ref={roomGroup}>
        <StudioShell palette={palette} theme={theme} lowPower={lowPower} />

        {/* Main desk surface */}
        <mesh position={[0.1, 0.72, -0.35]} receiveShadow castShadow>
          <boxGeometry args={[4.6, 0.08, 2.0]} />
          <meshStandardMaterial color={palette.desk} roughness={0.55} metalness={0.08} />
        </mesh>
        {/* Desk edge trim */}
        <mesh position={[0.1, 0.68, -0.35]} receiveShadow>
          <boxGeometry args={[4.7, 0.04, 2.1]} />
          <meshStandardMaterial color={palette.wood} roughness={0.62} metalness={0.06} />
        </mesh>
        {/* Desk legs */}
        {[
          [-2.0, 0.34, -1.15],
          [2.2, 0.34, -1.15],
          [-2.0, 0.34, 0.45],
          [2.2, 0.34, 0.45],
        ].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]} castShadow>
            <boxGeometry args={[0.1, 0.68, 0.1]} />
            <meshStandardMaterial color={palette.metal} roughness={0.5} metalness={0.3} />
          </mesh>
        ))}

        {/* Task chair */}
        <group position={[0.05, 0, 1.15]}>
          <mesh position={[0, 0.42, 0]} castShadow>
            <boxGeometry args={[0.72, 0.08, 0.68]} />
            <meshStandardMaterial color={palette.fabric} roughness={0.88} metalness={0.04} />
          </mesh>
          <mesh position={[0, 0.85, -0.28]} castShadow>
            <boxGeometry args={[0.7, 0.75, 0.08]} />
            <meshStandardMaterial color={palette.fabric} roughness={0.88} metalness={0.04} />
          </mesh>
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.08, 0.35, 10]} />
            <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0.05, 0]} castShadow>
            <cylinderGeometry args={[0.32, 0.32, 0.05, 16]} />
            <meshStandardMaterial color={palette.metal} roughness={0.45} metalness={0.35} />
          </mesh>
        </group>

        <StudioDecor palette={palette} theme={theme} lowPower={lowPower} />

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

        <AvatarDock
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
          opacity={dark ? 0.62 : 0.28}
          scale={16}
          blur={2.8}
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

function StudioShell({
  palette,
  theme,
  lowPower,
}: {
  palette: DeckPalette
  theme: ThemeMode
  lowPower: boolean
}) {
  const preset = getPalette(theme)
  const dark = preset.family === 'dark'
  const { wallEmissive, windowEmissive, coveEmissive } = preset.lights

  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, 1.7, -4.35]} receiveShadow castShadow>
        <boxGeometry args={[11.2, 3.4, 0.16]} />
        <meshStandardMaterial
          color={palette.wall}
          roughness={0.92}
          metalness={0.03}
          emissive={dark ? palette.accent2 : palette.lamp}
          emissiveIntensity={wallEmissive}
        />
      </mesh>
      {/* Rear shelf ledge */}
      <mesh position={[0, 0.55, -3.95]} receiveShadow castShadow>
        <boxGeometry args={[8.2, 0.1, 0.55]} />
        <meshStandardMaterial color={palette.wood} roughness={0.7} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.28, -3.95]} castShadow>
        <boxGeometry args={[8.0, 0.5, 0.45]} />
        <meshStandardMaterial color={palette.desk} roughness={0.65} metalness={0.06} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-5.45, 1.6, -0.4]} receiveShadow castShadow>
        <boxGeometry args={[0.14, 3.2, 8.2]} />
        <meshStandardMaterial color={palette.wall} roughness={0.9} metalness={0.03} />
      </mesh>
      {/* Window pane */}
      <mesh position={[-5.36, 1.9, -1.0]}>
        <boxGeometry args={[0.06, 1.4, 2.8]} />
        <meshStandardMaterial
          color={dark ? palette.screen : '#f2f7f9'}
          emissive={dark ? '#243844' : '#fff4d8'}
          emissiveIntensity={windowEmissive}
          roughness={0.2}
          metalness={0.12}
          transparent
          opacity={dark ? 0.85 : 0.55}
        />
      </mesh>
      {/* Window frame */}
      <mesh position={[-5.38, 1.9, -1.0]}>
        <boxGeometry args={[0.04, 1.55, 3.0]} />
        <meshStandardMaterial color={palette.wood} roughness={0.6} metalness={0.08} />
      </mesh>
      <mesh position={[-5.37, 1.9, -1.0]}>
        <boxGeometry args={[0.05, 0.06, 2.8]} />
        <meshStandardMaterial color={palette.wood} roughness={0.55} metalness={0.08} />
      </mesh>

      {/* Right wall — partial open */}
      <mesh position={[5.45, 1.55, -1.6]} receiveShadow>
        <boxGeometry args={[0.14, 3.1, 5.4]} />
        <meshStandardMaterial color={palette.wall} roughness={0.9} metalness={0.03} />
      </mesh>
      <mesh position={[5.45, 1.55, 2.55]} receiveShadow>
        <boxGeometry args={[0.14, 3.1, 1.6]} />
        <meshStandardMaterial color={palette.wood} roughness={0.7} metalness={0.05} />
      </mesh>
      {/* Doorway frame */}
      <mesh position={[5.45, 2.95, 1.35]}>
        <boxGeometry args={[0.18, 0.18, 2.4]} />
        <meshStandardMaterial color={palette.metal} metalness={0.35} roughness={0.45} />
      </mesh>
      <mesh position={[5.45, 1.4, 0.25]}>
        <boxGeometry args={[0.18, 3.0, 0.18]} />
        <meshStandardMaterial color={palette.metal} metalness={0.35} roughness={0.45} />
      </mesh>

      {/* Ceiling strip lights */}
      {[
        [0, 3.25, -2.6],
        [0, 3.25, 0.1],
        [0, 3.25, 2.0],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[8.5, 0.05, 0.18]} />
          <meshStandardMaterial
            color={palette.metal}
            emissive={dark ? palette.accent : palette.lamp}
            emissiveIntensity={coveEmissive * (i === 1 ? 1.2 : 0.8)}
            roughness={0.4}
            metalness={0.35}
          />
        </mesh>
      ))}

      {/* Soft floor wash bands (subtle — no ops grid) */}
      {!lowPower && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, -3.4]}>
            <planeGeometry args={[9.5, 1.2]} />
            <meshBasicMaterial
              color={dark ? palette.accent2 : palette.lamp}
              transparent
              opacity={dark ? 0.06 : 0.05}
              depthWrite={false}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.1, 0.003, 0.2]}>
            <planeGeometry args={[5.2, 3.6]} />
            <meshBasicMaterial
              color={dark ? palette.accent : palette.wood}
              transparent
              opacity={dark ? 0.05 : 0.04}
              depthWrite={false}
            />
          </mesh>
        </>
      )}

      {/* Baseboards */}
      <mesh position={[0, 0.08, -4.24]}>
        <boxGeometry args={[11.0, 0.16, 0.08]} />
        <meshStandardMaterial color={palette.wood} roughness={0.65} metalness={0.08} />
      </mesh>
      <mesh position={[-5.35, 0.08, -0.4]}>
        <boxGeometry args={[0.08, 0.16, 8.0]} />
        <meshStandardMaterial color={palette.wood} roughness={0.65} metalness={0.08} />
      </mesh>
    </group>
  )
}

/** Desk-corner dock for the companion figure — studio-friendly, not a sci-fi pod. */
function AvatarDock({
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
  const lights = getPalette(theme).lights

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
      {/* Raised desk pad */}
      <mesh position={[0, 0.76, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.42, 0.06, 24]} />
        <meshStandardMaterial
          color={palette.panel}
          roughness={0.4}
          metalness={0.18}
          emissive={palette.accent}
          emissiveIntensity={open || hovered ? lights.dockHot : lights.dockIdle}
        />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.28, 0.3, 0.04, 20]} />
        <meshStandardMaterial
          color={palette.metal}
          roughness={0.35}
          metalness={0.3}
          emissive={palette.glow}
          emissiveIntensity={
            open ? lights.dockHot * 1.15 : hovered ? lights.dockHot * 0.75 : lights.dockIdle * 1.1
          }
        />
      </mesh>
      {(open || hovered) && (
        <mesh position={[0, 0.74, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.45, 0.55, 32]} />
          <meshBasicMaterial color={palette.accent} transparent opacity={0.32} depthWrite={false} />
        </mesh>
      )}
      <Html position={[0, 1.25, 0]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
        <div className={`ops-html-label ops-html-pod${open || hovered ? ' is-hot' : ''}`}>
          <span className="ops-html-kicker">桌面分身</span>
          <span className="ops-html-title">AI 分身</span>
        </div>
      </Html>
    </group>
  )
}
