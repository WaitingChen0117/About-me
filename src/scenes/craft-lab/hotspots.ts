import type { HotspotDef } from '../types'

/**
 * Craft Lab room-scale layout (semi-open workshop).
 * Back wall ≈ z=-4.2 · left wall ≈ x=-5.2 · right bay open with columns.
 */
export const craftLabHotspots: HotspotDef[] = [
  {
    id: 'about',
    label: '工作证墙',
    hint: '身份与定位',
    x: 48,
    y: 18,
    position: [-0.2, 0, -3.55],
    labelY: 2.0,
    view: {
      target: [-0.15, 1.15, -3.4],
      radius: 3.55,
      theta: 0.1,
      phi: 0.95,
    },
  },
  {
    id: 'experience',
    label: '胶带时间线',
    hint: '脱敏经历',
    x: 14,
    y: 34,
    position: [-4.15, 0, -2.25],
    labelY: 1.45,
    view: {
      target: [-3.95, 0.9, -2.1],
      radius: 3.3,
      theta: -0.92,
      phi: 0.98,
    },
  },
  {
    id: 'works',
    label: '主时间轴台',
    hint: '作品精选',
    x: 50,
    y: 48,
    position: [0.25, 0, -0.25],
    labelY: 1.1,
    view: {
      target: [0.25, 0.7, -0.2],
      radius: 3.15,
      theta: 0.28,
      phi: 1.04,
    },
  },
  {
    id: 'projects',
    label: '样机灯箱',
    hint: '系统项目',
    x: 86,
    y: 36,
    position: [4.15, 0, -1.55],
    labelY: 1.35,
    view: {
      target: [3.95, 0.8, -1.45],
      radius: 3.3,
      theta: 1.0,
      phi: 0.98,
    },
  },
  {
    id: 'articles',
    label: '笔记夹层',
    hint: '文章入口',
    x: 12,
    y: 60,
    position: [-4.25, 0, 0.85],
    labelY: 1.2,
    view: {
      target: [-4.05, 0.7, 0.85],
      radius: 3.2,
      theta: -1.08,
      phi: 1.04,
    },
  },
  {
    id: 'hobbies',
    label: '搁架收藏',
    hint: '爱好侧面',
    x: 26,
    y: 78,
    position: [-2.85, 0, 2.95],
    labelY: 1.25,
    view: {
      target: [-2.7, 0.7, 2.8],
      radius: 3.15,
      theta: -0.38,
      phi: 1.08,
    },
  },
  {
    id: 'contact',
    label: '门口信箱',
    hint: '公开联系',
    x: 80,
    y: 78,
    position: [3.85, 0, 2.85],
    labelY: 1.1,
    view: {
      target: [3.65, 0.65, 2.7],
      radius: 3.2,
      theta: 0.7,
      phi: 1.05,
    },
  },
]

/** Desk secondary monitor / assist arm → AI twin (not a section panel). */
export const ASSIST_MONITOR_POSITION: [number, number, number] = [1.85, 0, 1.35]

export const OPERATOR_HOME: [number, number, number] = [-0.25, 0, 0.95]

export const CRAFT_HOME_VIEW = {
  target: [0.15, 0.85, -0.35] as [number, number, number],
  radius: 11.4,
  theta: 0.4,
  phi: 1.06,
}

export const CRAFT_HOME_VIEW_NARROW = {
  target: [0.15, 0.9, -0.25] as [number, number, number],
  radius: 13.0,
  theta: 0.44,
  phi: 1.1,
}
