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
    labelY: 1.95,
    view: {
      target: [0, 0.95, -1.75],
      radius: 3.35,
      theta: 0.18,
      phi: 0.98,
    },
  },
  {
    id: 'experience',
    label: '时间轴',
    hint: '脱敏经历',
    x: 18,
    y: 42,
    position: [-2.65, 0, -0.85],
    labelY: 0.85,
    view: {
      target: [-2.55, 0.55, -0.85],
      radius: 3.1,
      theta: -0.72,
      phi: 1.02,
    },
  },
  {
    id: 'works',
    label: '预览监视器',
    hint: '作品精选',
    x: 78,
    y: 36,
    position: [2.45, 0, -1.25],
    labelY: 1.15,
    view: {
      target: [2.35, 0.65, -1.2],
      radius: 3.15,
      theta: 0.78,
      phi: 1.0,
    },
  },
  {
    id: 'projects',
    label: '节点机架',
    hint: '系统项目',
    x: 86,
    y: 62,
    position: [3.25, 0, 0.95],
    labelY: 1.85,
    view: {
      target: [3.1, 0.9, 0.9],
      radius: 3.25,
      theta: 1.05,
      phi: 0.95,
    },
  },
  {
    id: 'articles',
    label: '资料抽屉',
    hint: '文章入口',
    x: 14,
    y: 68,
    position: [-3.05, 0, 0.85],
    labelY: 1.0,
    view: {
      target: [-2.9, 0.55, 0.85],
      radius: 3.05,
      theta: -0.95,
      phi: 1.05,
    },
  },
  {
    id: 'hobbies',
    label: '侧柜小物',
    hint: '爱好侧面',
    x: 28,
    y: 78,
    position: [-1.95, 0, 2.05],
    labelY: 0.9,
    view: {
      target: [-1.85, 0.5, 1.95],
      radius: 3.0,
      theta: -0.35,
      phi: 1.08,
    },
  },
  {
    id: 'contact',
    label: '信标天线',
    hint: '公开联系',
    x: 70,
    y: 78,
    position: [2.15, 0, 2.05],
    labelY: 1.7,
    view: {
      target: [2.05, 0.85, 1.95],
      radius: 3.1,
      theta: 0.55,
      phi: 1.02,
    },
  },
]

export const AVATAR_POD_POSITION: [number, number, number] = [0, 0, 1.35]
export const OPERATOR_HOME: [number, number, number] = [0.15, 0, 0.35]

/** Desktop HOME framing for Ops Deck. */
export const OPS_HOME_VIEW = {
  target: [0, 0.55, 0] as [number, number, number],
  radius: 9.34,
  theta: 0.353,
  phi: 1.055,
}

export const OPS_HOME_VIEW_NARROW = {
  target: [0, 0.55, 0] as [number, number, number],
  radius: 10.85,
  theta: 0.385,
  phi: 1.08,
}
