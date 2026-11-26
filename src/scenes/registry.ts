import { lazy } from 'react'
import { craftLabHotspots } from './craft-lab/hotspots'
import { opsDeckHotspots } from './ops-deck/hotspots'
import { skylineHotspots } from './skyline-terminal/hotspots'
import type { SceneId, SceneModule } from './types'

const OpsDeckScene = lazy(async () => {
  const mod = await import('./ops-deck/OpsDeckScene')
  return { default: mod.OpsDeckScene }
})

const CraftLabScene = lazy(async () => {
  const mod = await import('./craft-lab/CraftLabScene')
  return { default: mod.CraftLabScene }
})

const SkylineTerminalScene = lazy(async () => {
  const mod = await import('./skyline-terminal/SkylineTerminalScene')
  return { default: mod.SkylineTerminalScene }
})

/**
 * Scene registry — A (ops-deck) + B (craft-lab) + C (skyline-terminal).
 * Scene id stays `ops-deck` for routing stability; UX copy says 工作室.
 */
export const scenes: SceneModule[] = [
  {
    id: 'ops-deck',
    label: '程序员工作室',
    description: '程序员个人工作室：显示器、书架与桌面道具映射各内容板块；日暖夜冷。',
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
  {
    id: 'skyline-terminal',
    label: '城市夜景终端',
    description: '高处落地窗前的个人终端：窗外城市网格，窗内控制台与信息流隐喻。',
    Component: SkylineTerminalScene,
    hotspots: skylineHotspots,
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

/** Known scene ids — keep for routing / future packs. */
export const reservedSceneIds: SceneId[] = [
  'ops-deck',
  'craft-lab',
  'skyline-terminal',
]

export const switchableScenes: SceneModule[] = scenes
