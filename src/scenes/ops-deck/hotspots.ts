import type { HotspotDef } from '../types'

/** Object metaphors for Ops Deck → shared section ids (world units on the desk floor). */
export const opsDeckHotspots: HotspotDef[] = [
  {
    id: 'about',
    label: '主控屏',
    hint: '身份与定位',
    x: 50,
    y: 28,
    position: [0, 0, -1.75],
  },
  {
    id: 'experience',
    label: '时间轴',
    hint: '脱敏经历',
    x: 18,
    y: 42,
    position: [-2.65, 0, -0.85],
  },
  {
    id: 'works',
    label: '预览监视器',
    hint: '作品精选',
    x: 78,
    y: 36,
    position: [2.45, 0, -1.25],
  },
  {
    id: 'projects',
    label: '节点机架',
    hint: '系统项目',
    x: 86,
    y: 62,
    position: [3.25, 0, 0.95],
  },
  {
    id: 'articles',
    label: '资料抽屉',
    hint: '文章入口',
    x: 14,
    y: 68,
    position: [-3.05, 0, 0.85],
  },
  {
    id: 'hobbies',
    label: '侧柜小物',
    hint: '爱好侧面',
    x: 28,
    y: 78,
    position: [-1.95, 0, 2.05],
  },
  {
    id: 'contact',
    label: '信标天线',
    hint: '公开联系',
    x: 70,
    y: 78,
    position: [2.15, 0, 2.05],
  },
]

export const AVATAR_POD_POSITION: [number, number, number] = [0, 0, 1.35]
export const OPERATOR_HOME: [number, number, number] = [0.15, 0, 0.35]
