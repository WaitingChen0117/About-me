import { forwardRef, useRef, useState, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import type { ThemeMode } from '../types'
import { Operator3D } from '../ops-deck/Operator3D'
import * as THREE from 'three'
import { CoffeeCup, Laptop } from './CollectorProps'
import { CoffeeSpill } from './CoffeeSpill'

export type DragPart = 'body' | 'head' | 'foot-left' | 'foot-right' | 'cup' | 'laptop' | null

type FigureInBoxProps = {
  onPointerDown: (e: any, part: DragPart) => void
  theme: ThemeMode
}

export type FigureInBoxHandle = {
  applyPartMotion: (part: DragPart, delta: { x: number; y: number }) => void
  resetPartMotion: (part: DragPart) => void
  getCupWorldPosition: () => THREE.Vector3
  triggerSpill: (velocity: THREE.Vector3) => void
}

export const FigureInBox = forwardRef<FigureInBoxHandle, FigureInBoxProps>(
  ({ onPointerDown }, ref) => {
    const introRef = useRef(1)
    const operatorGroupRef = useRef<THREE.Group>(null)
    const cupRef = useRef<THREE.Group>(null)
    const laptopRef = useRef<THREE.Group>(null)
    const headPivotRef = useRef<THREE.Group>(null)
    
    // Part motion state
    const [headTilt, setHeadTilt] = useState({ x: 0, y: 0 })
    const [leftArmRaise, setLeftArmRaise] = useState(0)
    const [rightArmRaise, setRightArmRaise] = useState(0)
    const [bodyLean, setBodyLean] = useState({ x: 0, z: 0 })
    
    // Coffee spill state
    const [spillVelocity, setSpillVelocity] = useState<THREE.Vector3 | null>(null)
    const [spillActive, setSpillActive] = useState(false)
    
    // Last cup position for velocity calculation
    const lastCupPos = useRef<THREE.Vector3>(new THREE.Vector3())
    const cupVelocity = useRef<THREE.Vector3>(new THREE.Vector3())
    
    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      applyPartMotion(part: DragPart, delta: { x: number; y: number }) {
        const sensitivity = 0.8
        
        switch (part) {
          case 'head':
            // Head tilts left/right and up/down
            setHeadTilt(prev => ({
              x: THREE.MathUtils.clamp(prev.x + delta.y * sensitivity, -0.4, 0.4),
              y: THREE.MathUtils.clamp(prev.y + delta.x * sensitivity, -0.5, 0.5),
            }))
            break
            
          case 'cup':
            // Right arm raises when cup is pulled up
            setRightArmRaise(prev => 
              THREE.MathUtils.clamp(prev - delta.y * sensitivity * 2, -0.3, 1.2)
            )
            break
            
          case 'laptop':
            // Left arm raises when laptop is pulled up
            setLeftArmRaise(prev =>
              THREE.MathUtils.clamp(prev - delta.y * sensitivity * 2, -0.3, 1.2)
            )
            break
            
          case 'foot-left':
          case 'foot-right':
            // Body leans when foot is lifted
            setBodyLean(prev => ({
              x: THREE.MathUtils.clamp(prev.x + delta.x * 0.3, -0.2, 0.2),
              z: THREE.MathUtils.clamp(prev.z - delta.y * 0.3, -0.2, 0.2),
            }))
            break
        }
      },
      
      resetPartMotion(part: DragPart) {
        // Spring back to rest pose
        switch (part) {
          case 'head':
            setHeadTilt({ x: 0, y: 0 })
            break
          case 'cup':
            setRightArmRaise(0)
            break
          case 'laptop':
            setLeftArmRaise(0)
            break
          case 'foot-left':
          case 'foot-right':
            setBodyLean({ x: 0, z: 0 })
            break
        }
      },
      
      getCupWorldPosition() {
        if (cupRef.current) {
          const pos = new THREE.Vector3()
          cupRef.current.getWorldPosition(pos)
          return pos
        }
        return new THREE.Vector3()
      },
      
      triggerSpill(velocity: THREE.Vector3) {
        setSpillVelocity(velocity.clone())
        setSpillActive(true)
      },
    }))
    
    // Track cup velocity for spill detection
    useFrame(() => {
      if (cupRef.current) {
        const currentPos = new THREE.Vector3()
        cupRef.current.getWorldPosition(currentPos)
        
        cupVelocity.current.copy(currentPos).sub(lastCupPos.current).multiplyScalar(60)
        lastCupPos.current.copy(currentPos)
      }
      
      // Spring damping for smooth return to rest
      if (Math.abs(headTilt.x) > 0.01 || Math.abs(headTilt.y) > 0.01) {
        setHeadTilt(prev => ({
          x: prev.x * 0.95,
          y: prev.y * 0.95,
        }))
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
        {/* Body lean pivot - affects whole figure slightly when foot is dragged */}
        <group rotation={[bodyLean.z, 0, bodyLean.x]}>
          
          {/* Body hit box for torso drag */}
          <mesh
            position={[0, 0.4, 0]}
            onPointerDown={(e) => handlePointerDownWrapper(e, 'body')}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onPointerMove={(e) => e.stopPropagation()}
          >
            <boxGeometry args={[0.4, 0.6, 0.3]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
          
          {/* Head pivot group */}
          <group ref={headPivotRef} position={[0, 1.05, 0]} rotation={[headTilt.x, headTilt.y, 0]}>
            {/* Head hit box */}
            <mesh
              position={[0, -0.1, 0]}
              onPointerDown={(e) => handlePointerDownWrapper(e, 'head')}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
            >
              <sphereGeometry args={[0.25, 16, 16]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>
          </group>
          
          {/* Foot hit boxes */}
          <mesh
            position={[-0.12, 0.08, 0]}
            onPointerDown={(e) => handlePointerDownWrapper(e, 'foot-left')}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            <boxGeometry args={[0.15, 0.1, 0.22]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
          
          <mesh
            position={[0.12, 0.08, 0]}
            onPointerDown={(e) => handlePointerDownWrapper(e, 'foot-right')}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            <boxGeometry args={[0.15, 0.1, 0.22]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
          
          {/* Operator3D - actual visible character */}
          <group ref={operatorGroupRef}>
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
            />
          </group>
          
          {/* Coffee cup in right hand with arm follow */}
          <group position={[0.25, 0.5 + rightArmRaise * 0.15, 0.15]}>
            <CoffeeCup ref={cupRef} />
            <mesh
              onPointerDown={(e) => handlePointerDownWrapper(e, 'cup')}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
            >
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>
          </group>
          
          {/* Laptop in left hand with arm follow */}
          <group position={[-0.25, 0.4 + leftArmRaise * 0.15, 0.1]}>
            <Laptop
              ref={laptopRef}
              rotation={[-0.3 + leftArmRaise * 0.2, 0.2, 0]}
            />
            <mesh
              onPointerDown={(e) => handlePointerDownWrapper(e, 'laptop')}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
            >
              <boxGeometry args={[0.15, 0.1, 0.12]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>
          </group>
        </group>
        
        {/* Coffee spill effect */}
        {spillActive && cupRef.current && (
          <CoffeeSpill
            cupPosition={lastCupPos.current}
            spillVelocity={spillVelocity}
            onSpillComplete={() => {
              setSpillActive(false)
              setSpillVelocity(null)
            }}
          />
        )}
      </group>
    )
  },
)
