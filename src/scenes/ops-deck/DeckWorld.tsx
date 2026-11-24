import { ContactShadows, Grid, Html, OrbitControls } from '@react-three/drei'
import { useMemo, useState } from 'react'
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
}: Props) {
  const palette = useMemo(() => deckPalette(theme), [theme])
  const hotspots = opsDeckHotspots as HotspotDef[]

  const onOperatorTap = () => {
    const pool = hotspots.map((h) => h.id)
    const next = pool[Math.floor(Math.random() * pool.length)]!
    onSendOperator(next)
  }

  return (
    <>
      <color attach="background" args={[palette.bg]} />
      <fog attach="fog" args={[palette.bg, 10, 22]} />

      <ambientLight intensity={theme === 'bright' ? 0.85 : 0.35} />
      <directionalLight
        position={[4.5, 8, 3]}
        intensity={theme === 'bright' ? 1.15 : 0.75}
        castShadow={!lowPower}
        shadow-mapSize-width={lowPower ? 512 : 1024}
        shadow-mapSize-height={lowPower ? 512 : 1024}
        shadow-camera-far={20}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <pointLight
        position={[0, 2.4, 0]}
        intensity={theme === 'bright' ? 0.35 : 0.9}
        color={palette.accent}
        distance={10}
      />
      <pointLight
        position={[-3, 1.8, 2]}
        intensity={0.35}
        color={palette.accent2}
        distance={8}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[18, 14]} />
        <meshStandardMaterial color={palette.floor} roughness={0.92} metalness={0.05} />
      </mesh>

      <Grid
        position={[0, 0.001, 0]}
        args={[18, 14]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor={palette.accent2}
        sectionSize={2}
        sectionThickness={1.1}
        sectionColor={palette.accent}
        fadeDistance={14}
        fadeStrength={1.4}
        infiniteGrid={false}
      />

      <mesh position={[0, 0.04, 0]} receiveShadow castShadow>
        <boxGeometry args={[8.2, 0.1, 5.6]} />
        <meshStandardMaterial color={palette.desk} roughness={0.7} metalness={0.15} />
      </mesh>
      <mesh position={[0, -0.35, 0]} castShadow>
        <boxGeometry args={[7.6, 0.7, 5]} />
        <meshStandardMaterial color={palette.metal} roughness={0.65} metalness={0.25} />
      </mesh>

      <group position={[0, 0.12, 2.55]}>
        {[-0.35, 0, 0.35].map((x, i) => (
          <mesh key={x} position={[x, 0, 0]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshStandardMaterial
              color={i === 0 ? palette.ok : i === 1 ? palette.accent : palette.accent2}
              emissive={i === 0 ? palette.ok : i === 1 ? palette.accent : palette.accent2}
              emissiveIntensity={theme === 'duty' ? 0.85 : 0.4}
            />
          </mesh>
        ))}
      </group>

      {hotspots.map((spot) => (
        <HotspotMesh
          key={`mesh-${spot.id}`}
          spot={spot}
          palette={palette}
          active={activeSection === spot.id}
          targeted={operatorTarget === spot.id}
          onOpen={onOpenSection}
        />
      ))}

      {/* In-scene Html labels capped: only avatar pod + operator tip use drei Html.
          Section names live in the 2D legend / mobile rail (avoids portal dropouts). */}

      <AvatarPod
        open={avatarOpen}
        onToggle={onToggleAvatar}
        palette={palette}
        theme={theme}
      />

      <Operator3D
        hotspots={hotspots}
        target={operatorTarget}
        ticket={operatorTicket}
        onArrive={onOperatorArrive}
        onTap={onOperatorTap}
        palette={palette}
      />

      {!lowPower && (
        <ContactShadows
          position={[0, 0.011, 0]}
          opacity={theme === 'bright' ? 0.35 : 0.55}
          scale={12}
          blur={2.2}
          far={4}
        />
      )}

      <OrbitControls
        makeDefault
        enablePan={false}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI / 2.15}
        minDistance={4.5}
        maxDistance={12}
        target={[0, 0.6, 0]}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  )
}

function AvatarPod({
  open,
  onToggle,
  palette,
  theme,
}: {
  open: boolean
  onToggle: () => void
  palette: DeckPalette
  theme: ThemeMode
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <group
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
          roughness={0.35}
          metalness={0.3}
          emissive={palette.accent}
          emissiveIntensity={open || hovered ? 0.35 : 0.12}
        />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <sphereGeometry args={[0.42, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={palette.accent}
          transparent
          opacity={theme === 'duty' ? 0.35 : 0.25}
          roughness={0.2}
          metalness={0.4}
          emissive={palette.accent}
          emissiveIntensity={open ? 0.6 : 0.25}
        />
      </mesh>
      <Html position={[0, 1.35, 0]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
        <div className={`ops-html-label ops-html-pod${open || hovered ? ' is-hot' : ''}`}>
          <span className="ops-html-kicker">中央对话舱</span>
          <span className="ops-html-title">AI 分身</span>
        </div>
      </Html>
    </group>
  )
}
