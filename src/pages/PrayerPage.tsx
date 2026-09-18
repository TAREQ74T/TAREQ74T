import { PrayerTimesPanel } from '../components/prayer-times/PrayerTimesPanel'
import { QiblaCompass } from '../components/qibla/QiblaCompass'

interface PrayerPageProps {
  hapticsEnabled?: boolean
}

export function PrayerPage({ hapticsEnabled = true }: PrayerPageProps) {
  return (
    <div className="prayer-page" data-testid="prayer-page">
      <header className="settings-page__header">
        <h2>الصلاة</h2>
      </header>
      <PrayerTimesPanel defaultExpanded />
      <QiblaCompass hapticsEnabled={hapticsEnabled} />
    </div>
  )
}
