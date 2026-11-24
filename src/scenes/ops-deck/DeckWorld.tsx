import { ContactShadows, Grid, Html, OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState, type MutableRefObject } from 'react'
import * as THREE from 'three'
import type { SectionId } from '../../content/sections'
import type { HotspotDef, ThemeMode } from '../types'
import { AVATAR_POD_POSITION, opsDeckHotspots } from './hotspots'
import { HotspotMesh } from './HotspotMeshes'
import { Operator3D } from './Operator3D'
import { deckPalette, type DeckPalette } from './themeColors'

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

export function DeckWorld({
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
  const palette = useMemo(() => deckPalette(theme), [theme])
  const hotspots = opsDeckHotspots as HotspotDef[]
  const introRef = useRef(0)
  const deskGroup = useRef<THREE.Group>(null)

  const onOperatorTap = () => {
    const pool = hotspots.map((h) => h.id)
    const next = pool[Math.floor(Math.random() * pool.length)]!
    onSendOperator(next)
  }

  useFrame((_, dt) => {
    if (introRef.current < 1) {
      introRef.current = Math.min(1, introRef.current + dt * 0.9)
    }
    if (deskGroup.current) {
      const e = 1 - Math.pow(1 - Math.min(1, introRef.current / 0.55), 3)
      deskGroup.current.position.y = (1 - e) * -0.22
      deskGroup.current.scale.setScalar(0.95 + 0.05 * e)
    }
  })

  const keyIntensity = theme === 'bright' ? 1.05 : 0.82
  const fillIntensity = theme === 'bright' ? 0.28 : 0.45
  const rimIntensity = theme === 'bright' ? 0.22 : 0.38

  return (
    <>
      <color attach="background" args={[palette.bg]} />
      <fog attach="fog" args={[palette.bg, lowPower ? 11 : 9.5, lowPower ? 24 : 20]} />

      <hemisphereLight
        color={theme === 'bright' ? '#e8eef8' : '#1a2a44'}
        groundColor={theme === 'bright' ? '#b8c4d4' : '#05080f'}
        intensity={theme === 'bright' ? 0.55 : lowPower ? 0.38 : 0.28}
      />
      <ambientLight intensity={theme === 'bright' ? 0.42 : lowPower ? 0.28 : 0.18} />

      <directionalLight
        position={[5.2, 8.5, 3.2]}
        intensity={lowPower ? keyIntensity * 1.12 : keyIntensity}
        castShadow={!lowPower}
        shadow-mapSize-width={lowPower ? 512 : 1024}
        shadow-mapSize-height={lowPower ? 512 : 1024}
        shadow-bias={-0.00025}
        shadow-camera-far={22}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
      />
      <directionalLight position={[-4, 3.5, -2]} intensity={fillIntensity} color={palette.rim} />
      <pointLight
        position={[0, 2.2, 0]}
        intensity={theme === 'bright' ? 0.28 : 0.72}
        color={palette.accent}
        distance={9}
        decay={2}
      />
      <pointLight
        position={[-3.2, 1.6, 1.8]}
        intensity={rimIntensity}
        color={palette.accent2}
        distance={7}
        decay={2}
      />
      <pointLight
        position={[3, 1.4, -1.2]}
        intensity={rimIntensity * 0.7}
        color={palette.ok}
        distance={6}
        decay={2}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[18, 14]} />
        <meshStandardMaterial color={palette.floor} roughness={0.94} metalness={0.04} />
      </mesh>

      {!lowPower && (
        <Grid
          position={[0, 0.001, 0]}
          args={[18, 14]}
          cellSize={0.5}
          cellThickness={0.45}
          cellColor={palette.accent2}
          sectionSize={2}
          sectionThickness={0.9}
          sectionColor={palette.accent}
          fadeDistance={13}
          fadeStrength={1.5}
          infiniteGrid={false}
        />
      )}

      <group ref={deskGroup}>
        <mesh position={[0, 0.04, 0]} receiveShadow castShadow>
          <boxGeometry args={[8.2, 0.1, 5.6]} />
          <meshStandardMaterial color={palette.desk} roughness={0.78} metalness={0.08} />
        </mesh>
        <mesh position={[0, 0.1, 0]} receiveShadow>
          <boxGeometry args={[8.28, 0.02, 5.68]} />
          <meshStandardMaterial color={palette.metal} roughness={0.45} metalness={0.35} />
        </mesh>
        <mesh position={[0, -0.35, 0]} castShadow>
          <boxGeometry args={[7.6, 0.7, 5]} />
          <meshStandardMaterial color={palette.metal} roughness={0.58} metalness={0.32} />
        </mesh>

        <group position={[0, 0.12, 2.55]}>
          {[-0.35, 0, 0.35].map((x, i) => (
            <mesh key={x} position={[x, 0, 0]}>
              <sphereGeometry args={[0.055, 12, 12]} />
              <meshStandardMaterial
                color={i === 0 ? palette.ok : i === 1 ? palette.accent : palette.accent2}
                emissive={i === 0 ? palette.ok : i === 1 ? palette.accent : palette.accent2}
                emissiveIntensity={theme === 'duty' ? 0.7 : 0.32}
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
            index={i}
            introRef={introRef}
            onOpen={onOpenSection}
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
        />
      </group>

      {!lowPower && (
        <ContactShadows
          position={[0, 0.011, 0]}
          opacity={theme === 'bright' ? 0.32 : 0.5}
          scale={12}
          blur={2.4}
          far={4}
        />
      )}

      <OrbitControls
        makeDefault
        enablePan={false}
        minPolarAngle={0.38}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={isTouch ? 5.2 : 4.5}
        maxDistance={isTouch ? 11 : 12}
        target={[0, 0.55, 0]}
        enableDamping={!lowPower}
        dampingFactor={isTouch ? 0.12 : 0.08}
        rotateSpeed={isTouch ? 0.55 : 0.75}
        zoomSpeed={isTouch ? 0.65 : 0.9}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      />
    </>
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
          emissiveIntensity={open || hovered ? 0.32 : 0.1}
        />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <sphereGeometry args={[0.42, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={palette.accent}
          transparent
          opacity={theme === 'duty' ? 0.32 : 0.22}
          roughness={0.18}
          metalness={0.35}
          emissive={palette.accent}
          emissiveIntensity={open ? 0.5 : hovered ? 0.35 : 0.18}
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
          <span className="ops-html-kicker">中央对话舱</span>
          <span className="ops-html-title">AI 分身</span>
        </div>
      </Html>
    </group>
  )
}
