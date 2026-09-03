import { useState } from 'react'
import { useQibla } from '../../hooks/useQibla'
import { cardinalLabel, roundBearing } from '../../utils/qibla'

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']

function toArabicDigits(value: number): string {
  return String(value)
    .split('')
    .map((digit) => ARABIC_DIGITS[Number(digit)] ?? digit)
    .join('')
}

function formatDegrees(value: number): string {
  const rounded = roundBearing(((value % 360) + 360) % 360)
  return `°${toArabicDigits(rounded)}`
}

export function QiblaCompass() {
  const qibla = useQibla()
  const [mode, setMode] = useState<'auto' | 'manual'>('auto')
  const [manualAngle, setManualAngle] = useState(0)

  const hardUnsupported =
    qibla.status === 'unsupported' || qibla.status === 'insecure'
  const autoFallsBackToManual =
    (hardUnsupported || qibla.status === 'denied') && mode === 'auto'

  const effectiveManual = mode === 'manual' || autoFallsBackToManual

  const needleRotation =
    mode === 'manual'
      ? ((manualAngle % 360) + 360) % 360
      : qibla.relativeBearing ?? ((qibla.bearing % 360) + 360) % 360

  const displayedBearing =
    mode === 'manual'
      ? ((manualAngle % 360) + 360) % 360
      : qibla.bearing

  const statusLabel = (() => {
    switch (qibla.status) {
      case 'active':
        return 'البوصلة مفعّلة'
      case 'denied':
        return 'الإذن مرفوض'
      case 'unsupported':
        return 'غير مدعومة'
      case 'insecure':
        return 'اتصال غير آمن'
      case 'idle':
        return 'البوصلة متاحة'
    }
  })()

  const handleRange = (value: string) => {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      setManualAngle(((parsed % 360) + 360) % 360)
    }
  }

  return (
    <section className="qibla-compass" data-testid="qibla-compass">
      <h3 className="qibla-compass__title">اتجاه القبلة</h3>

      <div className="qibla-compass__dial-wrap">
        <div className="qibla-compass__dial" data-testid="qibla-dial">
          <span className="qibla-compass__dir qibla-compass__dir--n">ش</span>
          <span className="qibla-compass__dir qibla-compass__dir--e">ق</span>
          <span className="qibla-compass__dir qibla-compass__dir--s">ج</span>
          <span className="qibla-compass__dir qibla-compass__dir--w">غ</span>
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(
            (degree) => (
              <span
                key={degree}
                className="qibla-compass__tick"
                style={{ transform: `rotate(${degree}deg)` }}
              />
            ),
          )}
          <span
            className="qibla-compass__needle"
            data-testid="qibla-needle"
            style={{ transform: `rotate(${needleRotation}deg)` }}
          >
            <span className="qibla-compass__needle-tip" />
          </span>
        </div>
      </div>

      <div className="qibla-compass__readout">
        <span className="qibla-compass__bearing" data-testid="qibla-bearing">
          {formatDegrees(displayedBearing)} {cardinalLabel(displayedBearing)}
        </span>
        {qibla.heading != null && (
          <span className="qibla-compass__heading" data-testid="qibla-heading">
            اتجاه الجهاز: {formatDegrees(qibla.heading)}
          </span>
        )}
      </div>

      <p
        className={`qibla-compass__status${qibla.status === 'active' ? ' is-active' : ''}`}
        data-testid="qibla-status"
        role="status"
      >
        {statusLabel}
      </p>

      {qibla.error && (
        <p className="qibla-compass__error" role="alert">
          {qibla.error}
        </p>
      )}

      {!effectiveManual && qibla.status === 'idle' && (
        <button
          type="button"
          className="btn"
          data-testid="qibla-start"
          onClick={() => void qibla.request()}
        >
          تشغيل البوصلة
        </button>
      )}

      {effectiveManual ? (
        <div className="qibla-compass__manual" data-testid="qibla-manual">
          <label className="qibla-compass__field">
            <span>الزاوية (0–360)</span>
            <input
              type="range"
              min={0}
              max={360}
              value={manualAngle}
              data-testid="qibla-manual-range"
              onChange={(event) => handleRange(event.target.value)}
            />
          </label>
          <label className="qibla-compass__field">
            <span>قيمة رقمية</span>
            <input
              type="number"
              min={0}
              max={360}
              value={manualAngle}
              data-testid="qibla-manual-input"
              onChange={(event) => handleRange(event.target.value)}
            />
          </label>
          <p className="qibla-compass__manual-note" data-testid="qibla-manual-note">
            الإشارة الثابتة تتجه إلى {formatDegrees(manualAngle)}{' '}
            ({cardinalLabel(manualAngle)})
          </p>
          {!hardUnsupported && (
            <button
              type="button"
              className="btn btn--ghost"
              data-testid="qibla-back-to-compass"
              onClick={() => setMode('auto')}
            >
              العودة للبوصلة الحية
            </button>
          )}
        </div>
      ) : (
        qibla.status === 'active' && (
          <button
            type="button"
            className="btn btn--ghost"
            data-testid="qibla-manual-toggle"
            onClick={() => setMode('manual')}
          >
            إدخال يدوي
          </button>
        )
      )}

      {qibla.status === 'denied' && mode === 'manual' && (
        <button
          type="button"
          className="btn btn--ghost"
          data-testid="qibla-retry"
          onClick={() => {
            setMode('auto')
            void qibla.request()
          }}
        >
          إعادة طلب إذن البوصلة
        </button>
      )}
    </section>
  )
}
