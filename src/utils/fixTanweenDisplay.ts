function mapTanween(text: string): string {
  return text
    .replace(/\u08F0 \u0627/g, '\u0627\u064B')
    .replace(/\u08F0 \u0649/g, '\u0649\u064B')
    .replace(/\u08F0/g, '\u064B')
    .replace(/\u08F1/g, '\u064C')
    .replace(/\u08F2/g, '\u064D')
    .replace(/\u0656/g, '\u0650')
    .replace(/\u0657/g, '\u064B')
    .replace(/\u065E/g, '\u064C')
}

export function fixTanweenDisplay(text: string): string {
  return mapTanween(text)
}
