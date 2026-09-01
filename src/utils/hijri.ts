export type HijriOffset = number // من -3 إلى +3

export function getAdjustedHijriDate(base: Date, offset: HijriOffset): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + offset)
  return d
}

const HIJRI_FORMATTER = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const HIJRI_SHORT_FORMATTER = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatHijriDate(date: Date): string {
  return HIJRI_FORMATTER.format(date)
}

export function formatHijriDateShort(date: Date): string {
  return HIJRI_SHORT_FORMATTER.format(date)
}

export function isHijriCalendarSupported(): boolean {
  try {
    void new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
    }).format(new Date())
    return true
  } catch {
    return false
  }
}

export function hijriOffsetLabel(offset: HijriOffset): string {
  if (offset === 0) {
    return ''
  }
  if (offset > 0) {
    return `+${offset} يوم`
  }
  return `${offset} يوم`
}
