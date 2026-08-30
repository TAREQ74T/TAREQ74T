import type { FontSize } from '../../hooks/useSettings'

const FONT_SIZES: { value: FontSize; label: string; hint: string }[] = [
  { value: 'small', label: 'صغير', hint: 'حجم خط أصغر' },
  { value: 'medium', label: 'متوسط', hint: 'حجم الخط الافتراضي' },
  { value: 'large', label: 'كبير', hint: 'حجم خط أكبر' },
]

interface FontSizeControlProps {
  fontSize: FontSize
  onChange: (fontSize: FontSize) => void
}

export function FontSizeControl({ fontSize, onChange }: FontSizeControlProps) {
  return (
    <fieldset className="setting-group">
      <legend className="setting-group__title">حجم الخط</legend>
      <div className="font-size-options">
        {FONT_SIZES.map((option) => (
          <button
            key={option.value}
            type="button"
            className={fontSize === option.value ? 'font-size-option is-active' : 'font-size-option'}
            aria-pressed={fontSize === option.value}
            title={option.hint}
            onClick={() => onChange(option.value)}
          >
            <span className="font-size-option__sample" data-size={option.value}>
              آ
            </span>
            <span className="font-size-option__label">{option.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}
