import type { Theme } from '../../hooks/useSettings'

interface ThemeToggleProps {
  theme: Theme
  onChange: (theme: Theme) => void
}

export function ThemeToggle({ theme, onChange }: ThemeToggleProps) {
  const isDark = theme === 'dark'
  return (
    <fieldset className="setting-group">
      <legend className="setting-group__title">المظهر</legend>
      <div className="theme-options">
        <button
          type="button"
          className={isDark ? 'theme-option is-active' : 'theme-option'}
          aria-pressed={isDark}
          onClick={() => onChange('dark')}
        >
          <span className="theme-option__icon" aria-hidden="true">
            ◐
          </span>
          <span>ليلي</span>
        </button>
        <button
          type="button"
          className={!isDark ? 'theme-option is-active' : 'theme-option'}
          aria-pressed={!isDark}
          onClick={() => onChange('light')}
        >
          <span className="theme-option__icon" aria-hidden="true">
            ◉
          </span>
          <span>نهاري</span>
        </button>
      </div>
    </fieldset>
  )
}
