import type { UseHijriDateResult } from '../../hooks/useHijriDate'
import { hijriOffsetLabel } from '../../utils/hijri'

interface HijriDateDisplayProps {
  hijri: UseHijriDateResult
}

export function HijriDateDisplay({ hijri }: HijriDateDisplayProps) {
  if (!hijri.supported) {
    return (
      <div className="hijri-card" role="status">
        <p className="hijri-date__fallback">
          متصفحك لا يدعم التقويم الهجري (islamic-umalqura) لعرض التاريخ.
        </p>
      </div>
    )
  }

  return (
    <div className="hijri-card">
      <div className="hijri-date-row">
        <button
          type="button"
          className="step-btn"
          aria-label="تقليل التاريخ الهجري يوماً"
          disabled={hijri.atMin}
          onClick={hijri.decrement}
        >
          −
        </button>
        <div className="hijri-date">
          <span className="hijri-date__label">التاريخ الهجري</span>
          <span className="hijri-date__value" data-testid="hijri-date">
            {hijri.hijriString}
          </span>
          {hijri.offset !== 0 && (
            <span
              className="hijri-badge"
              data-testid="hijri-offset-badge"
              data-direction={hijri.offset > 0 ? 'plus' : 'minus'}
            >
              {hijriOffsetLabel(hijri.offset)}
            </span>
          )}
        </div>
        <button
          type="button"
          className="step-btn"
          aria-label="زيادة التاريخ الهجري يوماً"
          disabled={hijri.atMax}
          onClick={hijri.increment}
        >
          +
        </button>
      </div>
      {hijri.offset !== 0 && (
        <button
          type="button"
          className="reset-link"
          data-testid="hijri-reset"
          onClick={hijri.reset}
        >
          إعادة ضبط الإزاحة
        </button>
      )}
      {(hijri.atMin || hijri.atMax) && (
        <p className="hijri-limit-note" role="alert">
          {hijri.atMax ? 'وصلت الحد الأقصى (+٣ أيام)' : 'وصلت الحد الأدنى (−٣ أيام)'}
        </p>
      )}
    </div>
  )
}
