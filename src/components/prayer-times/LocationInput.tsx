import { useState } from 'react'
import type { UseLocationResult } from '../../hooks/useLocation'
import { formatPrayerTime, locationNowShiftMinutes } from '../../utils/prayer-times'
interface LocationInputProps {
  location: UseLocationResult
}

export function LocationInput({ location }: LocationInputProps) {
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [editing, setEditing] = useState(false)

  const handleSave = () => {
    const latitude = Number(lat)
    const longitude = Number(lng)
    if (location.setManual(latitude, longitude)) {
      setEditing(false)
      setLat('')
      setLng('')
    }
  }

  return (
    <div className="location-box">
      <div className="location-row">
        <span className="location-row__label">الموقع</span>
        <span className="location-row__value" data-testid="location-value">
          {location.coords.latitude.toFixed(4)}° ، {location.coords.longitude.toFixed(4)}°
          {location.isDefault && <span className="location-row__hint"> (مكة المكرمة)</span>}
        </span>
      </div>

      {location.status === 'locating' && (
        <p className="location-msg" role="status">
          جارِ تحديد الموقع…
        </p>
      )}
      {location.error && location.status === 'error' && (
        <p className="location-msg location-msg--error" role="alert">
          {location.error} — أدخل الإحداثيات يدوياً أو تابع بمكة المكرمة.
        </p>
      )}

      {!editing ? (
        <div className="location-actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => void location.detect()}
            disabled={location.status === 'locating'}
          >
            تحديد تلقائي
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setEditing(true)}
          >
            إدخال يدوي
          </button>
        </div>
      ) : (
        <div className="location-form">
          <label className="location-form__field">
            <span>خط العرض</span>
            <input
              type="number"
              step="any"
              min={-90}
              max={90}
              value={lat}
              onChange={(event) => setLat(event.target.value)}
              placeholder="21.4225"
            />
          </label>
          <label className="location-form__field">
            <span>خط الطول</span>
            <input
              type="number"
              step="any"
              min={-180}
              max={180}
              value={lng}
              onChange={(event) => setLng(event.target.value)}
              placeholder="39.8262"
            />
          </label>
          <div className="location-form__actions">
            <button type="button" className="btn" onClick={handleSave}>
              حفظ
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setEditing(false)}
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
      <div className="location-current-time">
        <span className="location-current-time__label">التوقيت المحلي</span>
        <span className="location-current-time__value" data-testid="current-time">
          {formatPrayerTime(
            new Date(),
            locationNowShiftMinutes(location.coords.longitude, new Date()),
          )}
        </span>
      </div>
    </div>
  )
}
