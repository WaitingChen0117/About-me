import { useEffect, useId, useRef, useState } from 'react'
import {
  getPalette,
  nextPaletteId,
  PALETTE_PRESETS,
  prevPaletteId,
  type PaletteId,
} from '../themes/palettes'
import './PaletteSwitcher.css'

type Props = {
  value: PaletteId
  onChange: (id: PaletteId) => void
}

export function PaletteSwitcher({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const current = getPalette(value)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="palette-switcher" ref={rootRef} data-open={open ? 'true' : 'false'}>
      <div className="palette-switcher-bar" role="group" aria-label="配色预设">
        <button
          type="button"
          className="palette-nav"
          aria-label="上一套配色"
          title="上一套"
          onClick={() => onChange(prevPaletteId(value))}
        >
          ‹
        </button>
        <button
          type="button"
          className="palette-current"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          title={current.hint}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="palette-swatch" style={{ background: current.swatch }} aria-hidden="true" />
          <span className="palette-label">{current.label}</span>
          <span className="palette-caret" aria-hidden="true">
            ▾
          </span>
        </button>
        <button
          type="button"
          className="palette-nav"
          aria-label="下一套配色"
          title="下一套"
          onClick={() => onChange(nextPaletteId(value))}
        >
          ›
        </button>
      </div>

      {open ? (
        <ul
          id={listId}
          className="palette-menu"
          role="listbox"
          aria-label="选择配色预设"
        >
          {PALETTE_PRESETS.map((p) => (
            <li key={p.id} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={p.id === value}
                className="palette-option"
                data-family={p.family}
                title={p.hint}
                onClick={() => {
                  onChange(p.id)
                  setOpen(false)
                }}
              >
                <span className="palette-swatch" style={{ background: p.swatch }} aria-hidden="true" />
                <span className="palette-option-text">
                  <span className="palette-option-name">{p.label}</span>
                  <span className="palette-option-hint">{p.hint}</span>
                </span>
                <span className="palette-family" aria-hidden="true">
                  {p.family === 'dark' ? 'Dark' : 'Light'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
