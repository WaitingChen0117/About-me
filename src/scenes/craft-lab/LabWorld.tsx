import { ContactShadows, Html, OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState, type MutableRefObject } from 'react'
import * as THREE from 'three'
import type { SectionId } from '../../content/sections'
import type { HotspotDef, ThemeMode } from '../types'
import { Operator3D } from '../ops-deck/Operator3D'
import { CraftHotspotMesh } from './CraftHotspotMeshes'
import { ASSIST_MONITOR_POSITION, OPERATOR_HOME, craftLabHotspots } from './hotspots'
import { labPalette, type LabPalette } from './themeColors'

type Props = {
  theme: ThemeMode
  activeSection: SectionId | null
  onOpenSection: (id: SectionId) => void
  onSendOperator: (id: SectionId) => void
  avatarOpen: boolean
  onToggleAvatar: () => void
  operatorTarget: SectionId | null
  operatorTicket: number
  onOperatorArrive: (id: SectionId) => void
  lowPower: boolean
  isTouch: boolean
}

export function LabWorld({
  theme,
  activeSection,
  onOpenSection,
  onSendOperator,
  avatarOpen,
  onToggleAvatar,
  operatorTarget,
  operatorTicket,
  onOperatorArrive,
  lowPower,
  isTouch,
}: Props) {
  const palette = useMemo(() => labPalette(theme), [theme])
  const hotspots = craftLabHotspots as HotspotDef[]
  const introRef = useRef(0)
  const labGroup = useRef<THREE.Group>(null)

  const onOperatorTap = () => {
    const pool = hotspots.map((h) => h.id)
    const next = pool[Math.floor(Math.random() * pool.length)]!
    onSendOperator(next)
  }

  useFrame((_, dt) => {
    if (introRef.current < 1) {
      introRef.current = Math.min(1, introRef.current + dt * 0.85)
    }
    if (labGroup.current) {
      const e = 1 - Math.pow(1 - Math.min(1, introRef.current / 0.5), 3)
      labGroup.current.position.y = (1 - e) * -0.18
      labGroup.current.scale.setScalar(0.96 + 0.04 * e)
    }
  })

  const keyIntensity = theme === 'bright' ? 1.05 : 0.78
  const fillIntensity = theme === 'bright' ? 0.3 : 0.3

  return (
    <>
      <color attach="background" args={[palette.bg]} />
      <fog attach="fog" args={[palette.bg, lowPower ? 12 : 10.5, lowPower ? 26 : 20]} />

      <hemisphereLight
        color={theme === 'bright' ? '#eceef2' : '#303840'}
        groundColor={theme === 'bright' ? '#a8acb4' : '#0a0c10'}
        intensity={theme === 'bright' ? 0.54 : lowPower ? 0.38 : 0.28}
      />
      <ambientLight intensity={theme === 'bright' ? 0.42 : lowPower ? 0.3 : 0.18} />

      {/* Cool studio key — graphite room, amber only as accent */}
      <directionalLight
        position={[2.4, 9.4, 1.2]}
        intensity={lowPower ? keyIntensity * 1.12 : keyIntensity}
        castShadow={!lowPower}
        color={theme === 'bright' ? '#f4f5f7' : '#e8e0d4'}
        shadow-mapSize-width={lowPower ? 512 : 1024}
        shadow-mapSize-height={lowPower ? 512 : 1024}
        shadow-bias={-0.00025}
        shadow-camera-far={22}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
      />
      <directionalLight position={[-5.2, 3.6, -1.2]} intensity={fillIntensity} color={palette.rim} />
      <pointLight
        position={[0, 2.6, 0]}
        intensity={theme === 'bright' ? 0.22 : 0.36}
        color={palette.accent}
        distance={9}
        decay={2}
      />
      <pointLight
        position={[3.2, 1.8, -1]}
        intensity={0.2}
        color={palette.accent2}
        distance={7}
        decay={2}
      />
      <spotLight
        position={[-1.5, 5, 2]}
        angle={0.48}
        penumbra={0.7}
        intensity={theme === 'bright' ? 0.22 : 0.38}
        color="#d8d4cc"
        castShadow={false}
        distance={12}
        decay={2}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[18, 14]} />
        <meshStandardMaterial color={palette.floor} roughness={0.88} metalness={0.06} />
      </mesh>

      {/* Subtle floor tape marks instead of tech grid */}
      {!lowPower && (
        <group>
          {[-3, -1, 1, 3].map((x) => (
            <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.002, 0]}>
              <planeGeometry args={[0.04, 8]} />
              <meshBasicMaterial color={palette.tape} transparent opacity={0.18} depthWrite={false} />
            </mesh>
          ))}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 2.4]}>
            <planeGeometry args={[8, 0.06]} />
            <meshBasicMaterial color={palette.metal} transparent opacity={0.22} depthWrite={false} />
          </mesh>
        </group>
      )}

      <group ref={labGroup}>
        {/* Back wall */}
        <mesh position={[0, 1.6, -3.05]} receiveShadow castShadow>
          <boxGeometry args={[9.2, 3.2, 0.12]} />
          <meshStandardMaterial color={palette.panel} roughness={0.88} metalness={0.04} />
        </mesh>
        {/* Side wall hint */}
        <mesh position={[-4.4, 1.4, -0.4]} receiveShadow>
          <boxGeometry args={[0.1, 2.8, 5.2]} />
          <meshStandardMaterial color={palette.desk} roughness={0.9} metalness={0.03} />
        </mesh>

        {/* Central workbench base */}
        <mesh position={[0.2, 0.18, 0.2]} receiveShadow castShadow>
          <boxGeometry args={[4.4, 0.36, 2.6]} />
          <meshStandardMaterial color={palette.wood} roughness={0.7} metalness={0.08} />
        </mesh>
        <mesh position={[0.2, 0.38, 0.2]} receiveShadow>
          <boxGeometry args={[4.5, 0.05, 2.7]} />
          <meshStandardMaterial color={palette.desk} roughness={0.62} metalness={0.12} />
        </mesh>

        {/* Tool rail on wall */}
        <mesh position={[1.8, 1.85, -2.95]} castShadow>
          <boxGeometry args={[2.4, 0.08, 0.08]} />
          <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.5} />
        </mesh>
        {[-0.6, -0.15, 0.3, 0.75].map((ox, i) => (
          <mesh key={ox} position={[1.5 + ox, 1.55, -2.9]} castShadow>
            <boxGeometry args={[0.08, 0.45, 0.06]} />
            <meshStandardMaterial
              color={i % 2 ? palette.accent : palette.metal}
              roughness={0.45}
              metalness={0.4}
            />
          </mesh>
        ))}

        {hotspots.map((spot, i) => (
          <CraftHotspotMesh
            key={`mesh-${spot.id}`}
            spot={spot}
            palette={palette}
            active={activeSection === spot.id}
            targeted={operatorTarget === spot.id}
            index={i}
            introRef={introRef}
            onOpen={onOpenSection}
          />
        ))}

        <AssistMonitor
          open={avatarOpen}
          onToggle={onToggleAvatar}
          palette={palette}
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
        />
      </group>

      {!lowPower && (
        <ContactShadows
          position={[0, 0.011, 0]}
          opacity={theme === 'bright' ? 0.28 : 0.45}
          scale={12}
          blur={2.6}
          far={4}
        />
      )}

      <OrbitControls
        makeDefault
        enablePan={false}
        minPolarAngle={0.4}
        maxPolarAngle={Math.PI / 2.15}
        minDistance={isTouch ? 5.4 : 4.6}
        maxDistance={isTouch ? 11.5 : 12.5}
        target={[0.1, 0.7, -0.2]}
        enableDamping={!lowPower}
        dampingFactor={isTouch ? 0.12 : 0.08}
        rotateSpeed={isTouch ? 0.55 : 0.72}
        zoomSpeed={isTouch ? 0.65 : 0.9}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      />
    </>
  )
}

