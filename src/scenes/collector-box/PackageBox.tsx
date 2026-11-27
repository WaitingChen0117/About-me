import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { BOX, BRAND, FRONT_WINDOW, NICHE_FLOOR_Y, RIGHT_WINDOW } from './boxLayout'
import { frontBadgeLayout } from './textures'
import {
  createBackTexture,
  createBottomTexture,
  createFrontTexture,
  createLeftTexture,
  createRightTexture,
  createTopTexture,
} from './textures'

type PackageBoxProps = {
  onPointerDown: (e: any) => void
  onClickWork: (index: number) => void
  onClickAbout: () => void
  onClickWorks: () => void
  onClickStudio: () => void
  lowPower: boolean
}

function roundedHole(cx: number, cy: number, w: number, h: number, radius: number) {
  const hole = new THREE.Path()
  const w2 = w / 2
  const h2 = h / 2
  const r = Math.min(radius, w2, h2)
  hole.moveTo(cx - w2 + r, cy - h2)
  hole.lineTo(cx + w2 - r, cy - h2)
  hole.quadraticCurveTo(cx + w2, cy - h2, cx + w2, cy - h2 + r)
  hole.lineTo(cx + w2, cy + h2 - r)
  hole.quadraticCurveTo(cx + w2, cy + h2, cx + w2 - r, cy + h2)
  hole.lineTo(cx - w2 + r, cy + h2)
  hole.quadraticCurveTo(cx - w2, cy + h2, cx - w2, cy + h2 - r)
  hole.lineTo(cx - w2, cy - h2 + r)
  hole.quadraticCurveTo(cx - w2, cy - h2, cx - w2 + r, cy - h2)
  hole.closePath()
  return hole
}

function windowFrame(faceW: number, faceH: number, winW: number, winH: number, winY: number, winX = 0) {
  const shape = new THREE.Shape()
  const hw = faceW / 2
  const hh = faceH / 2
  shape.moveTo(-hw, -hh)
  shape.lineTo(-hw, hh)
  shape.lineTo(hw, hh)
  shape.lineTo(hw, -hh)
  shape.closePath()
  shape.holes.push(roundedHole(winX, winY, winW, winH, 0.1))
  return shape
}

function lipShape(winW: number, winH: number, winY: number, thickness: number, winX = 0) {
  const ow = winW / 2 + thickness
  const oh = winH / 2 + thickness
  const r = 0.11
  const cy = winY
  const cx = winX
  const lip = new THREE.Shape()
  lip.moveTo(cx - ow + r, cy - oh)
  lip.lineTo(cx + ow - r, cy - oh)
  lip.quadraticCurveTo(cx + ow, cy - oh, cx + ow, cy - oh + r)
  lip.lineTo(cx + ow, cy + oh - r)
  lip.quadraticCurveTo(cx + ow, cy + oh, cx + ow - r, cy + oh)
  lip.lineTo(cx - ow + r, cy + oh)
  lip.quadraticCurveTo(cx - ow, cy + oh, cx - ow, cy + oh - r)
  lip.lineTo(cx - ow, cy - oh + r)
  lip.quadraticCurveTo(cx - ow, cy - oh, cx - ow + r, cy - oh)
  lip.closePath()
  lip.holes.push(roundedHole(winX, winY, winW, winH, 0.1))
  return lip
}

function faceUVGenerator(width: number, height: number): THREE.UVGenerator {
  return {
    generateTopUV(_geometry, vertices, indexA, indexB, indexC) {
      const uv = (i: number) =>
        new THREE.Vector2(vertices[i * 3]! / width + 0.5, vertices[i * 3 + 1]! / height + 0.5)
      return [uv(indexA), uv(indexB), uv(indexC)]
    },
    generateSideWallUV(_geometry, vertices, indexA, indexB, indexC, indexD) {
      const uv = (i: number) => {
        const x = vertices[i * 3]!
        const y = vertices[i * 3 + 1]!
        const z = vertices[i * 3 + 2]!
        if (Math.abs(y) > Math.abs(x)) {
          return new THREE.Vector2(y / height + 0.5, 1 - z)
        }
        return new THREE.Vector2(x / width + 0.5, 1 - z)
      }
      return [uv(indexA), uv(indexB), uv(indexC), uv(indexD)]
    },
  }
}

