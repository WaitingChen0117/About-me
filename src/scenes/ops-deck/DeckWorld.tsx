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

  const keyIntensity = theme === 'bright' ? 0.98 : 0.82
  const fillIntensity = theme === 'bright' ? 0.24 : 0.36
  const rimIntensity = theme === 'bright' ? 0.16 : 0.28

  return (
    <>
      <color attach="background" args={[palette.bg]} />
      <fog attach="fog" args={[palette.bg, lowPower ? 12 : 10.5, lowPower ? 24 : 19]} />

      <hemisphereLight
        color={theme === 'bright' ? '#e4e8ef' : '#1e2838'}
        groundColor={theme === 'bright' ? '#a8b0bc' : '#05070a'}
        intensity={theme === 'bright' ? 0.5 : lowPower ? 0.38 : 0.28}
      />
      <ambientLight intensity={theme === 'bright' ? 0.38 : lowPower ? 0.28 : 0.18} />

      <directionalLight
        position={[4.8, 9.2, 2.4]}
        intensity={lowPower ? keyIntensity * 1.15 : keyIntensity}
        castShadow={!lowPower}
        color={theme === 'bright' ? '#f2f4f8' : '#d8e4f0'}
        shadow-mapSize-width={lowPower ? 512 : 1024}
        shadow-mapSize-height={lowPower ? 512 : 1024}
        shadow-bias={-0.00025}
        shadow-camera-far={22}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
      />
      <directionalLight position={[-5.2, 2.8, -2.4]} intensity={fillIntensity} color={palette.rim} />
      <pointLight
        position={[0, 2.4, 0.4]}
        intensity={theme === 'bright' ? 0.18 : 0.42}
        color={palette.accent}
        distance={8}
        decay={2}
      />
      <pointLight
        position={[-3.4, 1.8, 1.6]}
        intensity={rimIntensity}
        color={palette.accent2}
        distance={6.5}
        decay={2}
      />
      <spotLight
        position={[2.8, 4.2, 3.2]}
        angle={0.42}
        penumbra={0.65}
        intensity={theme === 'bright' ? 0.28 : 0.48}
        color="#c8d4e4"
        castShadow={false}
        distance={14}
        decay={2}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[18, 14]} />
        <meshStandardMaterial color={palette.floor} roughness={0.9} metalness={0.08} />
      </mesh>

      {!lowPower && (
        <Grid
          position={[0, 0.001, 0]}
          args={[18, 14]}
          cellSize={0.5}
          cellThickness={0.3}
          cellColor={palette.accent2}
          sectionSize={2}
          sectionThickness={0.55}
          sectionColor={palette.metal}
          fadeDistance={12}
          fadeStrength={1.6}
          infiniteGrid={false}
        />
      )}

      <group ref={deskGroup}>
        <mesh position={[0, 0.04, 0]} receiveShadow castShadow>
          <boxGeometry args={[8.2, 0.1, 5.6]} />
          <meshStandardMaterial color={palette.desk} roughness={0.72} metalness={0.14} />
        </mesh>
        <mesh position={[0, 0.1, 0]} receiveShadow>
          <boxGeometry args={[8.28, 0.02, 5.68]} />
          <meshStandardMaterial color={palette.metal} roughness={0.38} metalness={0.52} />
        </mesh>
        <mesh position={[0, -0.35, 0]} castShadow>
          <boxGeometry args={[7.6, 0.7, 5]} />
          <meshStandardMaterial color={palette.metal} roughness={0.48} metalness={0.42} />
        </mesh>

        <group position={[0, 0.12, 2.55]}>
          {[-0.35, 0, 0.35].map((x, i) => (
            <mesh key={x} position={[x, 0, 0]}>
              <boxGeometry args={[0.08, 0.06, 0.08]} />
              <meshStandardMaterial
                color={i === 0 ? palette.ok : i === 1 ? palette.accent : palette.accent2}
                emissive={i === 0 ? palette.ok : i === 1 ? palette.accent : palette.accent2}
                emissiveIntensity={theme === 'duty' ? 0.35 : 0.16}
                roughness={0.4}
                metalness={0.35}
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
        <cylinderGeometry args={[0.52, 0.62, 0.7, 16]} />
        <meshStandardMaterial
          color={palette.metal}
          roughness={0.36}
          metalness={0.48}
          emissive={palette.accent}
          emissiveIntensity={open || hovered ? 0.16 : 0.04}
        />
      </mesh>
      <mesh position={[0, 0.82, 0]}>
        <cylinderGeometry args={[0.38, 0.42, 0.28, 16]} />
        <meshStandardMaterial
          color={palette.screen}
          transparent
          opacity={theme === 'duty' ? 0.55 : 0.42}
          roughness={0.22}
          metalness={0.28}
          emissive={palette.accent}
          emissiveIntensity={open ? 0.28 : hovered ? 0.18 : 0.08}
        />
      </mesh>
      {(open || hovered) && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.68, 0.78, 28]} />
          <meshBasicMaterial color={palette.accent} transparent opacity={0.22} depthWrite={false} />
        </mesh>
      )}
      <Html position={[0, 1.28, 0]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
        <div className={`ops-html-label ops-html-pod${open || hovered ? ' is-hot' : ''}`}>
          <span className="ops-html-kicker">对话舱</span>
          <span className="ops-html-title">AI 分身</span>
        </div>
      </Html>
    </group>
  )
}
