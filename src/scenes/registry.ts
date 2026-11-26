import { lazy } from 'react'
import { collectorBoxHotspots } from './collector-box/hotspots'
import { craftLabHotspots } from './craft-lab/hotspots'
import { opsDeckHotspots } from './ops-deck/hotspots'
import { skylineHotspots } from './skyline-terminal/hotspots'
import type { SceneId, SceneModule } from './types'

const CollectorBoxScene = lazy(async () => {
  const mod = await import('./collector-box/CollectorBoxScene')
  return { default: mod.CollectorBoxScene }
})

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
 * Scene registry — Collector Box (entry) + A (ops-deck) + B (craft-lab) + C (skyline-terminal).
 */
export const scenes: SceneModule[] = [
  {
    id: 'collector-box',
    label: '收藏盒',
    description: '盲盒收藏体验：旋转盒子查看不同面，背面展示作品集，可进入工作室探索。',
    Component: CollectorBoxScene,
    hotspots: collectorBoxHotspots,
  },
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

export const defaultSceneId: SceneId = 'collector-box'

export function getScene(id: SceneId): SceneModule {
  const found = scenes.find((s) => s.id === id)
  if (!found) {
    return scenes[0]
  }
  return found
}

/** Known scene ids — keep for routing / future packs. */
export const reservedSceneIds: SceneId[] = [
  'collector-box',
  'ops-deck',
  'craft-lab',
  'skyline-terminal',
]

export const switchableScenes: SceneModule[] = scenes
