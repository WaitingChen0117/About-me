import {
  getOperatorLook,
  nextOperatorLook,
  OPERATOR_LOOKS,
  type OperatorLookId,
} from '../scenes/ops-deck/operatorLooks'
import './OperatorSwitcher.css'

type Props = {
  value: OperatorLookId
  onChange: (id: OperatorLookId) => void
}

/** Lightweight chip switch — sits next to palette / scene controls. */
export function OperatorSwitcher({ value, onChange }: Props) {
  const current = getOperatorLook(value)

  return (
    <div className="operator-switcher" role="group" aria-label="人物形象">
      <span className="operator-switcher-kicker" aria-hidden="true">
        形象
      </span>
      <div className="operator-switcher-chips">
        {OPERATOR_LOOKS.map((look) => (
          <button
            key={look.id}
            type="button"
            className="operator-look-chip"
            aria-pressed={value === look.id}
            title={look.hint}
            onClick={() => onChange(look.id)}
          >
            {look.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="operator-switcher-cycle"
        aria-label={`切换形象，当前 ${current.label}`}
        title={current.hint}
        onClick={() => onChange(nextOperatorLook(value))}
      >
        ⇄
      </button>
    </div>
  )
}
