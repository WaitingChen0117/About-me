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
import { SoftBox, SoftColumn, SoftMonitor } from '../primitives'
import { getPalette } from '../../themes/palettes'
import type { CameraCommand, CameraView, HotspotDef, ThemeMode } from '../types'
import {
  SKYLINE_WALK_BOUNDS,
  SKYLINE_WALK_OBSTACLES,
} from '../walk/clampWalk'
import { type WalkPoint } from '../walk/pathfind'
import { WalkGuide } from '../walk/WalkGuide'
import { WalkSurface } from '../walk/WalkSurface'
import { SkylineHotspotMesh } from './SkylineHotspotMeshes'
import {
  DIALOGUE_ORB_POSITION,
  OPERATOR_HOME,
  skylineHotspots,
} from './hotspots'
import { skylinePalette, type SkylinePalette } from './themeColors'

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

export function TerminalWorld({
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
  const palette = useMemo(() => skylinePalette(theme), [theme])
  const hotspots = skylineHotspots as HotspotDef[]
  const introRef = useRef(0)
  const roomGroup = useRef<THREE.Group>(null)
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
    if (roomGroup.current) {
      const e = 1 - Math.pow(1 - Math.min(1, introRef.current / 0.5), 3)
      roomGroup.current.position.y = (1 - e) * -0.16
      roomGroup.current.scale.setScalar(0.97 + 0.03 * e)
    }
  })

  const night = getPalette(theme).family === 'dark'
  const keyIntensity = night ? 0.98 : 1.12
  const fillIntensity = night ? 0.55 : 0.34
  const cityGlow = night ? 1.35 : 0.28
  const consoleGlow = night ? 1.05 : 0.22

  return (
    <>
      <color attach="background" args={[palette.bg]} />
      <fog attach="fog" args={[palette.bg, lowPower ? 18 : 16, lowPower ? 40 : 34]} />

      <hemisphereLight
        color={night ? '#3a4a58' : '#e8eef4'}
        groundColor={night ? '#0a0e14' : '#9aa8b4'}
        intensity={night ? (lowPower ? 0.52 : 0.44) : 0.58}
      />
      <ambientLight intensity={night ? (lowPower ? 0.42 : 0.34) : 0.46} />

      <directionalLight
        position={[2.8, 9.5, 3.2]}
        intensity={lowPower ? keyIntensity * 1.1 : keyIntensity}
        castShadow={!lowPower}
        color={night ? '#e0e6ec' : '#f2f6fa'}
        shadow-mapSize-width={lowPower ? 512 : 1024}
        shadow-mapSize-height={lowPower ? 512 : 1024}
        shadow-bias={-0.00025}
        shadow-camera-far={28}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <directionalLight position={[-5.5, 3.5, -2.0]} intensity={fillIntensity} color={palette.rim} />

      {/* City spill through the window */}
      <pointLight
        position={[0, 2.2, -5.5]}
        intensity={cityGlow}
        color={palette.accent2}
        distance={16}
        decay={2}
      />
      <pointLight
        position={[-2.5, 1.8, -5.2]}
        intensity={cityGlow * 0.65}
        color={palette.glow}
        distance={12}
        decay={2}
      />
      <pointLight
        position={[2.8, 1.6, -5.0]}
        intensity={cityGlow * 0.55}
        color={palette.accent}
        distance={11}
        decay={2}
      />
      {/* Console task lights */}
      <pointLight
        position={[0.1, 2.6, -0.8]}
        intensity={consoleGlow}
        color={palette.accent}
        distance={11}
        decay={2}
      />
      <spotLight
        position={[-1.5, 4.8, 1.5]}
        angle={0.5}
        penumbra={0.75}
        intensity={night ? 0.55 : 0.22}
        color="#c8d0d8"
        castShadow={false}
        distance={14}
        decay={2}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[22, 18]} />
        <meshStandardMaterial color={palette.floor} roughness={0.9} metalness={0.08} />
      </mesh>

      {/* Subtle floor grid — terminal read */}
      {!lowPower && (
        <group>
          {[-3.5, -1.5, 0.5, 2.5].map((z) => (
            <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, z]}>
              <planeGeometry args={[10, 0.03]} />
              <meshBasicMaterial
                color={palette.accent2}
                transparent
                opacity={night ? 0.12 : 0.06}
                depthWrite={false}
              />
            </mesh>
          ))}
          {[-3, -1, 1, 3].map((x) => (
            <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.002, 0]}>
              <planeGeometry args={[0.03, 8]} />
              <meshBasicMaterial
                color={palette.metal}
                transparent
                opacity={night ? 0.1 : 0.05}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      )}

      <WalkSurface
        bounds={SKYLINE_WALK_BOUNDS}
        obstacles={SKYLINE_WALK_OBSTACLES}
        fromRef={operatorPosRef}
        onWalkPath={onWalkPath}
      />
      <WalkGuide path={walkPath} color={palette.accent} followRef={operatorPosRef} />

      <group ref={roomGroup}>
        <TerminalShell palette={palette} theme={theme} lowPower={lowPower} />
        <CitySkyline palette={palette} theme={theme} lowPower={lowPower} />

        {/* Console desk — soft chassis + inset top + kick */}
        <SoftBox args={[3.6, 0.64, 1.35]} radius={0.05} position={[0.15, 0.32, -1.15]} receiveShadow castShadow>
          <meshStandardMaterial color={palette.desk} roughness={0.62} metalness={0.14} />
        </SoftBox>
        <SoftBox args={[3.72, 0.055, 1.42]} radius={0.03} position={[0.15, 0.665, -1.15]} receiveShadow>
          <meshStandardMaterial color={palette.panel} roughness={0.48} metalness={0.22} />
        </SoftBox>
        <SoftBox args={[3.4, 0.08, 0.08]} radius={0.02} position={[0.15, 0.06, -0.52]}>
          <meshStandardMaterial
            color={palette.metal}
            emissive={palette.accent}
            emissiveIntensity={night ? 0.35 : 0.08}
            roughness={0.4}
            metalness={0.4}
          />
        </SoftBox>
        {/* Dual terminal screens */}
        <group position={[-0.55, 1.15, -1.42]} rotation={[0.08, 0.12, 0]}>
          <SoftMonitor
            width={1.15}
            height={0.72}
            depth={0.07}
            frameColor={palette.metal}
            screenColor={palette.screen}
            glow={palette.accent}
            emissive={night ? 0.55 : 0.18}
          />
        </group>
        <group position={[0.75, 1.05, -1.47]} rotation={[0.06, -0.08, 0]}>
          <SoftMonitor
            width={0.95}
            height={0.62}
            depth={0.07}
            frameColor={palette.metal}
            screenColor={palette.screen}
            glow={palette.accent2}
            emissive={night ? 0.45 : 0.14}
          />
        </group>

        {hotspots.map((spot, i) => (
          <SkylineHotspotMesh
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

        <DialogueOrb
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
          tipClassName="skyline-html-tip"
          lookAtId={focusId}
          freeWalk={freeWalk}
          walkBounds={SKYLINE_WALK_BOUNDS}
          walkObstacles={SKYLINE_WALK_OBSTACLES}
          onFreeWalkDone={onFreeWalkDone}
          positionRef={operatorPosRef}
        />
      </group>

      {!lowPower && (
        <ContactShadows
          position={[0, 0.011, 0]}
          opacity={night ? 0.52 : 0.24}
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
          minPolarAngle: 0.96,
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

function TerminalShell({
  palette,
  theme,
  lowPower,
}: {
  palette: SkylinePalette
  theme: ThemeMode
  lowPower: boolean
}) {
  const night = getPalette(theme).family === 'dark'
  const wallGlow = night ? 0.08 : 0.02
  const coveGlow = night ? 0.7 : 0.14

  return (
    <group>
      {/* Semi-open side bays — rear panels + columns (orbit must not hit solid slabs) */}
      <mesh position={[-5.4, 1.7, -2.4]} receiveShadow>
        <boxGeometry args={[0.14, 3.4, 3.6]} />
        <meshStandardMaterial
          color={palette.wall}
          roughness={0.9}
          metalness={0.04}
          emissive={palette.accent2}
          emissiveIntensity={wallGlow}
        />
      </mesh>
      <mesh position={[5.4, 1.7, -2.4]} receiveShadow>
        <boxGeometry args={[0.14, 3.4, 3.6]} />
        <meshStandardMaterial color={palette.wall} roughness={0.9} metalness={0.04} />
      </mesh>
      {[
        [-5.35, 1.55, 0.4],
        [-5.35, 1.55, 2.4],
        [5.35, 1.55, 0.4],
        [5.35, 1.55, 2.4],
      ].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <SoftColumn height={3.1} size={0.26} color={palette.metal} castShadow={!lowPower} />
        </group>
      ))}
      <SoftBox args={[0.2, 0.16, 3.2]} radius={0.035} position={[-5.35, 3.1, 1.4]}>
        <meshStandardMaterial color={palette.metal} metalness={0.48} roughness={0.38} />
      </SoftBox>
      <SoftBox args={[0.2, 0.16, 3.2]} radius={0.035} position={[5.35, 3.1, 1.4]}>
        <meshStandardMaterial color={palette.metal} metalness={0.48} roughness={0.38} />
      </SoftBox>

      {/* Open ceiling — soft beams + cove */}
      {[
        [-3.6, -2.2],
        [-1.2, -2.2],
        [1.2, -2.2],
        [3.6, -2.2],
        [-3.6, 1.2],
        [0, 1.2],
        [3.6, 1.2],
      ].map(([x, z], i) => (
        <SoftBox
          key={i}
          args={[0.16, 0.22, z < 0 ? 3.8 : 3.2]}
          radius={0.035}
          position={[x, 3.35, z]}
          castShadow={!lowPower}
        >
          <meshStandardMaterial color={palette.metal} roughness={0.42} metalness={0.42} />
        </SoftBox>
      ))}
      <SoftBox args={[10.2, 0.06, 0.22]} radius={0.025} position={[0, 3.42, -3.55]}>
        <meshStandardMaterial
          color={palette.metal}
          emissive={palette.accent}
          emissiveIntensity={coveGlow}
          roughness={0.32}
          metalness={0.42}
        />
      </SoftBox>
      <SoftBox args={[9.0, 0.06, 0.18]} radius={0.025} position={[0, 3.42, 0.15]}>
        <meshStandardMaterial
          color={palette.metal}
          emissive={palette.glow}
          emissiveIntensity={coveGlow * 0.75}
          roughness={0.32}
          metalness={0.42}
        />
      </SoftBox>

      {/* Window frame (back) — open to city */}
      <mesh position={[-5.0, 1.75, -4.2]} castShadow>
        <boxGeometry args={[0.22, 3.5, 0.22]} />
        <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[5.0, 1.75, -4.2]} castShadow>
        <boxGeometry args={[0.22, 3.5, 0.22]} />
        <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, 3.4, -4.2]}>
        <boxGeometry args={[10.2, 0.18, 0.22]} />
        <meshStandardMaterial color={palette.metal} metalness={0.45} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.12, -4.2]}>
        <boxGeometry args={[10.2, 0.24, 0.28]} />
        <meshStandardMaterial color={palette.ledge} roughness={0.55} metalness={0.15} />
      </mesh>
      {/* Mullions */}
      {[-2.5, 0, 2.5].map((x) => (
        <mesh key={x} position={[x, 1.75, -4.18]}>
          <boxGeometry args={[0.08, 3.2, 0.1]} />
          <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.45} />
        </mesh>
      ))}
      <mesh position={[0, 1.75, -4.18]}>
        <boxGeometry args={[10.0, 0.06, 0.08]} />
        <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.45} />
      </mesh>

      {/* Glass pane — keep very light so the skyline reads through */}
      <mesh position={[0, 1.75, -4.15]}>
        <boxGeometry args={[9.8, 3.15, 0.02]} />
        <meshStandardMaterial
          color={palette.glass}
          transparent
          opacity={night ? 0.08 : 0.16}
          roughness={0.12}
          metalness={0.08}
          depthWrite={false}
        />
      </mesh>

      {/* Window sill ledge (walkable edge stays clear via obstacles) */}
      <SoftBox args={[9.6, 0.2, 0.55]} radius={0.04} position={[0, 0.28, -3.85]} receiveShadow castShadow>
        <meshStandardMaterial color={palette.ledge} roughness={0.55} metalness={0.14} />
      </SoftBox>

      {/* Floor washes */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, -3.5]}>
        <planeGeometry args={[10.5, 1.6]} />
        <meshBasicMaterial
          color={palette.accent2}
          transparent
          opacity={night ? (lowPower ? 0.2 : 0.16) : 0.07}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.15, 0.003, -1.15]}>
        <planeGeometry args={[4.2, 2.0]} />
        <meshBasicMaterial
          color={palette.accent}
          transparent
          opacity={night ? (lowPower ? 0.14 : 0.1) : 0.045}
          depthWrite={false}
        />
      </mesh>

      {/* Baseboards along rear wall segments */}
      <mesh position={[-5.3, 0.08, -2.4]}>
        <boxGeometry args={[0.08, 0.16, 3.5]} />
        <meshStandardMaterial color={palette.metal} roughness={0.5} metalness={0.35} />
      </mesh>
      <mesh position={[5.3, 0.08, -2.4]}>
        <boxGeometry args={[0.08, 0.16, 3.5]} />
        <meshStandardMaterial color={palette.metal} roughness={0.5} metalness={0.35} />
      </mesh>
    </group>
  )
}

