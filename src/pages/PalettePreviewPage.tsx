import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { AdhkarScreen } from '../components/adhkar/AdhkarScreen'
import { PrayerTimesPanel } from '../components/prayer-times/PrayerTimesPanel'
import { BottomNav } from '../components/nav/BottomNav'
import { getPalette, palettesFor } from '../data/palettes'
import type { PaletteId, PaletteMode, PaletteSection, PaletteTokens } from '../data/palettes'

const SECTION_LABEL: Record<PaletteSection, string> = {
  adhkar: 'الأذكار',
  prayer: 'الصلاة',
}

const MODE_LABEL: Record<PaletteMode, string> = {
  light: 'نهاري',
  dark: 'ليلي',
}

function tokenStyle(tokens: PaletteTokens): CSSProperties {
  const vars: Record<string, string> = {
    '--paper': tokens.paper,
    '--ink': tokens.ink,
    '--green-900': tokens.strong,
    '--green-700': tokens.primary,
    '--green-100': tokens.soft,
    '--section-accent': tokens.accent,
    '--surface': tokens.card,
    '--border-soft': tokens.border,
    '--muted-strong': tokens.muted,
    '--pv-card': tokens.card,
    '--pv-muted': tokens.muted,
    '--pv-border': tokens.border,
    '--pv-on-primary': tokens.onPrimary,
  }
  return vars as CSSProperties
}

export function PalettePreviewPage() {
  const [section, setSection] = useState<PaletteSection>('adhkar')
  const [paletteId, setPaletteId] = useState<PaletteId>('A')
  const [mode, setMode] = useState<PaletteMode>('light')

  const palettes = useMemo(() => palettesFor(section), [section])
  const palette = getPalette(section, paletteId)

  useEffect(() => {
    const root = document.documentElement
    const previous = root.dataset.theme
    root.dataset.theme = 'light'
    return () => {
      if (previous) {
        root.dataset.theme = previous
      } else {
        delete root.dataset.theme
      }
    }
  }, [])

  const tokens = mode === 'dark' ? palette.dark : palette.light

  return (
    <div className="palette-preview" data-testid="palette-preview" style={tokenStyle(tokens)}>
      <header className="palette-preview__bar">
        <p className="palette-preview__title">معاينة اللوحات اللونية — BC-010</p>

        <div className="palette-preview__controls">
          <div className="pv-group" role="group" aria-label="القسم">
            {(['adhkar', 'prayer'] as PaletteSection[]).map((value) => (
              <button
                key={value}
                type="button"
                className={`pv-btn${section === value ? ' is-active' : ''}`}
                data-testid={`pv-section-${value}`}
                aria-pressed={section === value}
                onClick={() => setSection(value)}
              >
                {SECTION_LABEL[value]}
              </button>
            ))}
          </div>

          <div className="pv-group" role="group" aria-label="اللوحة">
            {palettes.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`pv-btn${paletteId === item.id ? ' is-active' : ''}`}
                data-testid={`pv-palette-${item.id}`}
                aria-pressed={paletteId === item.id}
                title={`${item.libraryName} (${item.code})`}
                onClick={() => setPaletteId(item.id)}
              >
                {item.id}
              </button>
            ))}
          </div>

          <div className="pv-group" role="group" aria-label="الوضع">
            {(['light', 'dark'] as PaletteMode[]).map((value) => (
              <button
                key={value}
                type="button"
                className={`pv-btn${mode === value ? ' is-active' : ''}`}
                data-testid={`pv-mode-${value}`}
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
              >
                {MODE_LABEL[value]}
              </button>
            ))}
          </div>
        </div>

        <p className="palette-preview__caption" data-testid="pv-current">
          <span className="palette-preview__id" data-testid="pv-current-id">
            {SECTION_LABEL[section]} · {palette.id}
          </span>
          <span className="palette-preview__name">
            {palette.libraryName} ({palette.code})
          </span>
          <span className="palette-preview__mode">{MODE_LABEL[mode]}</span>
        </p>

        <ul className="palette-preview__legend" aria-label="ألوان اللوحة">
          {[
            ['الأساسي', tokens.primary],
            ['accent القسم', tokens.accent],
            ['الورق', tokens.paper],
            ['الحبر', tokens.ink],
          ].map(([label, color]) => (
            <li className="pv-chip" key={label}>
              <span className="pv-chip__dot" style={{ background: color }} />
              <span className="pv-chip__label">{label}</span>
            </li>
          ))}
        </ul>
      </header>

      <main className="palette-preview__stage" data-testid="pv-stage">
        {section === 'adhkar' ? (
          <div className="palette-preview__screen adhkar-page">
            <AdhkarScreen />
          </div>
        ) : (
          <div className="prayer-page" data-testid="prayer-page">
            <PrayerTimesPanel defaultExpanded />
          </div>
        )}
      </main>

      <BottomNav active={section === 'adhkar' ? 'adhkar' : 'prayer'} />
    </div>
  )
}
