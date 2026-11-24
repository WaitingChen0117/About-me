import type { HotspotDef } from '../types'

/**
 * Ops Deck room-scale layout (command room floor units).
 * Back wall ≈ z=-4.2 · left wall ≈ x=-5.2 · open front toward camera.
 */
export const opsDeckHotspots: HotspotDef[] = [
  {
    id: 'about',
    label: '主控屏',
    hint: '身份与定位',
    x: 50,
    y: 22,
    position: [0, 0, -3.55],
    labelY: 2.15,
    view: {
      target: [0, 1.15, -3.45],
      radius: 3.55,
      theta: 0.14,
      phi: 0.96,
    },
  },
  {
    id: 'experience',
    label: '时间轴',
    hint: '脱敏经历',
    x: 14,
    y: 36,
    position: [-4.05, 0, -1.85],
    labelY: 0.95,
    view: {
      target: [-3.9, 0.6, -1.75],
      radius: 3.25,
      theta: -0.88,
      phi: 1.02,
    },
  },
  {
    id: 'works',
    label: '预览监视器',
    hint: '作品精选',
    x: 78,
    y: 30,
    position: [3.55, 0, -2.65],
    labelY: 1.25,
    view: {
      target: [3.4, 0.7, -2.55],
      radius: 3.3,
      theta: 0.82,
      phi: 0.98,
    },
  },
  {
    id: 'projects',
    label: '节点机架',
    hint: '系统项目',
    x: 88,
    y: 54,
    position: [4.35, 0, 0.35],
    labelY: 1.95,
    view: {
      target: [4.15, 0.95, 0.3],
      radius: 3.35,
      theta: 1.12,
      phi: 0.94,
    },
  },
  {
    id: 'articles',
    label: '资料抽屉',
    hint: '文章入口',
    x: 12,
    y: 58,
    position: [-4.25, 0, 0.55],
    labelY: 1.05,
    view: {
      target: [-4.05, 0.55, 0.55],
      radius: 3.15,
      theta: -1.05,
      phi: 1.05,
    },
  },
  {
    id: 'hobbies',
    label: '侧柜小物',
    hint: '爱好侧面',
    x: 24,
    y: 78,
    position: [-2.75, 0, 2.85],
    labelY: 0.95,
    view: {
      target: [-2.6, 0.5, 2.7],
      radius: 3.15,
      theta: -0.42,
      phi: 1.08,
    },
  },
  {
    id: 'contact',
    label: '信标天线',
    hint: '公开联系',
    x: 74,
    y: 78,
    position: [3.15, 0, 2.95],
    labelY: 1.8,
    view: {
      target: [3.0, 0.9, 2.8],
      radius: 3.2,
      theta: 0.58,
      phi: 1.02,
    },
  },
]

export const AVATAR_POD_POSITION: [number, number, number] = [0.35, 0, 1.55]
export const OPERATOR_HOME: [number, number, number] = [0.1, 0, 0.55]

/** Desktop HOME framing for room-scale Ops Deck. */
export const OPS_HOME_VIEW = {
  target: [0, 0.9, -0.55] as [number, number, number],
  radius: 11.6,
  theta: 0.42,
  phi: 1.04,
}

export const OPS_HOME_VIEW_NARROW = {
  target: [0, 0.95, -0.45] as [number, number, number],
  radius: 13.2,
  theta: 0.46,
  phi: 1.08,
}
