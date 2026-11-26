import type { HotspotDef } from '../types'

/**
 * Programmer studio layout (floor units).
 * Back wall ≈ z=-4.2 · left wall ≈ x=-5.2 · open front toward camera.
 * Desk faces back wall; chair / walk space toward +z.
 */
export const opsDeckHotspots: HotspotDef[] = [
  {
    id: 'about',
    label: '主显示器',
    hint: '身份与定位',
    x: 50,
    y: 22,
    position: [0, 0, -1.05],
    labelY: 2.05,
    view: {
      target: [0, 1.1, -0.95],
      radius: 3.45,
      theta: 0.12,
      phi: 0.98,
    },
  },
  {
    id: 'experience',
    label: '墙面时间线',
    hint: '脱敏经历',
    x: 14,
    y: 36,
    position: [-4.15, 0, -1.65],
    labelY: 1.55,
    view: {
      target: [-3.95, 0.85, -1.55],
      radius: 3.2,
      theta: -0.92,
      phi: 1.02,
    },
  },
  {
    id: 'works',
    label: '侧屏预览',
    hint: '作品精选',
    x: 78,
    y: 30,
    position: [2.45, 0, -1.0],
    labelY: 1.55,
    view: {
      target: [2.3, 0.9, -0.9],
      radius: 3.25,
      theta: 0.78,
      phi: 0.98,
    },
  },
  {
    id: 'projects',
    label: '书架机位',
    hint: '系统项目',
    x: 88,
    y: 54,
    position: [4.2, 0, 0.45],
    labelY: 1.85,
    view: {
      target: [4.0, 0.95, 0.4],
      radius: 3.3,
      theta: 1.08,
      phi: 0.94,
    },
  },
  {
    id: 'articles',
    label: '笔记抽屉',
    hint: '文章入口',
    x: 12,
    y: 58,
    position: [-4.05, 0, 0.75],
    labelY: 1.05,
    // Pull back from the left-wall cabinet and aim at the notebook stack so
    // the panel sits on a readable prop + room view (not a dark tight crop).
    view: {
      target: [-3.55, 1.05, 0.9],
      radius: 5.4,
      theta: -0.52,
      phi: 1.08,
    },
  },
  {
    id: 'hobbies',
    label: '边桌小物',
    hint: '爱好侧面',
    x: 24,
    y: 78,
    position: [-2.55, 0, 2.75],
    labelY: 0.95,
    view: {
      target: [-2.4, 0.5, 2.6],
      radius: 3.1,
      theta: -0.4,
      phi: 1.08,
    },
  },
  {
    id: 'contact',
    label: '台灯信箱',
    hint: '公开联系',
    x: 74,
    y: 78,
    position: [2.85, 0, 2.65],
    labelY: 1.45,
    view: {
      target: [2.7, 0.75, 2.5],
      radius: 3.15,
      theta: 0.55,
      phi: 1.02,
    },
  },
]

/** Desk-corner dock for AI companion / chibi figure. */
export const AVATAR_POD_POSITION: [number, number, number] = [1.15, 0, 0.55]
/** Idle walk home — in front of the desk chair. */
export const OPERATOR_HOME: [number, number, number] = [0.05, 0, 1.85]

/** Task chair world root (matches DeckWorld mesh). */
export const CHAIR_POSITION: [number, number, number] = [0.05, 0, 1.15]
/**
 * Approach point south of the chair (outside the chair AABB + radius)
 * before the sit blend locks onto the seat.
 */
export const CHAIR_APPROACH: [number, number, number] = [0.05, 0, 1.78]
/**
 * Seated root — hip on cushion top (≈ 0.46), coaxial with chair
 * so swivel keeps character+seat locked without orbit drift.
 * Hip local Y is 0.32 → sitY ≈ 0.46 - 0.32 = 0.14 (planted, not sunk).
 */
export const CHAIR_SIT: [number, number, number] = [0.05, 0.15, 1.15]
/** Face desk monitors (local +Z front → world −Z). */
export const CHAIR_FACE_YAW = Math.PI
/**
 * Empty-chair / after-stand facing: room aisle & camera (+Z), not under the desk.
 * Operator local +Z front → world +Z.
 */
export const CHAIR_OUTWARD_YAW = 0
/**
 * Swivel Y when idle: backrest toward desk (−Z), seat open to the aisle.
 * Equals `CHAIR_OUTWARD_YAW - CHAIR_FACE_YAW` (mesh backrest is on local +Z).
 */
export const CHAIR_REST_SWIVEL = CHAIR_OUTWARD_YAW - CHAIR_FACE_YAW
/** Desk computers / monitors that keep the operator seated on click. */
export const DESK_MONITOR_IDS = ['about', 'works'] as const

/** Desktop HOME framing for room-scale studio. */
export const OPS_HOME_VIEW = {
  target: [0, 0.85, -0.35] as [number, number, number],
  radius: 11.4,
  theta: 0.4,
  phi: 1.05,
}

export const OPS_HOME_VIEW_NARROW = {
  target: [0, 0.9, -0.25] as [number, number, number],
  radius: 13.0,
  theta: 0.44,
  phi: 1.08,
}
