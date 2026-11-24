import { Operator } from '../../components/Operator'
import { SECTION_ORDER, type SectionId } from '../../content/sections'
import type { SceneProps } from '../types'
import { opsDeckHotspots } from './hotspots'
import './OpsDeck.css'

export function OpsDeckScene({
  theme,
  activeSection,
  onOpenSection,
  onSendOperator,
  avatarOpen,
  onToggleAvatar,
  operatorTarget,
  operatorTicket,
  onOperatorArrive,
}: SceneProps) {
  const onOperatorTap = () => {
    const pool = opsDeckHotspots.map((h) => h.id)
    const next = pool[Math.floor(Math.random() * pool.length)]!
    onSendOperator(next)
  }

  return (
    <div className="ops-deck" data-theme-mode={theme}>
      <div className="ops-ambient" aria-hidden="true" />
      <div className="ops-grid-floor" aria-hidden="true" />

      <div className="ops-desk">
        <div className="ops-hud-rail">
          <div>
            Scene <strong>A · Ops Deck</strong>
          </div>
          <div className="ops-status-lights" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            Mode <strong>{theme === 'duty' ? 'Duty' : 'Bright'}</strong>
          </div>
        </div>

        {opsDeckHotspots.map((spot) => (
          <button
            key={spot.id}
            type="button"
            className={[
              'hotspot',
              `hotspot--${spot.id}`,
              activeSection === spot.id ? 'is-active' : '',
              operatorTarget === spot.id ? 'is-target' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
            onClick={() => onOpenSection(spot.id)}
            aria-label={`打开${spot.label}：${spot.hint}`}
          >
            <span className="hotspot-kicker">{spot.label}</span>
            <span className="hotspot-label">{titleFor(spot.id)}</span>
            <span className="hotspot-hint">{spot.hint}</span>
          </button>
        ))}

        <button
          type="button"
          className="avatar-pod"
          aria-pressed={avatarOpen}
          onClick={onToggleAvatar}
          aria-label="打开 AI 分身对话舱"
        >
          <div className="avatar-pod-title">中央对话舱</div>
          <div className="avatar-pod-sub">AI 分身 · 预设问答</div>
        </button>

        <Operator
          hotspots={opsDeckHotspots}
          target={operatorTarget}
          ticket={operatorTicket}
          onArrive={onOperatorArrive}
          onTap={onOperatorTap}
        />
      </div>

      <div className="mobile-section-rail" aria-label="移动端板块快捷入口">
        {SECTION_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            className={activeSection === id ? 'is-active' : undefined}
            onClick={() => onOpenSection(id)}
          >
            {titleFor(id)}
          </button>
        ))}
      </div>
    </div>
  )
}

function titleFor(id: SectionId): string {
  const map: Record<SectionId, string> = {
    about: '关于我',
    experience: '经历',
    works: '作品',
    projects: '项目',
    articles: '文章',
    hobbies: '爱好',
    contact: '联系',
  }
  return map[id]
}
