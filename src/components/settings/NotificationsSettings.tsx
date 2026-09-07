import type { UseNotificationsResult } from '../../hooks/useNotifications'
import type { PrayerReminderKind } from '../../utils/notifications'

const REMINDER_KINDS: { value: PrayerReminderKind; label: string }[] = [
  { value: 'approaching', label: 'اقتراب الوقت' },
  { value: 'entered', label: 'دخول الوقت' },
  { value: 'both', label: 'كلاهما' },
]

interface NotificationsSettingsProps {
  notifications: UseNotificationsResult
}

/** إعدادات إشعارات المرحلة (المنصة) — Web Notifications API فقط. */
export function NotificationsSettings({ notifications }: NotificationsSettingsProps) {
  const {
    prefs,
    permission,
    toggleVerseOfDay,
    togglePrayerReminder,
    setReminderKind,
    requestPermission,
  } = notifications

  if (permission === 'unsupported') {
    return (
      <section className="setting-group" data-testid="notifications-section">
        <h3 className="setting-group__title">الإشعارات</h3>
        <p className="progress-info">
          متصفحك لا يدعم إشعارات الويب (Web Notifications). ستتوفر الإشعارات في تطبيق
          الهاتف لاحقاً.
        </p>
      </section>
    )
  }

  return (
    <section className="setting-group" data-testid="notifications-section">
      <h3 className="setting-group__title">الإشعارات</h3>

      <div className="notif-row">
        <span className="notif-row__label">
          آية اليوم
          <small>رسالة يومية بآية مختصرة من المصحف</small>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={prefs.verseOfDayEnabled}
          aria-label="تفعيل آية اليوم"
          data-testid="notify-verse-switch"
          className={`switch${prefs.verseOfDayEnabled ? ' is-on' : ''}`}
          onClick={() => void toggleVerseOfDay()}
        >
          <span className="switch__thumb" />
        </button>
      </div>

      <div className="notif-row">
        <span className="notif-row__label">
          تذكير الصلاة
          <small>تنبيه باقتراب وقت الصلاة أو دخوله</small>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={prefs.prayerReminderEnabled}
          aria-label="تفعيل تذكير الصلاة"
          data-testid="notify-prayer-switch"
          className={`switch${prefs.prayerReminderEnabled ? ' is-on' : ''}`}
          onClick={() => void togglePrayerReminder()}
        >
          <span className="switch__thumb" />
        </button>
      </div>

      {prefs.prayerReminderEnabled && (
        <div
          className="notif-kind-options"
          role="radiogroup"
          aria-label="نوع تذكير الصلاة"
        >
          {REMINDER_KINDS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={prefs.prayerReminderKind === option.value}
              data-testid={`notification-kind-${option.value}`}
              className={
                prefs.prayerReminderKind === option.value
                  ? 'theme-option is-active'
                  : 'theme-option'
              }
              onClick={() => setReminderKind(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      <p className="progress-info" data-testid="notification-permission-status">
        {permission === 'granted'
          ? 'الإذن ممنوح — سيتم إرسال الإشعارات عبر خدمة المتصفح.'
          : permission === 'denied'
            ? 'إذن الإشعارات مرفوض من المتصفح. فعّله من إعدادات الموقع لإعادة المحاولة.'
            : 'الإشعارات بحاجة إلى إذن من المتصفح لتظهر لك.'}
      </p>

      {permission !== 'granted' && (
        <button
          type="button"
          className="btn"
          data-testid="enable-notifications"
          onClick={() => void requestPermission()}
        >
          تفعيل الإشعارات
        </button>
      )}

      <p className="progress-info notif-note">
        هذه الإشعارات ويب فقط في هذه المرحلة؛ تُسلم والصفحة مفتوحة أو في الخلفية.
        يومياً: آية واحدة، وتذكير واحد لكل حدث صلاة، ضمن ساعات الاستيقاظ.
      </p>
    </section>
  )
}