function AssistMonitor({
  open,
  onToggle,
  palette,
  introRef,
}: {
  open: boolean
  onToggle: () => void
  palette: LabPalette
  introRef: MutableRefObject<number>
}) {
  const [hovered, setHovered] = useState(false)
  const root = useRef<THREE.Group>(null)

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
      {/* Desk secondary monitor */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.95, 0.72, 0.08]} />
        <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.55, 0.05]}>
        <boxGeometry args={[0.82, 0.58, 0.03]} />
        <meshStandardMaterial
          color={palette.screen}
          emissive={palette.accent2}
          emissiveIntensity={open || hovered ? 0.28 : 0.1}
          roughness={0.22}
        />
      </mesh>
      <mesh position={[0, 0.12, 0.05]} castShadow>
        <boxGeometry args={[0.35, 0.12, 0.25]} />
        <meshStandardMaterial color={palette.panel} roughness={0.55} />
      </mesh>
      {/* Assist arm stub */}
      <mesh position={[-0.55, 0.7, -0.05]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
        <meshStandardMaterial color={palette.metal} metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[-0.55, 1.05, 0.15]} castShadow>
        <boxGeometry args={[0.22, 0.08, 0.35]} />
        <meshStandardMaterial
          color={palette.accent}
          emissive={palette.accent}
          emissiveIntensity={open ? 0.22 : 0.08}
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
