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
  },
  {
    id: 'experience',
    label: '胶带时间线',
    hint: '脱敏经历',
    x: 16,
    y: 38,
    position: [-3.05, 0, -1.55],
  },
  {
    id: 'works',
    label: '主时间轴台',
    hint: '作品精选',
    x: 52,
    y: 48,
    position: [0.35, 0, -0.15],
  },
  {
    id: 'projects',
    label: '样机灯箱',
    hint: '系统项目',
    x: 86,
    y: 40,
    position: [3.15, 0, -1.05],
  },
  {
    id: 'articles',
    label: '笔记夹层',
    hint: '文章入口',
    x: 14,
    y: 66,
    position: [-3.2, 0, 0.75],
  },
  {
    id: 'hobbies',
    label: '搁架收藏',
    hint: '爱好侧面',
    x: 28,
    y: 78,
    position: [-2.15, 0, 2.15],
  },
  {
    id: 'contact',
    label: '门口信箱',
    hint: '公开联系',
    x: 78,
    y: 78,
    position: [2.85, 0, 2.05],
  },
]

/** Desk secondary monitor / assist arm → AI twin (not a section panel). */
export const ASSIST_MONITOR_POSITION: [number, number, number] = [1.55, 0, 1.15]

export const OPERATOR_HOME: [number, number, number] = [-0.35, 0, 0.85]
