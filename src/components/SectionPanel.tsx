import { useEffect, useRef, type SyntheticEvent } from 'react'
import { sectionById, type SectionId } from '../content/sections'
import './SectionPanel.css'

type Props = {
  sectionId: SectionId
  onClose: () => void
}

export function SectionPanel({ sectionId, onClose }: Props) {
  const section = sectionById[sectionId]
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, sectionId])

  /** Keep canvas / orbit / Html overlays from stealing the close gesture. */
  const stopScenePointer = (e: SyntheticEvent) => {
    e.stopPropagation()
  }

  const handleClose = (e: SyntheticEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClose()
  }

  return (
    <>
      <div
        className="panel-backdrop"
        onClick={onClose}
        onPointerDown={stopScenePointer}
        aria-hidden="true"
      />
      <aside
        className="section-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="section-panel-title"
        onPointerDown={stopScenePointer}
        onMouseDown={stopScenePointer}
        onClick={stopScenePointer}
      >
        <header className="section-panel-header">
          <div>
            <div className="section-panel-kicker">Section · {section.id}</div>
            <h2 id="section-panel-title" className="section-panel-title">
              {section.title}
            </h2>
            <p className="section-panel-sub">{section.subtitle}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="section-panel-close"
            aria-label="关闭面板"
            onPointerDown={handleClose}
            onClick={handleClose}
          >
            ×
          </button>
        </header>
        <div className="section-panel-body">
          {section.blocks.map((block, i) => {
            switch (block.type) {
              case 'paragraph':
                return <p key={i}>{block.text}</p>
              case 'list':
                return (
                  <ul className="plain-list" key={i}>
                    {block.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )
              case 'tags':
                return (
                  <div className="tag-row" key={i}>
                    {block.items.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                )
              case 'timeline':
                return (
                  <div className="timeline" key={i}>
                    {block.items.map((item) => (
                      <div className="timeline-item" key={item.period + item.role}>
                        <div className="timeline-period">{item.period}</div>
                        <div className="timeline-role">{item.role}</div>
                        <div className="timeline-focus">{item.focus}</div>
                      </div>
                    ))}
                  </div>
                )
              case 'cards':
                return (
                  <div className="card-stack" key={i}>
                    {block.items.map((card) => {
                      const inner = (
                        <>
                          <h3>{card.title}</h3>
                          <p>{card.blurb}</p>
                          {card.tags ? (
                            <div className="tag-row">
                              {card.tags.map((t) => (
                                <span key={t}>{t}</span>
                              ))}
                            </div>
                          ) : null}
                        </>
                      )
                      return card.href ? (
                        <a
                          key={card.title}
                          className="work-card"
                          href={card.href}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {inner}
                        </a>
                      ) : (
                        <div key={card.title} className="work-card">
                          {inner}
                        </div>
                      )
                    })}
                  </div>
                )
              case 'links':
                return (
                  <div className="link-list" key={i}>
                    {block.items.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <strong>{link.label}</strong>
                        {link.note ? <span>{link.note}</span> : null}
                      </a>
                    ))}
                  </div>
                )
              default:
                return null
            }
          })}
        </div>
      </aside>
    </>
  )
}
