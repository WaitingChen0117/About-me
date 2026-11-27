import { forwardRef, useRef, useState } from 'react'
import type { ThemeMode } from '../types'
import { Operator3D } from '../ops-deck/Operator3D'
import * as THREE from 'three'
import { CoffeeCup, Laptop } from './CollectorProps'
import { CoffeeSpill } from './CoffeeSpill'

type DragPart = 'body' | 'head' | 'foot-left' | 'foot-right' | 'cup' | 'laptop' | null

type FigureInBoxProps = {
  onPointerDown: (e: any, part: DragPart) => void
  theme: ThemeMode
}

export const FigureInBox = forwardRef<THREE.Group, FigureInBoxProps>(
  ({ onPointerDown }, ref) => {
    const introRef = useRef(1)
    const cupRef = useRef<THREE.Group>(null)
    const laptopRef = useRef<THREE.Group>(null)
    const [spillVelocity, setSpillVelocity] = useState<THREE.Vector3 | null>(null)
    const [spillActive, setSpillActive] = useState(false)
    
    // Intercept pointer events to prevent studio tooltips while allowing drag
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
      <group ref={ref} position={[0, -1.05, 0]} scale={0.85} userData={{ restY: -1.05 }}>
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
        
        {/* Head hit box */}
        <mesh
          position={[0, 0.95, 0]}
          onPointerDown={(e) => handlePointerDownWrapper(e, 'head')}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        
        {/* Operator3D in collector mode: no studio UI (hover labels, tooltips) */}
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
        
        {/* Coffee cup in right hand */}
        <CoffeeCup
          ref={cupRef}
          position={[0.25, 0.5, 0.15]}
        />
        <mesh
          position={[0.25, 0.5, 0.15]}
          onPointerDown={(e) => handlePointerDownWrapper(e, 'cup')}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        
        {/* Laptop in left hand */}
        <Laptop
          ref={laptopRef}
          position={[-0.25, 0.4, 0.1]}
          rotation={[-0.3, 0.2, 0]}
        />
        <mesh
          position={[-0.25, 0.4, 0.1]}
          onPointerDown={(e) => handlePointerDownWrapper(e, 'laptop')}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <boxGeometry args={[0.15, 0.1, 0.12]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        
        {/* Coffee spill effect */}
        {spillActive && cupRef.current && (
          <CoffeeSpill
            cupPosition={new THREE.Vector3().setFromMatrixPosition(cupRef.current.matrixWorld)}
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