/** Procedural low-poly city beyond the window. */
function CitySkyline({
  palette,
  theme,
  lowPower,
}: {
  palette: SkylinePalette
  theme: ThemeMode
  lowPower: boolean
}) {
  const night = getPalette(theme).family === 'dark'
  const buildings = useMemo(
    () => [
      { x: -4.2, w: 0.9, h: 2.8, d: 0.7, lit: true, setback: 0.55 },
      { x: -3.1, w: 0.7, h: 3.6, d: 0.6, lit: false, setback: 0.4 },
      { x: -2.1, w: 1.1, h: 2.2, d: 0.8, lit: true, setback: 0.35 },
      { x: -0.85, w: 0.8, h: 4.2, d: 0.7, lit: true, setback: 0.65 },
      { x: 0.15, w: 1.0, h: 3.1, d: 0.75, lit: false, setback: 0.45 },
      { x: 1.2, w: 0.65, h: 3.8, d: 0.55, lit: true, setback: 0.5 },
      { x: 2.15, w: 0.95, h: 2.5, d: 0.7, lit: true, setback: 0.4 },
      { x: 3.3, w: 0.75, h: 3.4, d: 0.6, lit: false, setback: 0.55 },
      { x: 4.25, w: 0.85, h: 2.9, d: 0.65, lit: true, setback: 0.42 },
    ],
    [],
  )

  return (
    <group position={[0, 0, -5.55]}>
      {/* Far sky plate */}
      <mesh position={[0, 2.4, -1.8]}>
        <planeGeometry args={[16, 6.5]} />
        <meshBasicMaterial color={palette.sky} />
      </mesh>
      {/* Horizon haze */}
      <mesh position={[0, 0.45, -0.6]} rotation={[-0.12, 0, 0]}>
        <planeGeometry args={[14, 1.4]} />
        <meshBasicMaterial
          color={night ? palette.accent2 : '#e8eef4'}
          transparent
          opacity={night ? 0.28 : 0.4}
          depthWrite={false}
        />
      </mesh>

      {buildings.map((b, i) => (
        <group key={i} position={[b.x, b.h / 2, 0.15 - (i % 3) * 0.12]}>
          <SoftBox args={[b.w, b.h, b.d]} radius={0.04} castShadow={!lowPower}>
            <meshStandardMaterial
              color={palette.building}
              roughness={0.82}
              metalness={0.1}
              emissive={b.lit ? palette.buildingLit : palette.accent2}
              emissiveIntensity={b.lit ? (night ? 0.45 : 0.08) : night ? 0.08 : 0}
            />
          </SoftBox>
          {/* Upper setback massing */}
          <SoftBox
            args={[b.w * 0.72, b.h * b.setback, b.d * 0.75]}
            radius={0.03}
            position={[0, b.h * 0.5 + (b.h * b.setback) * 0.35, -0.04]}
            castShadow={!lowPower}
          >
            <meshStandardMaterial
              color={palette.building}
              roughness={0.8}
              metalness={0.12}
              emissive={palette.buildingLit}
              emissiveIntensity={b.lit && night ? 0.25 : 0}
            />
          </SoftBox>
          {/* Antenna / roof spur on taller towers */}
          {b.h > 3.2 && (
            <mesh position={[0, b.h * 0.5 + b.h * b.setback * 0.85, 0]}>
              <cylinderGeometry args={[0.02, 0.025, 0.35, 6]} />
              <meshStandardMaterial
                color={palette.metal}
                emissive={palette.accent}
                emissiveIntensity={night ? 0.4 : 0.08}
                metalness={0.5}
                roughness={0.35}
              />
            </mesh>
          )}
          {/* Window rows */}
          {!lowPower &&
            Array.from({ length: Math.floor(b.h / 0.45) }, (_, row) => (
              <mesh
                key={row}
                position={[0, -b.h / 2 + 0.35 + row * 0.45, b.d / 2 + 0.01]}
              >
                <planeGeometry args={[b.w * 0.7, 0.12]} />
                <meshBasicMaterial
                  color={night ? (row % 2 ? palette.glow : palette.accent) : palette.buildingLit}
                  transparent
                  opacity={
                    night
                      ? row % 3 === 0
                        ? 1
                        : 0.55
                      : 0.2
                  }
                  depthWrite={false}
                />
              </mesh>
            ))}
        </group>
      ))}

      {/* Distant link lines — abstract network */}
      {!lowPower && night && (
        <group>
          {[
            [-2.5, 2.8, 0.3, 1.4],
            [0.5, 3.2, 2.0, 1.1],
            [-1.0, 3.6, 1.8, 0.9],
          ].map(([x1, y, x2, len], i) => (
            <mesh
              key={i}
              position={[(x1 + x2) / 2, y, 0.4]}
              rotation={[0, 0, Math.atan2(0, x2 - x1)]}
            >
              <boxGeometry args={[len, 0.02, 0.02]} />
              <meshBasicMaterial
                color={palette.accent}
                transparent
                opacity={0.35}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}

function DialogueOrb({
  open,
  onToggle,
  palette,
  theme,
  introRef,
}: {
  open: boolean
  onToggle: () => void
  palette: SkylinePalette
  theme: ThemeMode
  introRef: MutableRefObject<number>
}) {
  const [hovered, setHovered] = useState(false)
  const root = useRef<THREE.Group>(null)
  const pulse = useRef(0)
  const night = getPalette(theme).family === 'dark'

  useFrame((_, dt) => {
    if (!root.current) return
    pulse.current += dt
    const appear = Math.min(1, Math.max(0, (introRef.current - 0.1) / 0.4))
    const eased = 1 - Math.pow(1 - appear, 3)
    const bob = Math.sin(pulse.current * 1.6) * 0.06
    root.current.position.y = bob
    root.current.scale.setScalar(0.88 + 0.12 * eased)
    root.current.visible = eased > 0.05
  })

  return (
    <group
      ref={root}
      position={DIALOGUE_ORB_POSITION}
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
      <mesh position={[0, 0.85, 0]} castShadow>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial
          color={palette.panel}
          emissive={palette.accent}
          emissiveIntensity={
            open || hovered ? (night ? 0.55 : 0.28) : night ? 0.22 : 0.1
          }
          roughness={0.35}
          metalness={0.25}
        />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <sphereGeometry args={[0.38, 16, 16]} />
        <meshStandardMaterial
          color={palette.accent2}
          transparent
          opacity={open || hovered ? 0.18 : 0.08}
          depthWrite={false}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.5, 8]} />
        <meshStandardMaterial color={palette.metal} metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.26, 0.08, 12]} />
        <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.4} />
      </mesh>
      {(open || hovered) && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.4, 0.55, 32]} />
          <meshBasicMaterial color={palette.accent} transparent opacity={0.3} depthWrite={false} />
        </mesh>
      )}
      <Html position={[0, 1.35, 0]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
        <div className={`skyline-html-label skyline-html-pod${open || hovered ? ' is-hot' : ''}`}>
          <span className="skyline-html-kicker">悬浮对话</span>
          <span className="skyline-html-title">AI 分身</span>
        </div>
      </Html>
    </group>
  )
}
