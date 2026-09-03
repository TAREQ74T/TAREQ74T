import { useEffect, useRef, useState } from 'react'
import { useHijriDate } from '../../hooks/useHijriDate'
import { useLocation } from '../../hooks/useLocation'
import { usePrayerTimes } from '../../hooks/usePrayerTimes'
import { useSettings } from '../../hooks/useSettings'
import type { PrayerKey } from '../../storage/adjustments'
import { PRAYER_KEYS } from '../../storage/adjustments'
import {
  CALCULATION_METHODS,
  PRAYER_LABELS,
  effectiveUtcOffsetMinutes,
  formatPrayerTime,
} from '../../utils/prayer-times'
import type { CalculationMethodName } from '../../utils/prayer-times'
import { formatHijriDateShort } from '../../utils/hijri'
import { HijriDateDisplay } from './HijriDateDisplay'
import { LocationInput } from './LocationInput'
import { StepControl } from './StepControl'

const ADJUST_STEP = 1

interface PrayerTimesPanelProps {
  defaultExpanded?: boolean
}

export function PrayerTimesPanel({
  defaultExpanded = false,
}: PrayerTimesPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [editingPrayer, setEditingPrayer] = useState<PrayerKey | null>(null)
  const hijri = useHijriDate()
  const location = useLocation()
  const { settings } = useSettings()
  const utcOffsetMinutes = effectiveUtcOffsetMinutes(
    location.coords,
    settings.timezoneMode,
    settings.manualUtcOffsetHours,
  )
  const prayerTimes = usePrayerTimes(location.coords, utcOffsetMinutes)

  const adjustmentsRef = useRef(prayerTimes.adjustments)
  useEffect(() => {
    adjustmentsRef.current = prayerTimes.adjustments
  }, [prayerTimes.adjustments])

  const stepAdjustment = (key: PrayerKey, delta: number) => {
    const current = adjustmentsRef.current[key]
    const next = current + delta
    if (next < -30 || next > 30) {
      return
    }
    prayerTimes.setAdjustment(key, next)
  }

  const isNext = (key: PrayerKey): boolean => prayerTimes.nextPrayer?.key === key

  return (
    <section className="prayer-panel" aria-label="التاريخ الهجري وأوقات الصلاة">
      <button
        type="button"
        className={`prayer-panel__toggle${expanded ? ' is-expanded' : ''}`}
        aria-expanded={expanded}
        data-testid="prayer-panel-toggle"
        onClick={() => setExpanded((value) => !value)}
      >
        <span className="prayer-panel__toggle-summary">
          <span className="prayer-panel__date-row">
            <span className="prayer-panel__date-label">التاريخ الهجري</span>
            <span className="prayer-panel__date-value" data-testid="panel-hijri">
              {hijri.supported
                ? formatHijriDateShort(hijri.adjustedDate)
                : 'غير مدعوم في المتصفح'}
            </span>
          </span>
          <span className="prayer-panel__next-row">
            {prayerTimes.nextPrayer ? (
              <span className="prayer-panel__toggle-next" data-testid="panel-next">
                القادمة: {PRAYER_LABELS[prayerTimes.nextPrayer.key]} •{' '}
                {formatPrayerTime(prayerTimes.nextPrayer.time, utcOffsetMinutes)}
              </span>
            ) : (
              <span className="prayer-panel__toggle-next">أوقات الصلاة</span>
            )}
          </span>
        </span>
        <span className="prayer-panel__toggle-icon">
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <div className="prayer-panel__body">
          <HijriDateDisplay hijri={hijri} />
          <LocationInput
            location={location}
            utcOffsetMinutes={utcOffsetMinutes}
          />

          <ul className="prayer-list" role="list">
            {PRAYER_KEYS.map((key) => {
              const adjustment = prayerTimes.adjustments[key]
              const adjusted = prayerTimes.adjustedTimes[key]
              const original = prayerTimes.times[key]
              const editing = editingPrayer === key
              const next = isNext(key)
              return (
                <li
                  key={key}
                  className="prayer-row"
                  data-prayer={key}
                  data-next={next}
                  data-adjusted={adjustment !== 0}
                >
                  <button
                    type="button"
                    className="prayer-row__main"
                    onClick={() =>
                      setEditingPrayer((current) => (current === key ? null : key))
                    }
                  >
                    <span className="prayer-row__name">
                      {PRAYER_LABELS[key]}
                      {next && (
                        <span className="prayer-next-badge" data-testid="next-prayer">
                          القادمة
                        </span>
                      )}
                    </span>
                    <span className="prayer-row__times">
                      <span className="prayer-row__time" data-testid={`time-${key}`}>
                        {formatPrayerTime(adjusted, utcOffsetMinutes)}
                      </span>
                      {adjustment !== 0 && (
                        <span
                          className="prayer-row__original"
                          data-testid={`original-${key}`}
                          title={`الوقت الأصلي المحسوب`}
                        >
                          {formatPrayerTime(original, utcOffsetMinutes)}
                        </span>
                      )}
                    </span>
                  </button>

                  {editing && (
                    <div className="prayer-edit" data-testid={`edit-${key}`}>
                      <StepControl
                        onStep={() => stepAdjustment(key, -ADJUST_STEP)}
                        disabled={adjustment <= -30}
                        label="−1"
                        ariaLabel={`تقليل وقت ${PRAYER_LABELS[key]} بدقيقة`}
                      />
                      <span className="prayer-edit__value">
                        {adjustment > 0 ? '+' : ''}
                        {adjustment} دقيقة
                      </span>
                      <StepControl
                        onStep={() => stepAdjustment(key, ADJUST_STEP)}
                        disabled={adjustment >= 30}
                        label="+1"
                        ariaLabel={`زيادة وقت ${PRAYER_LABELS[key]} بدقيقة`}
                      />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          <div className="prayer-method-row">
            <label className="prayer-method-field">
              <span>طريقة الحساب</span>
              <select
                data-testid="method-select"
                value={prayerTimes.method}
                onChange={(event) =>
                  prayerTimes.setMethod(event.target.value as CalculationMethodName)
                }
              >
                {(Object.keys(CALCULATION_METHODS) as CalculationMethodName[]).map(
                  (method) => (
                    <option key={method} value={method}>
                      {CALCULATION_METHODS[method]}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="prayer-method-field">
              <span>المذهب</span>
              <select
                data-testid="madhab-select"
                value={prayerTimes.madhab}
                onChange={(event) =>
                  prayerTimes.setMadhab(event.target.value as 'shafi' | 'hanafi')
                }
              >
                <option value="shafi">الشافعي</option>
                <option value="hanafi">الحنفي</option>
              </select>
            </label>
          </div>

          <button
            type="button"
            className="btn btn--ghost prayer-reset-btn"
            data-testid="reset-all"
            onClick={prayerTimes.resetAdjustments}
          >
            إعادة ضبط جميع تعديلات الصلوات
          </button>
        </div>
      )}
    </section>
  )
}
