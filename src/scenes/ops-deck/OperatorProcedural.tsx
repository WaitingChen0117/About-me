import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'

/**
 * Beautified procedural Operator — vinyl / collector-toy silhouette.
 *
 * Inspired by contemporary procedural mascots (clean silhouette, matte clothes
 * vs lacquered accents, readable head-to-body) — not a denser remesh of the
 * rejected lumpy hair stack. Still glasses + oversized hoodie + R/W/B sneakers.
 */

export const PROCEDURAL_STAND_Y_LIFT = 0.12
/** Hip planted on cushion for Scene A sit. */
export const PROCEDURAL_SIT_Y = 0.15

const CALF_Y_STAND = -0.18
const CALF_Y_SIT = -0.34

const C = {
  skin: '#e6d0bc',
  skinDeep: '#d4b9a4',
  hair: '#a67b52',
  hairDeep: '#7a5738',
  eye: '#2a1a12',
  glasses: '#121214',
  hoodie: '#161618',
  hoodieMatte: '#1c1c20',
  pants: '#141416',
  logo: '#f2f2f4',
  sole: '#ececef',
  red: '#c4282e',
  blue: '#2a4f9a',
  blush: '#e8a090',
} as const

type Props = {
  walking: boolean
  /** Live 0 standing → 1 seated L-sit (read each frame; avoids re-render spam). */
  sitAmountRef: MutableRefObject<number>
  highlight?: boolean
}

