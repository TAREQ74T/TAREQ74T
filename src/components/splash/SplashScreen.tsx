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
        <img className="splash-screen__icon" src="/app-icon.svg" alt="" />
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
