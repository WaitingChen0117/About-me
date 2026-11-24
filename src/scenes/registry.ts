import { lazy } from 'react'
import { craftLabHotspots } from './craft-lab/hotspots'
import { opsDeckHotspots } from './ops-deck/hotspots'
import type { SceneId, SceneModule } from './types'

const OpsDeckScene = lazy(async () => {
  const mod = await import('./ops-deck/OpsDeckScene')
  return { default: mod.OpsDeckScene }
})

const CraftLabScene = lazy(async () => {
  const mod = await import('./craft-lab/CraftLabScene')
  return { default: mod.CraftLabScene }
})

/**
 * Scene registry — A (ops-deck) + B (craft-lab).
 * skyline-terminal remains reserved for a later pack.
 */
export const scenes: SceneModule[] = [
  {
    id: 'ops-deck',
    label: 'Agent 指挥台',
    description: 'Agent 指挥台：会话、工具、审批与 Trace 的空间化控制台。',
    Component: OpsDeckScene,
    hotspots: opsDeckHotspots,
  },
  {
    id: 'craft-lab',
    label: '交互产品工坊',
    description: '交互产品工坊：时间轴、画布与样机同场，强调产品界面交付力。',
    Component: CraftLabScene,
    hotspots: craftLabHotspots,
  },
]

export const defaultSceneId: SceneId = 'ops-deck'

export function getScene(id: SceneId): SceneModule {
  const found = scenes.find((s) => s.id === id)
  if (!found) {
    return scenes[0]
  }
  return found
}

/** Reserved scene ids — do not delete. */
export const reservedSceneIds: SceneId[] = [
  'ops-deck',
  'craft-lab',
  'skyline-terminal',
]

export const switchableScenes: SceneModule[] = scenes.filter(
  (s) => s.id === 'ops-deck' || s.id === 'craft-lab',
)