export function OperatorProcedural({ walking, sitAmountRef, highlight = false }: Props) {
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  const calfL = useRef<THREE.Group>(null)
  const calfR = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const torso = useRef<THREE.Mesh>(null)
  const standLegs = useRef<THREE.Group>(null)
  const sitLegs = useRef<THREE.Group>(null)
  const eyeLidL = useRef<THREE.Mesh>(null)
  const eyeLidR = useRef<THREE.Mesh>(null)
  const stride = useRef(0)
  const blinkT = useRef(3.4)
  const blinkPhase = useRef(0)
  const sitRef = sitAmountRef

  const m = useMemo(
    () => ({
      // Soft clay skin — not plastic
      skin: new THREE.MeshStandardMaterial({
        color: C.skin,
        roughness: 0.78,
        metalness: 0.02,
      }),
      skinDeep: new THREE.MeshStandardMaterial({
        color: C.skinDeep,
        roughness: 0.82,
        metalness: 0.02,
      }),
      // Hair: soft matte vinyl clumps
      hair: new THREE.MeshStandardMaterial({
        color: C.hair,
        roughness: 0.88,
        metalness: 0,
      }),
      hairDeep: new THREE.MeshStandardMaterial({
        color: C.hairDeep,
        roughness: 0.9,
        metalness: 0,
      }),
      // Dark clothes stay matte (kaanses-style), not greasy
      hoodie: new THREE.MeshStandardMaterial({
        color: C.hoodie,
        roughness: 0.92,
        metalness: 0.02,
        emissive: new THREE.Color(C.hoodieMatte),
        emissiveIntensity: 0.015,
      }),
      pants: new THREE.MeshStandardMaterial({
        color: C.pants,
        roughness: 0.94,
        metalness: 0.02,
      }),
      // Lacquered toy accents
      glasses: new THREE.MeshStandardMaterial({
        color: C.glasses,
        roughness: 0.22,
        metalness: 0.35,
      }),
      logo: new THREE.MeshStandardMaterial({
        color: C.logo,
        roughness: 0.45,
        metalness: 0.08,
      }),
      sole: new THREE.MeshStandardMaterial({
        color: C.sole,
        roughness: 0.65,
        metalness: 0.04,
      }),
      // Lacquered toy sneakers — gloss vs matte hoodie (Buddy / Kai contrast)
      red: new THREE.MeshStandardMaterial({
        color: C.red,
        roughness: 0.28,
        metalness: 0.18,
      }),
      blue: new THREE.MeshStandardMaterial({
        color: C.blue,
        roughness: 0.3,
        metalness: 0.2,
      }),
      eye: new THREE.MeshStandardMaterial({
        color: C.eye,
        roughness: 0.35,
        metalness: 0.05,
      }),
      eyeWhite: new THREE.MeshStandardMaterial({
        color: '#f8f5f1',
        roughness: 0.4,
        metalness: 0.02,
      }),
    }),
    [],
  )

  useFrame((_, dt) => {
    const delta = Math.min(dt, 0.05)
    const a = THREE.MathUtils.clamp(sitRef.current, 0, 1)

    if (standLegs.current) {
      standLegs.current.visible = a < 0.98
      standLegs.current.scale.setScalar(1 - a * 0.88)
    }
    if (sitLegs.current) {
      sitLegs.current.visible = a > 0.02
      sitLegs.current.scale.setScalar(0.12 + 0.88 * a)
    }

    if (torso.current) {
      const mat = torso.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = highlight || walking ? 0.06 : 0.015
    }

    // Blink when idle standing
    if (!walking && a < 0.05) {
      blinkT.current -= delta
      if (blinkT.current <= 0) {
        blinkPhase.current = 1
        blinkT.current = 2.8 + Math.random() * 3.2
      }
      if (blinkPhase.current > 0) {
        blinkPhase.current = Math.max(0, blinkPhase.current - delta * 10)
      }
      const lid =
        blinkPhase.current > 0.5
          ? (1 - blinkPhase.current) * 2
          : blinkPhase.current * 2
      const sy = 1 - Math.min(1, lid) * 0.92
      if (eyeLidL.current) eyeLidL.current.scale.y = sy
      if (eyeLidR.current) eyeLidR.current.scale.y = sy
    }

    if (a > 0.02) {
      const thigh = a * -1.52
      const shin = a * 1.48
      const calfY = THREE.MathUtils.lerp(CALF_Y_STAND, CALF_Y_SIT, a)
      if (legL.current) legL.current.rotation.x = thigh
      if (legR.current) legR.current.rotation.x = thigh
      if (calfL.current) {
        calfL.current.rotation.x = shin
        calfL.current.position.set(0, calfY, a * 0.02)
      }
      if (calfR.current) {
        calfR.current.rotation.x = shin
        calfR.current.position.set(0, calfY, a * 0.02)
      }
      if (armL.current) armL.current.rotation.x = a * -0.32
      if (armR.current) armR.current.rotation.x = a * -0.26
      return
    }

    if (walking) {
      stride.current += delta * 11.5
      const swing = Math.sin(stride.current) * 0.58
      const armSwing = Math.sin(stride.current) * 0.5
      if (legL.current) legL.current.rotation.x = swing
      if (legR.current) legR.current.rotation.x = -swing
      if (armL.current) armL.current.rotation.x = -armSwing
      if (armR.current) armR.current.rotation.x = armSwing
      if (calfL.current) {
        calfL.current.rotation.x = 0
        calfL.current.position.set(0, CALF_Y_STAND, 0)
      }
      if (calfR.current) {
        calfR.current.rotation.x = 0
        calfR.current.position.set(0, CALF_Y_STAND, 0)
      }
      return
    }

    const damp = (g: THREE.Group | null, prop: 'x', to: number) => {
      if (!g) return
      g.rotation[prop] = THREE.MathUtils.damp(g.rotation[prop], to, 10, delta)
    }
    damp(legL.current, 'x', 0)
    damp(legR.current, 'x', 0)
    damp(armL.current, 'x', 0)
    damp(armR.current, 'x', 0)
    if (calfL.current) {
      calfL.current.rotation.x = THREE.MathUtils.damp(calfL.current.rotation.x, 0, 10, delta)
      calfL.current.position.y = THREE.MathUtils.damp(calfL.current.position.y, CALF_Y_STAND, 10, delta)
      calfL.current.position.z = THREE.MathUtils.damp(calfL.current.position.z, 0, 10, delta)
    }
    if (calfR.current) {
      calfR.current.rotation.x = THREE.MathUtils.damp(calfR.current.rotation.x, 0, 10, delta)
      calfR.current.position.y = THREE.MathUtils.damp(calfR.current.position.y, CALF_Y_STAND, 10, delta)
      calfR.current.position.z = THREE.MathUtils.damp(calfR.current.position.z, 0, 10, delta)
    }
  })

  return (
    <group>
      {/* —— Head: vinyl ball + designed hair helmet (readable desk-back) —— */}
      <group position={[0, 0.98, 0]}>
        <mesh castShadow material={m.skin}>
          <sphereGeometry args={[0.235, 36, 28]} />
        </mesh>
        {/* Soft cheeks */}
        <mesh position={[-0.13, -0.035, 0.15]} scale={[0.65, 0.5, 0.5]} material={m.skinDeep}>
          <sphereGeometry args={[0.07, 14, 12]} />
        </mesh>
        <mesh position={[0.13, -0.035, 0.15]} scale={[0.65, 0.5, 0.5]} material={m.skinDeep}>
          <sphereGeometry args={[0.07, 14, 12]} />
        </mesh>
        {/* Blush discs — small hard tint */}
        <mesh position={[-0.12, -0.03, 0.2]} scale={[1, 0.5, 0.3]}>
          <sphereGeometry args={[0.035, 10, 8]} />
          <meshStandardMaterial color={C.blush} roughness={0.85} transparent opacity={0.4} depthWrite={false} />
        </mesh>
        <mesh position={[0.12, -0.03, 0.2]} scale={[1, 0.5, 0.3]}>
          <sphereGeometry args={[0.035, 10, 8]} />
          <meshStandardMaterial color={C.blush} roughness={0.85} transparent opacity={0.4} depthWrite={false} />
        </mesh>

        {/* Ears — tucked, crisp */}
        <mesh position={[-0.22, 0.01, -0.01]} castShadow material={m.skin}>
          <sphereGeometry args={[0.04, 14, 12]} />
        </mesh>
        <mesh position={[0.22, 0.01, -0.01]} castShadow material={m.skin}>
          <sphereGeometry args={[0.04, 14, 12]} />
        </mesh>

        {/* Eyes + lids */}
        <group position={[-0.072, 0.015, 0.195]}>
          <mesh material={m.eyeWhite}>
            <sphereGeometry args={[0.04, 14, 12]} />
          </mesh>
          <mesh position={[0, -0.002, 0.028]} material={m.eye}>
            <sphereGeometry args={[0.024, 12, 10]} />
          </mesh>
          {/* Hard specular highlight (cel / vinyl) */}
          <mesh position={[0.01, 0.012, 0.042]}>
            <sphereGeometry args={[0.007, 8, 6]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh ref={eyeLidL} position={[0, 0.012, 0.008]} scale={[1.05, 1, 1.05]} material={m.skin}>
            <sphereGeometry args={[0.042, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
          </mesh>
        </group>
        <group position={[0.072, 0.015, 0.195]}>
          <mesh material={m.eyeWhite}>
            <sphereGeometry args={[0.04, 14, 12]} />
          </mesh>
          <mesh position={[0, -0.002, 0.028]} material={m.eye}>
            <sphereGeometry args={[0.024, 12, 10]} />
          </mesh>
          <mesh position={[0.01, 0.012, 0.042]}>
            <sphereGeometry args={[0.007, 8, 6]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh ref={eyeLidR} position={[0, 0.012, 0.008]} scale={[1.05, 1, 1.05]} material={m.skin}>
            <sphereGeometry args={[0.042, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
          </mesh>
        </group>

        <mesh position={[0, -0.055, 0.22]} scale={[1.15, 0.45, 0.6]} material={m.glasses}>
          <sphereGeometry args={[0.012, 8, 6]} />
        </mesh>

        <RoundGlasses material={m.glasses} />
        <HairCap materials={m} />
      </group>

      {/* —— Oversized matte hoodie —— */}
      <mesh ref={torso} position={[0, 0.52, 0]} castShadow material={m.hoodie}>
        <capsuleGeometry args={[0.195, 0.22, 8, 18]} />
      </mesh>
      <mesh position={[0, 0.58, 0.02]} castShadow material={m.hoodie}>
        <sphereGeometry args={[0.23, 24, 18]} />
      </mesh>
      {/* Shoulders */}
      <mesh position={[-0.19, 0.68, 0]} scale={[0.65, 0.5, 0.7]} castShadow material={m.hoodie}>
        <sphereGeometry args={[0.11, 14, 12]} />
      </mesh>
      <mesh position={[0.19, 0.68, 0]} scale={[0.65, 0.5, 0.7]} castShadow material={m.hoodie}>
        <sphereGeometry args={[0.11, 14, 12]} />
      </mesh>
      {/* Hem rib */}
      <mesh position={[0, 0.34, 0]} castShadow material={m.hoodie}>
        <cylinderGeometry args={[0.205, 0.195, 0.06, 20]} />
      </mesh>
      {/* Kangaroo pocket — color block */}
      <mesh position={[0, 0.46, 0.17]} castShadow material={m.hoodie}>
        <boxGeometry args={[0.22, 0.12, 0.055]} />
      </mesh>
      {/* Hood on back — one clean mass, not lumps */}
      <mesh position={[0, 0.7, -0.11]} castShadow material={m.hoodie}>
        <sphereGeometry args={[0.13, 18, 14]} />
      </mesh>
      {/* Drawstrings */}
      <mesh position={[-0.035, 0.55, 0.215]} rotation={[0.12, 0, 0.06]} material={m.logo}>
        <cylinderGeometry args={[0.005, 0.005, 0.2, 6]} />
      </mesh>
      <mesh position={[0.035, 0.55, 0.215]} rotation={[0.12, 0, -0.06]} material={m.logo}>
        <cylinderGeometry args={[0.005, 0.005, 0.2, 6]} />
      </mesh>
      <mesh position={[-0.035, 0.45, 0.225]} material={m.logo}>
        <sphereGeometry args={[0.01, 8, 6]} />
      </mesh>
      <mesh position={[0.035, 0.45, 0.225]} material={m.logo}>
        <sphereGeometry args={[0.01, 8, 6]} />
      </mesh>

      {/* White rabbit logo — wearer's left */}
      <group position={[0.095, 0.62, 0.215]}>
        <mesh material={m.logo}>
          <sphereGeometry args={[0.026, 12, 10]} />
        </mesh>
        <mesh position={[-0.014, 0.035, 0]} rotation={[0, 0, 0.35]} material={m.logo}>
          <capsuleGeometry args={[0.007, 0.028, 4, 8]} />
        </mesh>
        <mesh position={[0.014, 0.035, 0]} rotation={[0, 0, -0.35]} material={m.logo}>
          <capsuleGeometry args={[0.007, 0.028, 4, 8]} />
        </mesh>
      </group>

      {/* Arms */}
      <group ref={armL} position={[-0.255, 0.58, 0]}>
        <mesh position={[0, -0.11, 0]} castShadow material={m.hoodie}>
          <capsuleGeometry args={[0.065, 0.13, 6, 12]} />
        </mesh>
        <mesh position={[0, -0.23, 0]} castShadow material={m.hoodie}>
          <cylinderGeometry args={[0.06, 0.055, 0.045, 12]} />
        </mesh>
        <mesh position={[0, -0.275, 0.01]} castShadow material={m.skin}>
          <sphereGeometry args={[0.042, 12, 10]} />
        </mesh>
      </group>
      <group ref={armR} position={[0.255, 0.58, 0]}>
        <mesh position={[0, -0.11, 0]} castShadow material={m.hoodie}>
          <capsuleGeometry args={[0.065, 0.13, 6, 12]} />
        </mesh>
        <mesh position={[0, -0.23, 0]} castShadow material={m.hoodie}>
          <cylinderGeometry args={[0.06, 0.055, 0.045, 12]} />
        </mesh>
        <mesh position={[0, -0.275, 0.01]} castShadow material={m.skin}>
          <sphereGeometry args={[0.042, 12, 10]} />
        </mesh>
      </group>

      {/* Standing legs */}
      <group ref={standLegs}>
        <group ref={legL} position={[-0.085, 0.32, 0]}>
          <mesh position={[0, -0.09, 0]} castShadow material={m.pants}>
            <capsuleGeometry args={[0.07, 0.11, 6, 12]} />
          </mesh>
          <group ref={calfL} position={[0, CALF_Y_STAND, 0]}>
            <mesh position={[0, -0.075, 0]} castShadow material={m.pants}>
              <capsuleGeometry args={[0.062, 0.055, 6, 12]} />
            </mesh>
            <mesh position={[0, -0.13, 0]} castShadow material={m.pants}>
              <cylinderGeometry args={[0.058, 0.05, 0.035, 12]} />
            </mesh>
            <Sneaker materials={m} yOffset={-0.185} />
          </group>
        </group>
        <group ref={legR} position={[0.085, 0.32, 0]}>
          <mesh position={[0, -0.09, 0]} castShadow material={m.pants}>
            <capsuleGeometry args={[0.07, 0.11, 6, 12]} />
          </mesh>
          <group ref={calfR} position={[0, CALF_Y_STAND, 0]}>
            <mesh position={[0, -0.075, 0]} castShadow material={m.pants}>
              <capsuleGeometry args={[0.062, 0.055, 6, 12]} />
            </mesh>
            <mesh position={[0, -0.13, 0]} castShadow material={m.pants}>
              <cylinderGeometry args={[0.058, 0.05, 0.035, 12]} />
            </mesh>
            <Sneaker materials={m} yOffset={-0.185} />
          </group>
        </group>
      </group>

      {/* Explicit L-sit legs */}
      <group ref={sitLegs} visible={false}>
        <SitLeg materials={m} side={-1} />
        <SitLeg materials={m} side={1} />
      </group>
    </group>
  )
}

/**
 * Vinyl hair — one readable helmet silhouette (front / ¾ / desk-back).
 * Soft crown + single back oval; no stacked bun lumps.
 */
function HairCap({
  materials: m,
}: {
  materials: {
    hair: THREE.MeshStandardMaterial
    hairDeep: THREE.MeshStandardMaterial
  }
}) {
  return (
    <group>
      {/* Helmet crown — continuous dome */}
      <mesh position={[0, 0.1, -0.015]} scale={[1.08, 0.78, 1.02]} castShadow material={m.hair}>
        <sphereGeometry args={[0.225, 28, 20]} />
      </mesh>
      {/* Single back mass — desk-camera silhouette */}
      <mesh
        position={[0, 0.02, -0.155]}
        scale={[0.98, 1.05, 0.82]}
        castShadow
        material={m.hairDeep}
      >
        <sphereGeometry args={[0.155, 22, 18]} />
      </mesh>
      {/* Side curtains — tuck ears without lumping */}
      <mesh position={[-0.175, 0.02, -0.02]} scale={[0.55, 1.05, 0.85]} castShadow material={m.hair}>
        <sphereGeometry args={[0.1, 16, 14]} />
      </mesh>
      <mesh position={[0.175, 0.02, -0.02]} scale={[0.55, 1.05, 0.85]} castShadow material={m.hair}>
        <sphereGeometry args={[0.1, 16, 14]} />
      </mesh>
      {/* Soft fringe shelf above glasses */}
      <mesh position={[0, 0.13, 0.155]} scale={[1.15, 0.38, 0.48]} castShadow material={m.hair}>
        <sphereGeometry args={[0.095, 16, 12]} />
      </mesh>
      {/* Tiny lacquered highlight on crown (kaanses-style hard glint) */}
      <mesh position={[0.04, 0.2, 0.05]} scale={[1.2, 0.55, 0.7]}>
        <sphereGeometry args={[0.035, 10, 8]} />
        <meshBasicMaterial color="#d4b896" transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  )
}

function RoundGlasses({ material }: { material: THREE.MeshStandardMaterial }) {
  const r = 0.058
  const tube = 0.012
  const z = 0.235
  const y = 0.014
  return (
    <group>
      <mesh position={[-0.072, y, z]} material={material}>
        <torusGeometry args={[r, tube, 12, 36]} />
      </mesh>
      <mesh position={[0.072, y, z]} material={material}>
        <torusGeometry args={[r, tube, 12, 36]} />
      </mesh>
      {/* Soft lens wash */}
      <mesh position={[-0.072, y, z + 0.002]}>
        <circleGeometry args={[0.048, 24]} />
        <meshStandardMaterial
          color="#a8c0d0"
          transparent
          opacity={0.16}
          roughness={0.12}
          metalness={0.05}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0.072, y, z + 0.002]}>
        <circleGeometry args={[0.048, 24]} />
        <meshStandardMaterial
          color="#a8c0d0"
          transparent
          opacity={0.16}
          roughness={0.12}
          metalness={0.05}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, y + 0.005, z]} material={material}>
        <boxGeometry args={[0.03, 0.01, 0.01]} />
      </mesh>
      <mesh position={[-0.135, y, 0.1]} rotation={[0, 0.2, 0]} material={material}>
        <boxGeometry args={[0.012, 0.01, 0.2]} />
      </mesh>
      <mesh position={[0.135, y, 0.1]} rotation={[0, -0.2, 0]} material={material}>
        <boxGeometry args={[0.012, 0.01, 0.2]} />
      </mesh>
    </group>
  )
}

type FigMats = {
  pants: THREE.MeshStandardMaterial
  sole: THREE.MeshStandardMaterial
  red: THREE.MeshStandardMaterial
  blue: THREE.MeshStandardMaterial
  glasses: THREE.MeshStandardMaterial
}

function SitLeg({
  materials: mats,
  side,
}: {
  materials: FigMats
  side: number
}) {
  const x = side * 0.095
  const hipY = 0.3
  const thighLen = 0.34
  const kneeZ = thighLen
  const footY = -0.1
  const calfLen = hipY - footY
  return (
    <group>
      <mesh
        position={[x, hipY, kneeZ * 0.5]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
        material={mats.pants}
      >
        <capsuleGeometry args={[0.075, thighLen * 0.6, 6, 12]} />
      </mesh>
      <mesh position={[x, hipY - calfLen * 0.5, kneeZ]} castShadow material={mats.pants}>
        <capsuleGeometry args={[0.068, calfLen * 0.52, 6, 12]} />
      </mesh>
      <group position={[x, footY, kneeZ + 0.04]} scale={[1.15, 1.1, 1.2]}>
        <Sneaker materials={mats} yOffset={0} />
      </group>
    </group>
  )
}

function Sneaker({
  materials: mats,
  yOffset = -0.24,
}: {
  materials: FigMats
  yOffset?: number
}) {
  return (
    <group position={[0, yOffset, 0.03]} scale={[1.12, 1.08, 1.15]}>
      <mesh position={[0, -0.01, 0.02]} castShadow material={mats.sole}>
        <boxGeometry args={[0.125, 0.038, 0.21]} />
      </mesh>
      <mesh position={[0.052, 0.028, 0]} castShadow material={mats.blue}>
        <boxGeometry args={[0.038, 0.068, 0.15]} />
      </mesh>
      <mesh position={[-0.052, 0.028, 0]} castShadow material={mats.blue}>
        <boxGeometry args={[0.038, 0.068, 0.15]} />
      </mesh>
      <mesh position={[0, 0.025, 0.095]} castShadow material={mats.red}>
        <boxGeometry args={[0.115, 0.05, 0.065]} />
      </mesh>
      <mesh position={[0, 0.045, -0.08]} castShadow material={mats.red}>
        <boxGeometry args={[0.115, 0.085, 0.05]} />
      </mesh>
      <mesh position={[0, 0.055, 0.02]} material={mats.sole}>
        <boxGeometry args={[0.05, 0.018, 0.1]} />
      </mesh>
      <mesh position={[0, 0.018, 0.12]} material={mats.red}>
        <sphereGeometry args={[0.045, 10, 8]} />
      </mesh>
    </group>
  )
}
