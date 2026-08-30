const HARAKAT =
  /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED\u08F0-\u08FF]/g

const ALEF_VARIANTS = /[\u0623\u0625\u0671\u0622]/g
const YEH_VARIANTS = /[\u0649\u0626]/g
const TEH_MARBUTA = /\u0629/g

export function normalizeArabic(text: string): string {
  return text
    .replace(HARAKAT, '')
    .replace(ALEF_VARIANTS, '\u0627')
    .replace(YEH_VARIANTS, '\u064A')
    .replace(TEH_MARBUTA, '\u0647')
    .replace(/\s+/g, ' ')
    .trim()
}
