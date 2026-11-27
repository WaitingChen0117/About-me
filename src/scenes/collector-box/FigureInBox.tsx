import { forwardRef, useRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import type { ThemeMode } from '../types'
import {
  Operator3D,
  type CollectorHandles,
  type CollectorPose,
} from '../ops-deck/Operator3D'
import * as THREE from 'three'
import { CoffeeCup, Laptop } from './CollectorProps'

export type DragPart = 'body' | 'head' | 'foot-left' | 'foot-right' | 'cup' | 'laptop' | null

type FigureInBoxProps = {
  onPointerDown: (e: any, part: DragPart) => void
  theme: ThemeMode
}

export type FigureInBoxHandle = {
  applyPartMotion: (part: DragPart, delta: { x: number; y: number }) => void
  resetPartMotion: (part?: DragPart) => void
  getCupWorldPosition: () => THREE.Vector3
  getCupWorldVelocity: () => THREE.Vector3
}

const EMPTY_POSE = (): CollectorPose => ({
  headTiltX: 0,
  headTiltY: 0,
  leftArmRaise: 0,
  rightArmRaise: 0,
  leftFootLift: 0,
  rightFootLift: 0,
})

const _world = new THREE.Vector3()
const _local = new THREE.Vector3()

export const FigureInBox = forwardRef<FigureInBoxHandle, FigureInBoxProps>(
  ({ onPointerDown }, ref) => {
    const introRef = useRef(1)
    const cupRef = useRef<THREE.Group>(null)
    const laptopRef = useRef<THREE.Group>(null)
    const cupAnchorRef = useRef<THREE.Group>(null)
    const laptopAnchorRef = useRef<THREE.Group>(null)

    const poseRef = useRef<CollectorPose>(EMPTY_POSE())
    const handlesRef = useRef<CollectorHandles>({ head: null, handL: null, handR: null })
    const activePartRef = useRef<DragPart>(null)
    const bodyLeanRef = useRef({ x: 0, z: 0 })
    const bodyLeanGroupRef = useRef<THREE.Group>(null)

    const lastCupPos = useRef(new THREE.Vector3())
    const cupVelocity = useRef(new THREE.Vector3())
    const cupPosReady = useRef(false)

    useImperativeHandle(ref, () => ({
      applyPartMotion(part: DragPart, delta: { x: number; y: number }) {
        activePartRef.current = part
        const pose = poseRef.current
        const turn = 0.012
        const lift = 0.02

        switch (part) {
          case 'head':
            // Drag down tilts the face down (+X); drag right yaws the head right.
            pose.headTiltX = THREE.MathUtils.clamp(pose.headTiltX + delta.y * turn, -0.55, 0.55)
            pose.headTiltY = THREE.MathUtils.clamp(pose.headTiltY + delta.x * turn, -0.75, 0.75)
            break
          case 'cup':
            pose.rightArmRaise = THREE.MathUtils.clamp(
              pose.rightArmRaise - delta.y * lift,
              -0.35,
              1.35,
            )
            break
          case 'laptop':
            pose.leftArmRaise = THREE.MathUtils.clamp(
              pose.leftArmRaise - delta.y * lift,
              -0.35,
              1.35,
            )
            break
          case 'foot-left':
            pose.leftFootLift = THREE.MathUtils.clamp(pose.leftFootLift - delta.y * lift, 0, 1.15)
            bodyLeanRef.current.x = THREE.MathUtils.clamp(
              bodyLeanRef.current.x + delta.x * 0.004,
              -0.22,
              0.22,
            )
            bodyLeanRef.current.z = THREE.MathUtils.clamp(
              bodyLeanRef.current.z - delta.y * 0.003,
              -0.18,
              0.18,
            )
            break
          case 'foot-right':
            pose.rightFootLift = THREE.MathUtils.clamp(pose.rightFootLift - delta.y * lift, 0, 1.15)
            bodyLeanRef.current.x = THREE.MathUtils.clamp(
              bodyLeanRef.current.x + delta.x * 0.004,
              -0.22,
              0.22,
            )
            bodyLeanRef.current.z = THREE.MathUtils.clamp(
              bodyLeanRef.current.z - delta.y * 0.003,
              -0.18,
              0.18,
            )
            break
        }
      },

      resetPartMotion() {
        activePartRef.current = null
      },

      getCupWorldPosition() {
        if (cupRef.current) {
          cupRef.current.getWorldPosition(_world)
          return _world.clone()
        }
        return new THREE.Vector3()
      },

      getCupWorldVelocity() {
        return cupVelocity.current.clone()
      },
    }))

    useFrame((_, dt) => {
      const pose = poseRef.current
      const part = activePartRef.current
      const damp = Math.pow(0.88, dt * 60)

      if (part !== 'head') {
        pose.headTiltX *= damp
        pose.headTiltY *= damp
        if (Math.abs(pose.headTiltX) < 0.002) pose.headTiltX = 0
        if (Math.abs(pose.headTiltY) < 0.002) pose.headTiltY = 0
      }
      if (part !== 'cup') {
        pose.rightArmRaise *= damp
        if (Math.abs(pose.rightArmRaise) < 0.002) pose.rightArmRaise = 0
      }
      if (part !== 'laptop') {
        pose.leftArmRaise *= damp
        if (Math.abs(pose.leftArmRaise) < 0.002) pose.leftArmRaise = 0
      }
      if (part !== 'foot-left') {
        pose.leftFootLift *= damp
        if (pose.leftFootLift < 0.002) pose.leftFootLift = 0
      }
      if (part !== 'foot-right') {
        pose.rightFootLift *= damp
        if (pose.rightFootLift < 0.002) pose.rightFootLift = 0
      }
      if (part !== 'foot-left' && part !== 'foot-right') {
        bodyLeanRef.current.x *= damp
        bodyLeanRef.current.z *= damp
        if (Math.abs(bodyLeanRef.current.x) < 0.002) bodyLeanRef.current.x = 0
        if (Math.abs(bodyLeanRef.current.z) < 0.002) bodyLeanRef.current.z = 0
      }

      if (bodyLeanGroupRef.current) {
        bodyLeanGroupRef.current.rotation.set(bodyLeanRef.current.z, 0, bodyLeanRef.current.x)
      }

      const { handL, handR } = handlesRef.current
      if (handR && cupAnchorRef.current) {
        handR.getWorldPosition(_world)
        _local.copy(_world)
        cupAnchorRef.current.parent?.worldToLocal(_local)
        cupAnchorRef.current.position.copy(_local)
      }
      if (handL && laptopAnchorRef.current) {
        handL.getWorldPosition(_world)
        _local.copy(_world)
        laptopAnchorRef.current.parent?.worldToLocal(_local)
        laptopAnchorRef.current.position.copy(_local)
        laptopAnchorRef.current.rotation.set(-0.35 + pose.leftArmRaise * 0.25, 0.2, 0)
      }

      if (cupRef.current) {
        cupRef.current.getWorldPosition(_world)
        if (cupPosReady.current) {
          cupVelocity.current.copy(_world).sub(lastCupPos.current).multiplyScalar(1 / Math.max(dt, 1 / 120))
        }
        lastCupPos.current.copy(_world)
        cupPosReady.current = true
      }
    })

    const handlePointerOver = (e: any) => {
      e.stopPropagation()
      document.body.style.cursor = 'grab'
    }

    const handlePointerOut = (e: any) => {
      e.stopPropagation()
      document.body.style.cursor = 'auto'
    }

    const handlePointerDownWrapper = (e: any, part: DragPart = 'body') => {
      e.stopPropagation()
      document.body.style.cursor = 'grabbing'
      onPointerDown(e, part)
    }

    return (
      <group position={[0, -1.05, 0]} scale={0.85} userData={{ restY: -1.05 }}>
        <group ref={bodyLeanGroupRef}>
          <mesh
            position={[0, 0.64, 0]}
            onPointerDown={(e) => handlePointerDownWrapper(e, 'body')}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onPointerMove={(e) => e.stopPropagation()}
          >
            <boxGeometry args={[0.5, 0.72, 0.4]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} />
          </mesh>

          <mesh
            position={[0, 1.08, 0]}
            onPointerDown={(e) => handlePointerDownWrapper(e, 'head')}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            <sphereGeometry args={[0.34, 16, 16]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} />
          </mesh>

          <mesh
            position={[-0.12, 0.08, 0.02]}
            onPointerDown={(e) => handlePointerDownWrapper(e, 'foot-left')}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            <boxGeometry args={[0.16, 0.14, 0.26]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} />
          </mesh>

          <mesh
            position={[0.12, 0.08, 0.02]}
            onPointerDown={(e) => handlePointerDownWrapper(e, 'foot-right')}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            <boxGeometry args={[0.16, 0.14, 0.26]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} />
          </mesh>

          <Operator3D
            hotspots={[]}
            target={null}
            ticket={0}
            onArrive={() => {}}
            onTap={() => {}}
            palette={{ accent: '#5a7fa5', accentAlt: '#3d5571' } as any}
            introRef={introRef}
            home={[0, 0, 0]}
            collectorMode={true}
            collectorPoseRef={poseRef}
            collectorHandlesRef={handlesRef}
          />

          <group ref={cupAnchorRef} position={[0.26, 0.44, 0.08]}>
            <CoffeeCup ref={cupRef} />
            <mesh
              onPointerDown={(e) => handlePointerDownWrapper(e, 'cup')}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
            >
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} />
            </mesh>
          </group>

          <group ref={laptopAnchorRef} position={[-0.26, 0.44, 0.08]}>
            <Laptop ref={laptopRef} />
            <mesh
              onPointerDown={(e) => handlePointerDownWrapper(e, 'laptop')}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
            >
              <boxGeometry args={[0.16, 0.12, 0.14]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} />
            </mesh>
          </group>
        </group>
      </group>
    )
  },
)
