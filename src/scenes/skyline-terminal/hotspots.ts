import type { HotspotDef } from '../types'

/**
 * Skyline Terminal — high-rise lounge with floor-to-ceiling city window.
 * Window plane ≈ z=-4.2 · left wall ≈ x=-5.2 · right wall ≈ x=5.2.
 * Focus radii keep room props readable behind the panel (A/B polish).
 */
export const skylineHotspots: HotspotDef[] = [
  {
    id: 'about',
    label: '窗前身份卡',
    hint: '身份与定位',
    x: 28,
    y: 22,
    position: [-2.35, 0, -3.45],
    labelY: 1.55,
    view: {
      target: [-2.0, 1.1, -3.1],
      radius: 4.6,
      theta: -0.28,
      phi: 1.04,
    },
  },
  {
    id: 'experience',
    label: '窗台灯带',
    hint: '脱敏经历',
    x: 48,
    y: 18,
    position: [0.15, 0, -3.7],
    labelY: 1.15,
    view: {
      target: [0.15, 0.85, -3.2],
      radius: 4.4,
      theta: 0.12,
      phi: 1.05,
    },
  },
  {
    id: 'works',
    label: '投影幕',
    hint: '作品精选',
    x: 84,
    y: 36,
    position: [4.15, 0, -1.65],
    labelY: 1.55,
    // Pull back so the dark screen doesn't fill the frame; keep bay context.
    view: {
      target: [3.2, 1.15, -1.35],
      radius: 5.2,
      theta: 0.72,
      phi: 1.05,
    },
  },
  {
    id: 'projects',
    label: '城市节点',
    hint: '系统项目',
    x: 66,
    y: 28,
    position: [2.15, 0, -3.25],
    // Stand in front of the console bay, not on the sill ledge.
    standPosition: [1.85, 0, -1.85],
    labelY: 1.35,
    view: {
      target: [1.9, 1.0, -2.9],
      radius: 4.3,
      theta: 0.48,
      phi: 1.04,
    },
  },
  {
    id: 'articles',
    label: '书架终端',
    hint: '文章入口',
    x: 12,
    y: 52,
    position: [-4.2, 0, 0.55],
    labelY: 1.45,
    view: {
      target: [-3.55, 1.15, 0.7],
      radius: 5.5,
      theta: -0.55,
      phi: 1.06,
    },
  },
  {
    id: 'hobbies',
    label: '窗台小物',
    hint: '爱好侧面',
    x: 22,
    y: 78,
    position: [-3.05, 0, 2.75],
    labelY: 1.15,
    view: {
      target: [-2.85, 0.75, 2.55],
      radius: 3.6,
      theta: -0.38,
      phi: 1.08,
    },
  },
  {
    id: 'contact',
    label: '对讲面板',
    hint: '公开联系',
    x: 82,
    y: 78,
    position: [3.85, 0, 2.85],
    labelY: 1.25,
    view: {
      target: [3.55, 0.8, 2.65],
      radius: 3.6,
      theta: 0.7,
      phi: 1.06,
    },
  },
]

/** Floating dialogue orb → AI twin (not a section panel). */
export const DIALOGUE_ORB_POSITION: [number, number, number] = [1.55, 0, 1.15]

/**
 * Idle spawn — open floor south of the console desk
 * (desk front ≈ z 0.85). Keep clear of sill ledge and side props.
 */
export const OPERATOR_HOME: [number, number, number] = [-0.55, 0, 2.25]

export const SKYLINE_HOME_VIEW = {
  target: [0.1, 0.9, -0.4] as [number, number, number],
  radius: 11.8,
  theta: 0.36,
  phi: 1.08,
}

export const SKYLINE_HOME_VIEW_NARROW = {
  target: [0.1, 0.95, -0.25] as [number, number, number],
  radius: 13.4,
  theta: 0.4,
  phi: 1.12,
}
