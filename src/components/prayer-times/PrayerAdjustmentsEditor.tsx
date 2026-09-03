import { useEffect, useRef } from 'react'
import type { UsePrayerTimesResult } from '../../hooks/usePrayerTimes'
import type { PrayerKey } from '../../storage/adjustments'
import { PRAYER_KEYS } from '../../storage/adjustments'
import {
  CALCULATION_METHODS,
  PRAYER_LABELS,
  formatPrayerTime,
} from '../../utils/prayer-times'
import type { CalculationMethodName } from '../../utils/prayer-times'
import { StepControl } from './StepControl'

const ADJUST_STEP = 1

interface PrayerAdjustmentsEditorProps {
  prayerTimes: UsePrayerTimesResult
  utcOffsetMinutes?: number
}

export function PrayerAdjustmentsEditor({
  prayerTimes,
  utcOffsetMinutes = 0,
}: PrayerAdjustmentsEditorProps) {
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

  return (
    <div className="prayer-adjust-editor">
      <ul className="prayer-adjust-editor__list" role="list">
        {PRAYER_KEYS.map((key) => {
          const adjustment = prayerTimes.adjustments[key]
          return (
            <li
              className="prayer-adjust-editor__row"
              data-prayer={key}
              key={key}
            >
              <span className="prayer-adjust-editor__name">{PRAYER_LABELS[key]}</span>
              <StepControl
                onStep={() => stepAdjustment(key, -ADJUST_STEP)}
                disabled={adjustment <= -30}
                label="−1"
                ariaLabel={`تقليل وقت ${PRAYER_LABELS[key]} بدقيقة`}
              />
              <span className="prayer-adjust-editor__value">
                {adjustment > 0 ? '+' : ''}
                {adjustment} دقيقة
              </span>
              <StepControl
                onStep={() => stepAdjustment(key, ADJUST_STEP)}
                disabled={adjustment >= 30}
                label="+1"
                ariaLabel={`زيادة وقت ${PRAYER_LABELS[key]} بدقيقة`}
              />
              <span className="prayer-adjust-editor__time" data-testid={`edit-time-${key}`}>
                {formatPrayerTime(prayerTimes.adjustedTimes[key], utcOffsetMinutes)}
              </span>
            </li>
          )
        })}
      </ul>

      <div className="prayer-method-row">
        <label className="prayer-method-field">
          <span>طريقة الحساب</span>
          <select
            data-testid="settings-method-select"
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
            data-testid="settings-madhab-select"
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
        className="btn btn--ghost prayer-adjust-editor__reset"
        data-testid="settings-reset-all"
        onClick={prayerTimes.resetAdjustments}
      >
        إعادة ضبط جميع تعديلات الصلوات
      </button>
    </div>
  )
}
