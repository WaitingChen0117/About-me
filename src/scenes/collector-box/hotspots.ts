import type { HotspotDef } from '../types'

export const collectorBoxHotspots: HotspotDef[] = [
  {
    id: 'about',
    label: 'ABOUT',
    hint: '关于我',
    x: 50,
    y: 50,
    position: [0, 0, 0],
  },
  {
    id: 'works',
    label: 'WORKS',
    hint: '作品集',
    x: 30,
    y: 50,
    position: [-2, 0, 0],
  },
  {
    id: 'projects',
    label: 'COLLECTION',
    hint: '作品收藏',
    x: 70,
    y: 50,
    position: [2, 0, 0],
  },
]
