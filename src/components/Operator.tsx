import { useEffect, useRef, useState } from 'react'
import type { SectionId } from '../content/sections'
import type { HotspotDef } from '../scenes/types'
import './Operator.css'

type Props = {
  hotspots: HotspotDef[]
  target: SectionId | null
  ticket: number
  onArrive: (id: SectionId) => void
  onTap: () => void
}

const HOME = { x: 50, y: 58 }

export function Operator({ hotspots, target, ticket, onArrive, onTap }: Props) {
  const [pos, setPos] = useState(HOME)
  const [walking, setWalking] = useState(false)
  const arriveRef = useRef(onArrive)
  arriveRef.current = onArrive

  useEffect(() => {
    if (!target || ticket === 0) {
      return
    }

    const spot = hotspots.find((h) => h.id === target)
    if (!spot) return

    setWalking(true)
    setPos({ x: spot.x, y: spot.y })
    const t = window.setTimeout(() => {
      setWalking(false)
      arriveRef.current(target)
    }, 950)
    return () => window.clearTimeout(t)
  }, [target, ticket, hotspots])

  return (
    <button
      type="button"
      className={`operator${walking ? ' is-walking' : ''}`}
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      aria-label="场景操作员小人，点击可随机走到一个板块"
      onClick={onTap}
    >
      <span className="operator-tip">点我逛逛</span>
      <span className="operator-body" aria-hidden="true">
        <span className="operator-head" />
        <span className="operator-torso" />
        <span className="operator-leg-l" />
        <span className="operator-leg-r" />
      </span>
    </button>
  )
}
