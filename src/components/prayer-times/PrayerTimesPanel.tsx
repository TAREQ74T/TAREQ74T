import { useState } from 'react'
import { useHijriDate } from '../../hooks/useHijriDate'
import { useLocation } from '../../hooks/useLocation'
import { usePrayerTimes } from '../../hooks/usePrayerTimes'
import type { PrayerKey } from '../../storage/adjustments'
import { PRAYER_KEYS } from '../../storage/adjustments'
import {
  CALCULATION_METHODS,
  PRAYER_LABELS,
  formatPrayerTime,
  longitudeOffsetMinutes,
} from '../../utils/prayer-times'
import type { CalculationMethodName } from '../../utils/prayer-times'
import { HijriDateDisplay } from './HijriDateDisplay'
import { LocationInput } from './LocationInput'

const ADJUST_STEP = 5

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
  const prayerTimes = usePrayerTimes(location.coords)
  const lonOffset = longitudeOffsetMinutes(location.coords.longitude)

  const isNext = (key: PrayerKey): boolean => prayerTimes.nextPrayer?.key === key

  return (
    <section className="prayer-panel" aria-label="التاريخ الهجري وأوقات الصلاة">
      <HijriDateDisplay hijri={hijri} />

      <button
        type="button"
        className="prayer-panel__toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        <span>أوقات الصلاة</span>
        <span className="prayer-panel__toggle-icon">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="prayer-panel__body">
          <LocationInput location={location} />

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
                        {formatPrayerTime(adjusted, lonOffset)}
                      </span>
                      {adjustment !== 0 && (
                        <span
                          className="prayer-row__original"
                          data-testid={`original-${key}`}
                          title={`الوقت الأصلي المحسوب`}
                        >
                          {formatPrayerTime(original, lonOffset)}
                        </span>
                      )}
                    </span>
                  </button>

                  {editing && (
                    <div className="prayer-edit" data-testid={`edit-${key}`}>
                      <button
                        type="button"
                        className="step-btn"
                        aria-label={`تقليل وقت ${PRAYER_LABELS[key]}`}
                        disabled={adjustment <= -30}
                        onClick={() =>
                          prayerTimes.setAdjustment(
                            key,
                            adjustment - ADJUST_STEP,
                          )
                        }
                      >
                        −
                      </button>
                      <span className="prayer-edit__value">
                        {adjustment > 0 ? '+' : ''}
                        {adjustment} دقيقة
                      </span>
                      <button
                        type="button"
                        className="step-btn"
                        aria-label={`زيادة وقت ${PRAYER_LABELS[key]}`}
                        disabled={adjustment >= 30}
                        onClick={() =>
                          prayerTimes.setAdjustment(
                            key,
                            adjustment + ADJUST_STEP,
                          )
                        }
                      >
                        +
                      </button>
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
