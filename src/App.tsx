import { QuranPage } from './pages/QuranPage'

export default function App() {
  return (
    <div className="app" dir="rtl">
      <header className="app-header">
        <h1>مصحف الهدى</h1>
        <p className="app-subtitle">مصحف الهدى — يقرأ القرآن الكريم دون اتصال</p>
      </header>
      <QuranPage />
    </div>
  )
}
