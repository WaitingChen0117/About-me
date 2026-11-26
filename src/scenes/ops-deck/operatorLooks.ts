/** Switchable Operator looks — KayKit GLB + beautified procedural vinyl. */

export type OperatorLookId = 'kaykit' | 'procedural'

export type OperatorLookMeta = {
  id: OperatorLookId
  /** Short HUD chip label */
  label: string
  /** Tooltip / aria hint */
  hint: string
}

export const OPERATOR_LOOKS: OperatorLookMeta[] = [
  {
    id: 'kaykit',
    label: '旅人',
    hint: 'KayKit Rogue · CC0 成熟低模',
  },
  {
    id: 'procedural',
    label: '潮玩',
    hint: '自研乙烯潮玩 · 眼镜卫衣球鞋',
  },
]

export const DEFAULT_OPERATOR_LOOK: OperatorLookId = 'kaykit'

const STORAGE_KEY = 'about-me.operator-look'

export function isOperatorLookId(v: string): v is OperatorLookId {
  return v === 'kaykit' || v === 'procedural'
}

export function getOperatorLook(id: OperatorLookId): OperatorLookMeta {
  return OPERATOR_LOOKS.find((l) => l.id === id) ?? OPERATOR_LOOKS[0]!
}

export function readStoredOperatorLook(): OperatorLookId | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw && isOperatorLookId(raw)) return raw
  } catch {
    /* ignore */
  }
  return null
}

export function storeOperatorLook(id: OperatorLookId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* ignore */
  }
}

export function nextOperatorLook(id: OperatorLookId): OperatorLookId {
  const i = OPERATOR_LOOKS.findIndex((l) => l.id === id)
  return OPERATOR_LOOKS[(i + 1) % OPERATOR_LOOKS.length]!.id
}
