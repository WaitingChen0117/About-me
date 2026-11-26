import { ContactShadows, Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import {
  useCallback,
  useEffect,
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
import { SoftBox } from '../primitives'
import { getPalette } from '../../themes/palettes'
import type { OperatorLookId } from './operatorLooks'
import type { CameraCommand, CameraView, HotspotDef, ThemeMode } from '../types'
import {
  OPS_WALK_BOUNDS,
  OPS_WALK_OBSTACLES,
} from '../walk/clampWalk'
import { findPath, type WalkPoint } from '../walk/pathfind'
import { WalkGuide } from '../walk/WalkGuide'
import { WalkSurface } from '../walk/WalkSurface'
import {
  AVATAR_POD_POSITION,
  CHAIR_APPROACH,
  CHAIR_FACE_YAW,
  CHAIR_OUTWARD_YAW,
  CHAIR_POSITION,
  CHAIR_REST_SWIVEL,
  CHAIR_SIT,
  DESK_MONITOR_IDS,
  opsDeckHotspots,
} from './hotspots'
import { HotspotMesh } from './HotspotMeshes'
import {
  Operator3D,
  type FreeWalkCommand,
  type SitCommand,
  type StandCommand,
} from './Operator3D'
import { StudioDecor } from './StudioDecor'
import { deckPalette, type DeckPalette } from './themeColors'

function isDeskMonitor(id: SectionId): boolean {
  return (DESK_MONITOR_IDS as readonly SectionId[]).includes(id)
}

/**
 * Chair swivel sequencer — independent of React `seated`.
 * Sit: to-seat rotates in place so the seat opens toward the character,
 * then the body blends on. Stand: operator turns outward first (phase
 * stays `seated` so mesh follows), then stand-blend. Monitor clicks while
 * aisle-facing turn chair+body to the desk before focusThenOpen.
 */
type ChairSwivelPhase = 'rest' | 'to-seat' | 'seated' | 'to-rest'

type PendingAfterStand =
  | { kind: 'walk'; x: number; z: number }
  | { kind: 'open'; id: SectionId }
  | { kind: 'avatar' }
  | { kind: 'patrol' }

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
  /** Lets the scene shell (legend / rail) reuse seat-aware select. */
  selectSectionRef?: MutableRefObject<(id: SectionId) => void>
  operatorLook: OperatorLookId
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
  selectSectionRef,
  operatorLook,
}: Props) {
  const palette = useMemo(() => deckPalette(theme), [theme])
  const lights = useMemo(() => getPalette(theme).lights, [theme])
  const dark = getPalette(theme).family === 'dark'
  const { gl } = useThree()
  const hotspots = opsDeckHotspots as HotspotDef[]
  const introRef = useRef(0)
  const roomGroup = useRef<THREE.Group>(null)
  const [hoveredId, setHoveredId] = useState<SectionId | null>(null)
  const [freeWalk, setFreeWalk] = useState<FreeWalkCommand | null>(null)
  const [walkPath, setWalkPath] = useState<WalkPoint[] | null>(null)
  const [sitCommand, setSitCommand] = useState<SitCommand | null>(null)
  const [standCommand, setStandCommand] = useState<StandCommand | null>(null)
  const [seated, setSeated] = useState(false)
  const [chairHovered, setChairHovered] = useState(false)
  /** True while walking-to-sit or blending onto / off the seat. */
  const seatBusy = useRef(false)
  const pendingAfterStand = useRef<PendingAfterStand | null>(null)
  /** Operator world yaw while seated — chair swivel locks to this. */
  const seatYawRef = useRef(CHAIR_FACE_YAW)
  const chairSwivelRef = useRef<THREE.Group>(null)
  const operatorPosRef = useRef({ x: 0.05, z: 1.85 })
  /**
   * Explicit swivel sequencer — do NOT key rest-damp off React `seated`.
   * Chair orients to the target facing BEFORE the body sits or stands.
   */
  const chairPhaseRef = useRef<ChairSwivelPhase>('rest')
  /**
   * True once the empty chair has eased so the seat opens toward the
   * approach (faces the character) — sit-blend may begin.
   */
  const chairOrientedRef = useRef(false)
  /**
   * While seated, force yaw toward this value (monitor turn). Null = use lookAtId.
   * When the body reaches it, DeckWorld fires pending monitor focusThenOpen.
   */
  const seatTurnYawRef = useRef<number | null>(null)
  const pendingMonitorOpenRef = useRef<SectionId | null>(null)

  useEffect(() => {
    gl.toneMappingExposure = lowPower ? lights.exposureLite : lights.exposure
  }, [gl, lights, lowPower])

  const requestStand = useCallback(() => {
    seatBusy.current = true
    seatTurnYawRef.current = null
    pendingMonitorOpenRef.current = null
    // Stay in `seated` so the mesh follows seatYaw while the operator
    // turns aisle-outward first; stand-blend starts only after that turn.
    chairPhaseRef.current = 'seated'
    setStandCommand((prev) => ({
      ticket: (prev?.ticket ?? 0) + 1,
      standX: CHAIR_APPROACH[0],
      standZ: CHAIR_APPROACH[2],
      exitYaw: CHAIR_OUTWARD_YAW,
    }))
  }, [])

  const requestSit = useCallback(() => {
    if (seated || seatBusy.current) return
    pendingAfterStand.current = null
    seatBusy.current = true
    // Board facing the character / aisle — rotate in place, never translate.
    seatYawRef.current = CHAIR_OUTWARD_YAW
    chairOrientedRef.current = false
    seatTurnYawRef.current = null
    pendingMonitorOpenRef.current = null
    chairPhaseRef.current = 'to-seat'
    setSitCommand((prev) => ({
      ticket: (prev?.ticket ?? 0) + 1,
      approachX: CHAIR_APPROACH[0],
      approachZ: CHAIR_APPROACH[2],
      sitX: CHAIR_SIT[0],
      sitY: CHAIR_SIT[1],
      sitZ: CHAIR_SIT[2],
      faceYaw: CHAIR_OUTWARD_YAW,
    }))
  }, [seated])

  const onSeated = useCallback(() => {
    seatBusy.current = false
    chairOrientedRef.current = true
    chairPhaseRef.current = 'seated'
    setSeated(true)
  }, [])

  const onStood = useCallback(() => {
    seatBusy.current = false
    setSeated(false)
    // Body already left after the chair faced the aisle — settle residual.
    chairPhaseRef.current = 'to-rest'
    const pending = pendingAfterStand.current
    pendingAfterStand.current = null
    if (!pending) return
    if (pending.kind === 'walk') {
      const from = operatorPosRef.current
      const path = findPath(
        from.x,
        from.z,
        pending.x,
        pending.z,
        OPS_WALK_BOUNDS,
        OPS_WALK_OBSTACLES,
      )
      if (!path) return
      setWalkPath(path)
      setFreeWalk((prev) => ({
        ticket: (prev?.ticket ?? 0) + 1,
        x: pending.x,
        z: pending.z,
        path,
      }))
    } else if (pending.kind === 'open') {
      onFocusThenOpen(pending.id)
    } else if (pending.kind === 'avatar') {
      onToggleAvatar()
    } else if (pending.kind === 'patrol') {
      const pool = hotspots.map((h) => h.id)
      const next = pool[Math.floor(Math.random() * pool.length)]!
      onSendOperator(next)
    }
  }, [hotspots, onFocusThenOpen, onSendOperator, onToggleAvatar])

  const yawTowardHotspot = useCallback((id: SectionId) => {
    const spot = hotspots.find((h) => h.id === id)
    if (!spot) return CHAIR_FACE_YAW
    const dx = spot.position[0] - CHAIR_SIT[0]
    const dz = spot.position[2] - CHAIR_SIT[2]
    if (dx * dx + dz * dz < 1e-4) return CHAIR_FACE_YAW
    return Math.atan2(dx, dz)
  }, [hotspots])

  const selectSection = useCallback(
    (id: SectionId) => {
      if (seated || seatBusy.current) {
        if (seated && isDeskMonitor(id)) {
          // Stay seated: if facing away from the desk/monitor, turn together
          // first, then focusThenOpen — never open while still aisle-facing.
          const targetYaw = yawTowardHotspot(id)
          const delta = Math.abs(
            Math.atan2(
              Math.sin(seatYawRef.current - targetYaw),
              Math.cos(seatYawRef.current - targetYaw),
            ),
          )
          if (delta < 0.35) {
            seatTurnYawRef.current = null
            pendingMonitorOpenRef.current = null
            onFocusThenOpen(id)
            return
          }
          pendingMonitorOpenRef.current = id
          seatTurnYawRef.current = targetYaw
          return
        }
        pendingAfterStand.current = { kind: 'open', id }
        requestStand()
        return
      }
      onFocusThenOpen(id)
    },
    [seated, onFocusThenOpen, requestStand, yawTowardHotspot],
  )

  useEffect(() => {
    if (!selectSectionRef) return
    selectSectionRef.current = selectSection
  }, [selectSection, selectSectionRef])

  const onOperatorTap = () => {
    if (seated || seatBusy.current) {
      pendingAfterStand.current = { kind: 'patrol' }
      requestStand()
      return
    }
    const pool = hotspots.map((h) => h.id)
    const next = pool[Math.floor(Math.random() * pool.length)]!
    onSendOperator(next)
  }

  const onWalkPath = useCallback(
    (path: WalkPoint[]) => {
      const goal = path[path.length - 1]!
      setWalkPath(path)
      if (seated || seatBusy.current) {
        pendingAfterStand.current = { kind: 'walk', x: goal.x, z: goal.z }
        requestStand()
        return
      }
      setFreeWalk((prev) => ({
        ticket: (prev?.ticket ?? 0) + 1,
        x: goal.x,
        z: goal.z,
        path,
      }))
    },
    [seated, requestStand],
  )

  const onFreeWalkDone = useCallback(() => {
    setWalkPath(null)
  }, [])

  const onAvatarToggle = useCallback(() => {
    if (seated || seatBusy.current) {
      pendingAfterStand.current = { kind: 'avatar' }
      requestStand()
      return
    }
    onToggleAvatar()
  }, [seated, requestStand, onToggleAvatar])

  useFrame((_, dt) => {
    if (introRef.current < 1) {
      introRef.current = Math.min(1, introRef.current + dt * 0.9)
    }
    if (roomGroup.current) {
      const e = 1 - Math.pow(1 - Math.min(1, introRef.current / 0.55), 3)
      roomGroup.current.position.y = (1 - e) * -0.18
      roomGroup.current.scale.setScalar(0.96 + 0.04 * e)
    }
    // Chair swivel sequencer (mesh backrest local +Z):
    // to-seat → ease seat-open toward the character BEFORE sit-blend ·
    // seated → hard lock (follows pre-stand / monitor turns) ·
    // to-rest → residual aisle damp after stand.
    const swivel = chairSwivelRef.current
    if (swivel) {
      const seatedSwivel = seatYawRef.current - CHAIR_FACE_YAW
      const step = Math.min(dt, 0.05)
      const phase = chairPhaseRef.current
      if (phase === 'seated') {
        swivel.rotation.y = seatedSwivel
        // Monitor click: finish forced seat turn, then focusThenOpen.
        const turnYaw = seatTurnYawRef.current
        const pendingMon = pendingMonitorOpenRef.current
        if (turnYaw != null && pendingMon) {
          const delta = Math.abs(
            Math.atan2(
              Math.sin(seatYawRef.current - turnYaw),
              Math.cos(seatYawRef.current - turnYaw),
            ),
          )
          if (delta < 0.1) {
            seatTurnYawRef.current = null
            pendingMonitorOpenRef.current = null
            onFocusThenOpen(pendingMon)
          }
        }
      } else if (phase === 'to-seat') {
        // Board orientation = face character (aisle). Position never moves.
        swivel.rotation.y = THREE.MathUtils.damp(swivel.rotation.y, seatedSwivel, 4.5, step)
        if (Math.abs(swivel.rotation.y - seatedSwivel) < 0.08) {
          chairOrientedRef.current = true
        }
      } else {
        // 'rest' | 'to-rest' — aisle-facing empty chair
        swivel.rotation.y = THREE.MathUtils.damp(
          swivel.rotation.y,
          CHAIR_REST_SWIVEL,
          4.2,
          step,
        )
        if (
          phase === 'to-rest' &&
          Math.abs(swivel.rotation.y - CHAIR_REST_SWIVEL) < 0.01
        ) {
          swivel.rotation.y = CHAIR_REST_SWIVEL
          chairPhaseRef.current = 'rest'
        }
      }
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

      {/* Area rug under desk — soft rounded feel via layered planes */}
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.1, 0.006, 0.35]}>
        <planeGeometry args={[5.05, 3.85]} />
        <meshBasicMaterial
          color={dark ? palette.accent2 : palette.wood}
          transparent
          opacity={dark ? 0.06 : 0.08}
          depthWrite={false}
        />
      </mesh>

      <WalkSurface
        bounds={OPS_WALK_BOUNDS}
        obstacles={OPS_WALK_OBSTACLES}
        fromRef={operatorPosRef}
        onWalkPath={onWalkPath}
      />
      <WalkGuide path={walkPath} color={palette.accent} followRef={operatorPosRef} />

      <group ref={roomGroup}>
        <StudioShell palette={palette} theme={theme} lowPower={lowPower} />

        {/* Main desk — beveled top + apron + footed legs */}
        <SoftBox args={[4.6, 0.09, 2.0]} radius={0.04} position={[0.1, 0.725, -0.35]} receiveShadow castShadow>
          <meshStandardMaterial color={palette.desk} roughness={0.5} metalness={0.1} />
        </SoftBox>
        <SoftBox args={[4.72, 0.05, 2.12]} radius={0.03} position={[0.1, 0.675, -0.35]} receiveShadow>
          <meshStandardMaterial color={palette.wood} roughness={0.58} metalness={0.08} />
        </SoftBox>
        {/* Front cable apron */}
        <SoftBox args={[4.2, 0.22, 0.06]} radius={0.02} position={[0.1, 0.55, 0.62]}>
          <meshStandardMaterial color={palette.wood} roughness={0.62} metalness={0.06} />
        </SoftBox>
        {[
          [-2.0, 0.34, -1.15],
          [2.2, 0.34, -1.15],
          [-2.0, 0.34, 0.45],
          [2.2, 0.34, 0.45],
        ].map(([x, y, z], i) => (
          <group key={i} position={[x, y, z]}>
            <SoftBox args={[0.1, 0.62, 0.1]} radius={0.02} castShadow>
              <meshStandardMaterial color={palette.metal} roughness={0.45} metalness={0.38} />
            </SoftBox>
            <mesh position={[0, -0.32, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.08, 0.05, 12]} />
              <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.45} />
            </mesh>
          </group>
        ))}

        {/* Task chair — finer pedestal, casters, lumbar, armrests */}
        <group
          position={CHAIR_POSITION}
          onClick={(e) => {
            e.stopPropagation()
            if (seated || seatBusy.current) return
            requestSit()
          }}
          onPointerOver={(e) => {
            e.stopPropagation()
            setChairHovered(true)
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            setChairHovered(false)
            document.body.style.cursor = 'auto'
          }}
        >
          <mesh position={[0, 0.22, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.075, 0.38, 14]} />
            <meshStandardMaterial color={palette.metal} roughness={0.35} metalness={0.48} />
          </mesh>
          <mesh position={[0, 0.05, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.04, 20]} />
            <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.42} />
          </mesh>
          {/* Five caster arms */}
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2
            return (
              <group key={i} rotation={[0, a, 0]}>
                <mesh position={[0.22, 0.05, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[0.018, 0.022, 0.28, 8]} />
                  <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.45} />
                </mesh>
                <mesh position={[0.36, 0.04, 0]} castShadow>
                  <sphereGeometry args={[0.045, 12, 10]} />
                  <meshStandardMaterial color={palette.panel} roughness={0.55} metalness={0.2} />
                </mesh>
              </group>
            )
          })}
          <group ref={chairSwivelRef} rotation={[0, CHAIR_REST_SWIVEL, 0]}>
            <SoftBox
              args={[0.74, 0.09, 0.7]}
              radius={0.04}
              position={[0, 0.42, 0]}
              castShadow
            >
              <meshStandardMaterial
                color={palette.fabric}
                roughness={0.86}
                metalness={0.04}
                emissive={palette.accent}
                emissiveIntensity={chairHovered || seated ? 0.12 : 0}
              />
            </SoftBox>
            {/* Seat side bolsters */}
            <mesh position={[-0.34, 0.48, 0]} castShadow>
              <capsuleGeometry args={[0.04, 0.42, 4, 10]} />
              <meshStandardMaterial color={palette.fabric} roughness={0.88} metalness={0.04} />
            </mesh>
            <mesh position={[0.34, 0.48, 0]} castShadow>
              <capsuleGeometry args={[0.04, 0.42, 4, 10]} />
              <meshStandardMaterial color={palette.fabric} roughness={0.88} metalness={0.04} />
            </mesh>
            {/* Backrest + lumbar pillow */}
            <SoftBox args={[0.7, 0.78, 0.09]} radius={0.04} position={[0, 0.88, 0.28]} castShadow>
              <meshStandardMaterial color={palette.fabric} roughness={0.88} metalness={0.04} />
            </SoftBox>
            <mesh position={[0, 0.72, 0.22]} castShadow>
              <capsuleGeometry args={[0.08, 0.35, 6, 12]} />
              <meshStandardMaterial color={palette.fabric} roughness={0.9} metalness={0.03} />
            </mesh>
            {/* Armrests */}
            {([-1, 1] as const).map((side) => (
              <group key={side} position={[side * 0.4, 0.55, 0.02]}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.025, 0.028, 0.28, 10]} />
                  <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.45} />
                </mesh>
                <SoftBox args={[0.08, 0.05, 0.38]} radius={0.02} position={[0, 0.16, -0.02]} castShadow>
                  <meshStandardMaterial color={palette.fabric} roughness={0.85} metalness={0.05} />
                </SoftBox>
              </group>
            ))}
          </group>
          {(chairHovered || seated) && (
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.42, 0.55, 28]} />
              <meshBasicMaterial
                color={palette.accent}
                transparent
                opacity={seated ? 0.22 : 0.34}
                depthWrite={false}
              />
            </mesh>
          )}
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
            onOpen={selectSection}
            onHoverChange={setHoveredId}
          />
        ))}

        <AvatarDock
          open={avatarOpen}
          onToggle={onAvatarToggle}
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
          freeWalk={freeWalk}
          walkBounds={OPS_WALK_BOUNDS}
          walkObstacles={OPS_WALK_OBSTACLES}
          sitCommand={sitCommand}
          standCommand={standCommand}
          onSeated={onSeated}
          onStood={onStood}
          onFreeWalkDone={onFreeWalkDone}
          positionRef={operatorPosRef}
          seatYawRef={seatYawRef}
          chairOrientedRef={chairOrientedRef}
          seatTurnYawRef={seatTurnYawRef}
          look={operatorLook}
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
        onSelect={selectSection}
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
          // Keep orbit below the open ceiling / roof beams (home φ ≈ 1.05).
          minPolarAngle: 0.95,
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
      {/* Back wall + recessed panel lines */}
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
      {!lowPower &&
        [-3.2, -1.05, 1.05, 3.2].map((x) => (
          <mesh key={x} position={[x, 1.7, -4.25]}>
            <boxGeometry args={[0.03, 2.8, 0.02]} />
            <meshStandardMaterial color={palette.wood} roughness={0.7} metalness={0.06} />
          </mesh>
        ))}
      {/* Crown molding */}
      <SoftBox args={[11.0, 0.1, 0.14]} radius={0.02} position={[0, 3.28, -4.2]}>
        <meshStandardMaterial color={palette.wood} roughness={0.62} metalness={0.08} />
      </SoftBox>
      {/* Rear shelf ledge */}
      <SoftBox args={[8.2, 0.1, 0.55]} radius={0.03} position={[0, 0.55, -3.95]} receiveShadow castShadow>
        <meshStandardMaterial color={palette.wood} roughness={0.68} metalness={0.06} />
      </SoftBox>
      <SoftBox args={[8.0, 0.5, 0.45]} radius={0.03} position={[0, 0.28, -3.95]} castShadow>
        <meshStandardMaterial color={palette.desk} roughness={0.62} metalness={0.07} />
      </SoftBox>

      {/* Left wall */}
      <mesh position={[-5.45, 1.6, -0.4]} receiveShadow castShadow>
        <boxGeometry args={[0.14, 3.2, 8.2]} />
        <meshStandardMaterial color={palette.wall} roughness={0.9} metalness={0.03} />
      </mesh>
      {/* Window pane + thicker frame with sill */}
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
      <SoftBox args={[0.06, 1.6, 3.05]} radius={0.015} position={[-5.39, 1.9, -1.0]}>
        <meshStandardMaterial color={palette.wood} roughness={0.55} metalness={0.1} />
      </SoftBox>
      <mesh position={[-5.37, 1.9, -1.0]}>
        <boxGeometry args={[0.05, 0.05, 2.8]} />
        <meshStandardMaterial color={palette.wood} roughness={0.55} metalness={0.08} />
      </mesh>
      <mesh position={[-5.37, 1.2, -1.0]}>
        <boxGeometry args={[0.05, 0.05, 2.8]} />
        <meshStandardMaterial color={palette.wood} roughness={0.55} metalness={0.08} />
      </mesh>
      <SoftBox args={[0.12, 0.08, 3.1]} radius={0.02} position={[-5.32, 1.12, -1.0]}>
        <meshStandardMaterial color={palette.wood} roughness={0.6} metalness={0.08} />
      </SoftBox>

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
      <SoftBox args={[0.2, 0.18, 2.4]} radius={0.03} position={[5.45, 2.95, 1.35]}>
        <meshStandardMaterial color={palette.metal} metalness={0.4} roughness={0.42} />
      </SoftBox>
      <SoftBox args={[0.2, 3.0, 0.2]} radius={0.03} position={[5.45, 1.4, 0.25]}>
        <meshStandardMaterial color={palette.metal} metalness={0.4} roughness={0.42} />
      </SoftBox>

      {/* Ceiling strip lights — rounded housings */}
      {[
        [0, 3.25, -2.6],
        [0, 3.25, 0.1],
        [0, 3.25, 2.0],
      ].map(([x, y, z], i) => (
        <SoftBox key={i} args={[8.5, 0.06, 0.2]} radius={0.025} position={[x, y, z]}>
          <meshStandardMaterial
            color={palette.metal}
            emissive={dark ? palette.accent : palette.lamp}
            emissiveIntensity={coveEmissive * (i === 1 ? 1.2 : 0.8)}
            roughness={0.38}
            metalness={0.38}
          />
        </SoftBox>
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
