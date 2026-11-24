import type { HotspotDef } from '../types'

/**
 * Craft Lab object metaphors → shared section ids.
 * Layout: back wall tools + center timeline desk + side racks.
 */
export const craftLabHotspots: HotspotDef[] = [
  {
    id: 'about',
    label: '工作证墙',
    hint: '身份与定位',
    x: 48,
    y: 22,
    position: [-0.15, 0, -2.35],
    labelY: 1.85,
    view: {
      target: [-0.1, 1.05, -2.25],
      radius: 3.4,
      theta: 0.12,
      phi: 0.96,
    },
  },
  {
    id: 'experience',
    label: '胶带时间线',
    hint: '脱敏经历',
    x: 16,
    y: 38,
    position: [-3.05, 0, -1.55],
    labelY: 1.35,
    view: {
      target: [-2.9, 0.85, -1.45],
      radius: 3.2,
      theta: -0.85,
      phi: 1.0,
    },
  },
  {
    id: 'works',
    label: '主时间轴台',
    hint: '作品精选',
    x: 52,
    y: 48,
    position: [0.35, 0, -0.15],
    labelY: 1.05,
    view: {
      target: [0.35, 0.65, -0.1],
      radius: 3.0,
      theta: 0.32,
      phi: 1.05,
    },
  },
  {
    id: 'projects',
    label: '样机灯箱',
    hint: '系统项目',
    x: 86,
    y: 40,
    position: [3.15, 0, -1.05],
    labelY: 1.25,
    view: {
      target: [3.0, 0.75, -1.0],
      radius: 3.2,
      theta: 0.95,
      phi: 1.0,
    },
  },
  {
    id: 'articles',
    label: '笔记夹层',
    hint: '文章入口',
    x: 14,
    y: 66,
    position: [-3.2, 0, 0.75],
    labelY: 1.15,
    view: {
      target: [-3.0, 0.7, 0.75],
      radius: 3.1,
      theta: -1.0,
      phi: 1.05,
    },
  },
  {
    id: 'hobbies',
    label: '搁架收藏',
    hint: '爱好侧面',
    x: 28,
    y: 78,
    position: [-2.15, 0, 2.15],
    labelY: 1.2,
    view: {
      target: [-2.0, 0.7, 2.0],
      radius: 3.05,
      theta: -0.4,
      phi: 1.08,
    },
  },
  {
    id: 'contact',
    label: '门口信箱',
    hint: '公开联系',
    x: 78,
    y: 78,
    position: [2.85, 0, 2.05],
    labelY: 1.05,
    view: {
      target: [2.7, 0.6, 1.95],
      radius: 3.1,
      theta: 0.65,
      phi: 1.05,
    },
  },
]

/** Desk secondary monitor / assist arm → AI twin (not a section panel). */
export const ASSIST_MONITOR_POSITION: [number, number, number] = [1.55, 0, 1.15]

export const OPERATOR_HOME: [number, number, number] = [-0.35, 0, 0.85]

export const CRAFT_HOME_VIEW = {
  target: [0.1, 0.7, -0.2] as [number, number, number],
  radius: 9.2,
  theta: 0.365,
  phi: 1.085,
}

export const CRAFT_HOME_VIEW_NARROW = {
  target: [0.1, 0.7, -0.2] as [number, number, number],
  radius: 10.6,
  theta: 0.4,
  phi: 1.1,
}