function HangTab() {
  const geometry = useMemo(() => {
    const w = 0.34
    const h = 0.3
    const r = 0.04
    const shape = new THREE.Shape()
    shape.moveTo(-w / 2 + r, -h / 2)
    shape.lineTo(w / 2 - r, -h / 2)
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r)
    shape.lineTo(w / 2, h / 2 - r)
    shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2)
    shape.lineTo(-w / 2 + r, h / 2)
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r)
    shape.lineTo(-w / 2, -h / 2 + r)
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2)
    shape.closePath()
    const hole = new THREE.Path()
    hole.absellipse(0, h / 2 - 0.1, 0.048, 0.048, 0, Math.PI * 2, true)
    shape.holes.push(hole)
    return new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: false, steps: 1 })
  }, [])

  useEffect(() => () => geometry.dispose(), [geometry])

  // Stand on the lid, toward the back edge so it reads in the hero shot.
  return (
    <mesh
      geometry={geometry}
      position={[0, BOX.h / 2 + 0.15, -BOX.d / 2 + 0.18]}
      rotation={[0, 0, 0]}
      castShadow
    >
      <meshStandardMaterial color={BRAND.kraft} roughness={0.72} metalness={0.02} />
    </mesh>
  )
}

export function PackageBox({
  onPointerDown,
  onClickWork,
  onClickAbout,
  onClickWorks,
  onClickStudio,
}: PackageBoxProps) {
  const [fontsReady, setFontsReady] = useState(false)
  useEffect(() => {
    let cancelled = false
    const ready = document.fonts ? document.fonts.ready : Promise.resolve()
    ready.then(() => {
      if (!cancelled) setFontsReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const textures = useMemo(() => {
    void fontsReady
    return {
      front: createFrontTexture(),
      back: createBackTexture(),
      left: createLeftTexture(),
      right: createRightTexture(),
      top: createTopTexture(),
      bottom: createBottomTexture(),
    }
  }, [fontsReady])

  useEffect(() => {
    return () => {
      Object.values(textures).forEach((t) => t.dispose())
    }
  }, [textures])

  const frontShape = useMemo(
    () => windowFrame(BOX.w, BOX.h, FRONT_WINDOW.w, FRONT_WINDOW.h, FRONT_WINDOW.y),
    [],
  )
  const rightShape = useMemo(
    () => windowFrame(BOX.d, BOX.h, RIGHT_WINDOW.w, RIGHT_WINDOW.h, RIGHT_WINDOW.y, RIGHT_WINDOW.x),
    [],
  )
  const frontLip = useMemo(() => lipShape(FRONT_WINDOW.w, FRONT_WINDOW.h, FRONT_WINDOW.y, 0.028), [])
  const rightLip = useMemo(() => lipShape(RIGHT_WINDOW.w, RIGHT_WINDOW.h, RIGHT_WINDOW.y, 0.028, RIGHT_WINDOW.x), [])

  const frontUV = useMemo(() => faceUVGenerator(BOX.w, BOX.h), [])
  const rightUV = useMemo(() => faceUVGenerator(BOX.d, BOX.h), [])
  const frontGeom = useMemo(
    () => new THREE.ExtrudeGeometry(frontShape, { depth: BOX.wall, bevelEnabled: false, UVGenerator: frontUV }),
    [frontShape, frontUV],
  )
  const rightGeom = useMemo(
    () => new THREE.ExtrudeGeometry(rightShape, { depth: BOX.wall, bevelEnabled: false, UVGenerator: rightUV }),
    [rightShape, rightUV],
  )
  const frontLipGeom = useMemo(
    () => new THREE.ExtrudeGeometry(frontLip, { depth: 0.016, bevelEnabled: false }),
    [frontLip],
  )
  const rightLipGeom = useMemo(
    () => new THREE.ExtrudeGeometry(rightLip, { depth: 0.016, bevelEnabled: false }),
    [rightLip],
  )
  useEffect(() => () => {
    frontGeom.dispose()
    rightGeom.dispose()
    frontLipGeom.dispose()
    rightLipGeom.dispose()
  }, [frontGeom, rightGeom, frontLipGeom, rightLipGeom])

  const hw = BOX.w / 2
  const hh = BOX.h / 2
  const hd = BOX.d / 2
  const wall = BOX.wall
  const badges = frontBadgeLayout()

  const badgeWorld = (nx: number, ny: number) => {
    const x = (nx - 0.5) * BOX.w
    const y = (0.5 - ny) * BOX.h
    return [x, y, wall + 0.012] as const
  }

  return (
    <group>
      {/* Front wall with window */}
      <group position={[0, 0, hd]}>
        <mesh castShadow receiveShadow onPointerDown={onPointerDown} geometry={frontGeom}>
          <meshStandardMaterial map={textures.front} roughness={0.68} metalness={0.02} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, wall + 0.001]} geometry={frontLipGeom}>
          <meshStandardMaterial color={BRAND.cream} roughness={0.45} metalness={0.04} />
        </mesh>

        {/* ABOUT / WORKS / STUDIO hit targets */}
        <mesh
          position={badgeWorld(badges.aboutX, badges.y) as unknown as [number, number, number]}
          onClick={(e) => {
            e.stopPropagation()
            onClickAbout()
          }}
        >
          <planeGeometry args={[BOX.w * badges.badgeW, BOX.h * badges.h]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        <mesh
          position={badgeWorld(badges.worksX, badges.y) as unknown as [number, number, number]}
          onClick={(e) => {
            e.stopPropagation()
            onClickWorks()
          }}
        >
          <planeGeometry args={[BOX.w * badges.badgeW, BOX.h * badges.h]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        <mesh
          position={badgeWorld(badges.studioX, badges.y) as unknown as [number, number, number]}
          onClick={(e) => {
            e.stopPropagation()
            onClickStudio()
          }}
        >
          <planeGeometry args={[BOX.w * badges.badgeW, BOX.h * badges.h]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>

      {/* Back (works) */}
      <group position={[0, 0, -hd - wall / 2]} rotation={[0, Math.PI, 0]}>
        <mesh castShadow receiveShadow onPointerDown={onPointerDown}>
          <planeGeometry args={[BOX.w, BOX.h]} />
          <meshStandardMaterial map={textures.back} roughness={0.68} metalness={0.02} side={THREE.DoubleSide} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh
            key={i}
            position={[0, hh * 0.52 - i * (BOX.h * 0.145), -wall / 2 - 0.01]}
            rotation={[0, Math.PI, 0]}
            onClick={(e) => {
              e.stopPropagation()
              onClickWork(i)
            }}
          >
            <planeGeometry args={[BOX.w * 0.84, BOX.h * 0.12]} />
            <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        ))}
      </group>

      {/* Left (about) */}
      <group position={[-hw - wall / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh castShadow receiveShadow onPointerDown={onPointerDown}>
          <planeGeometry args={[BOX.d, BOX.h]} />
          <meshStandardMaterial map={textures.left} roughness={0.68} metalness={0.02} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Right (profile + barcode) */}
      <group position={[hw, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh castShadow receiveShadow onPointerDown={onPointerDown} geometry={rightGeom}>
          <meshStandardMaterial map={textures.right} roughness={0.68} metalness={0.02} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, wall + 0.001]} geometry={rightLipGeom}>
          <meshStandardMaterial color={BRAND.cream} roughness={0.45} metalness={0.04} />
        </mesh>
      </group>

      {/* Top */}
      <group position={[0, hh + wall / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow receiveShadow onPointerDown={onPointerDown}>
          <planeGeometry args={[BOX.w, BOX.d]} />
          <meshStandardMaterial map={textures.top} roughness={0.68} metalness={0.02} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Bottom */}
      <group position={[0, -hh - wall / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh castShadow receiveShadow onPointerDown={onPointerDown}>
          <planeGeometry args={[BOX.w, BOX.d]} />
          <meshStandardMaterial map={textures.bottom} roughness={0.68} metalness={0.02} side={THREE.DoubleSide} />
        </mesh>
      </group>

      <HangTab />

      {/* Shallow display niche — floor at the window sill */}
      <mesh
        position={[0, NICHE_FLOOR_Y, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[BOX.w - wall * 2, BOX.d - wall * 2]} />
        <meshStandardMaterial color="#1c1916" roughness={0.86} metalness={0.02} />
      </mesh>
      <mesh position={[0, NICHE_FLOOR_Y + (hh - NICHE_FLOOR_Y) / 2, -hd + wall / 2]} receiveShadow>
        <planeGeometry args={[BOX.w - wall * 2, hh - NICHE_FLOOR_Y]} />
        <meshStandardMaterial color="#241f1b" roughness={0.84} metalness={0.02} />
      </mesh>
      <mesh
        position={[-hw + wall / 2, NICHE_FLOOR_Y + (hh - NICHE_FLOOR_Y) / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[BOX.d - wall * 2, hh - NICHE_FLOOR_Y]} />
        <meshStandardMaterial color="#211d1a" roughness={0.84} metalness={0.02} />
      </mesh>
    </group>
  )
}
