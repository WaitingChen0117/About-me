import { lazy } from 'react'
import { opsDeckHotspots } from './ops-deck/hotspots'
import type { SceneId, SceneModule } from './types'

const OpsDeckScene = lazy(async () => {
  const mod = await import('./ops-deck/OpsDeckScene')
  return { default: mod.OpsDeckScene }
})

/**
 * Scene registry — P0 only ships ops-deck.
 * craft-lab / skyline-terminal are reserved ids for P1+.
 */
export const scenes: SceneModule[] = [
  {
    id: 'ops-deck',
    label: 'Agent 指挥台',
    description: '运行中的 Agent 指挥室：会话、工具、审批、Trace 的空间隐喻。',
    Component: OpsDeckScene,
    hotspots: opsDeckHotspots,
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

/** Reserved for future scene packs — do not delete. */
export const reservedSceneIds: SceneId[] = [
  'ops-deck',
  'craft-lab',
  'skyline-terminal',
]
