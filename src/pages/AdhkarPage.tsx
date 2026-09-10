import { AdhkarScreen } from '../components/adhkar/AdhkarScreen'

interface AdhkarPageProps {
  onBack: () => void
}

export function AdhkarPage({ onBack }: AdhkarPageProps) {
  return (
    <div className="settings-page adhkar-page">
      <header className="settings-page__header">
        <h2>الأذكار</h2>
        <button type="button" className="settings-back-btn" onClick={onBack}>
          ← العودة إلى القراءة
        </button>
      </header>
      <AdhkarScreen />
    </div>
  )
}
