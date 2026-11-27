import { useRef } from 'react'
import type { ThemeMode } from '../types'
import { Operator3D } from '../ops-deck/Operator3D'

type FigureInBoxProps = {
  onPointerDown: (e: any) => void
  theme: ThemeMode
}

export function FigureInBox({ onPointerDown }: FigureInBoxProps) {
  const introRef = useRef(1)
  
  // Intercept pointer events to prevent studio tooltips while allowing drag
  const handlePointerOver = (e: any) => {
    e.stopPropagation()
    document.body.style.cursor = 'grab'
  }
  
  const handlePointerOut = (e: any) => {
    e.stopPropagation()
    document.body.style.cursor = 'auto'
  }
  
  const handlePointerDownWrapper = (e: any) => {
    e.stopPropagation()
    document.body.style.cursor = 'grabbing'
    onPointerDown(e)
  }
  
  return (
    <group position={[0, -1.05, 0]} scale={0.85}>
      {/* Hit box to intercept events and enable figure dragging */}
      <mesh
        onPointerDown={handlePointerDownWrapper}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerMove={(e) => e.stopPropagation()}
      >
        <boxGeometry args={[1.2, 2.5, 1.2]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {/* Operator3D - its own hover/click events are blocked by hit box above */}
      <Operator3D
        hotspots={[]}
        target={null}
        ticket={0}
        onArrive={() => {}}
        onTap={() => {}}
        palette={{ accent: '#5a7fa5', accentAlt: '#3d5571' } as any}
        introRef={introRef}
        home={[0, 0, 0]}
      />
    </group>
  )
}
