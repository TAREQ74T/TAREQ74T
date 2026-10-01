import { useSplash } from '../../hooks/useSplash'
import { APP_VERSION } from '../../utils/version'

/** شاشة البداية — تُتخطى بنقرة واحدة أو تختفي تلقائياً خلال 1.8 ثانية. */
export function SplashScreen() {
  const { visible, leaving, dismiss } = useSplash()

  if (!visible) {
    return null
  }

  const className = leaving ? 'splash-screen is-leaving' : 'splash-screen'

  return (
    <div
      className={className}
      data-testid="splash-screen"
      role="button"
      tabIndex={0}
      aria-label="تخطي شاشة البداية"
      onClick={dismiss}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          dismiss()
        }
      }}
    >
      <div className="splash-screen__badge" aria-hidden="true">
        <svg
          className="splash-screen__icon"
          viewBox="0 0 96 96"
          width="96"
          height="96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M32 66 L22 78" stroke="#6B4423" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M64 66 L74 78" stroke="#6B4423" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M18 78 H78" stroke="#6B4423" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M7 22 L46 12 L46 64 L5 60 Z" fill="#8B4513" />
          <path d="M50 12 L89 22 L91 60 L50 64 Z" fill="#8B4513" />
          <path d="M9 23 L45 14 L45 62 L8 58.5 Z" stroke="#C9A227" strokeWidth="1.05" />
          <path d="M51 14 L87 23 L88 58.5 L51 62 Z" stroke="#C9A227" strokeWidth="1.05" />
          <path
            d="M11 24 Q 28 13.5 45 15 L45 61 L11 57.5 Z"
            fill="#fbfaf6"
            stroke="#5C3A1E"
            strokeWidth="0.7"
          />
          <path
            d="M51 15 Q 68 13.5 85 24 L85 57.5 L51 61 Z"
            fill="#fbfaf6"
            stroke="#5C3A1E"
            strokeWidth="0.7"
          />
          <path d="M46 13 L50 13 L50 63 L46 63 Z" fill="#8B4513" />
          <path d="M47.35 14.5 L48.65 14.5 L48.65 61.5 L47.35 61.5 Z" fill="#C9A227" />
          <path
            d="M41 28 H16 M41 32 H18 M41 36 H15 M41 40 H19 M41 44 H17 M41 48 H20 M41 52 H16 M41 56 H21"
            stroke="#C4A882"
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity="0.55"
          />
          <path
            d="M55 28 H80 M55 32 H78 M55 36 H81 M55 40 H77 M55 44 H79 M55 48 H76 M55 52 H80 M55 56 H75"
            stroke="#C4A882"
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity="0.55"
          />
          <path d="M47 61 L47 81 L48 84 L49 81 L49 61 Z" fill="#B42318" />
        </svg>
      </div>
      <h1 className="splash-screen__name" data-testid="splash-name">
        مصحف الهدى
      </h1>
      <p className="splash-screen__tagline">يقرأ القرآن الكريم دون اتصال</p>
      <p className="splash-screen__version" data-testid="splash-version">
        الإصدار {APP_VERSION}
      </p>
    </div>
  )
}
