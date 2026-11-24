import { Html } from '@react-three/drei'
import type { RefObject } from 'react'
import type { SectionId } from '../../content/sections'
import type { HotspotDef } from '../types'
import './WorldLabels.css'

type Props = {
  hotspots: HotspotDef[]
  sectionTitles: Record<SectionId, string>
  hoveredId: SectionId | null
  onHover: (id: SectionId | null) => void
  onSelect: (id: SectionId) => void
  /** Panel open — hide + disable pointer */
  away: boolean
  /** Scene-local portal — avoids removeChild races vs document.body on scene swap */
  portal: RefObject<HTMLElement | null>
}

/**
 * Cold-gray HUD nameplates via drei Html (DOM portal outside the R3F reconciler).
 * Outer node only translates via Html; scale lives on the inner span.
 */
export function WorldLabels({
  hotspots,
  sectionTitles,
  hoveredId,
  onHover,
  onSelect,
  away,
  portal,
}: Props) {
  // Fully unmount while panel open — no hit targets, no residual HUD
  if (away) return null

  return (
    <group>
      {hotspots.map((h) => {
        const hot = hoveredId === h.id
        const y = h.labelY ?? 1.05
        return (
          <Html
            key={h.id}
            position={[h.position[0], y, h.position[2]]}
            center
            distanceFactor={10}
            zIndexRange={[8, 0]}
            portal={portal as RefObject<HTMLElement>}
            wrapperClass="world-label-html-wrap"
          >
            <button
              type="button"
              className={`world-label${hot ? ' is-hot' : ''}`}
              tabIndex={0}
              aria-label={`${h.label} · ${sectionTitles[h.id]}`}
              onMouseEnter={() => onHover(h.id)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(h.id)}
              onBlur={() => onHover(null)}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onSelect(h.id)
              }}
            >
              <span className="world-label-inner">
                <span className="world-label-name">{h.label}</span>
                <span className="world-label-hint">{h.hint || sectionTitles[h.id]}</span>
              </span>
            </button>
          </Html>
        )
      })}
    </group>
  )
}
