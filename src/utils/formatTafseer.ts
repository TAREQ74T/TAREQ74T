export interface TafseerBlock {
  kind: 'heading' | 'divider' | 'paragraph'
  text: string
}

const HEADING_PATTERN = /^(تسمية السورة|من مقاصد السورة)$/
const DIVIDER_PATTERN = /^\[[^\]]+\]$/

export function parseTafseerText(text: string): TafseerBlock[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)

  return paragraphs.map((paragraph) => {
    if (HEADING_PATTERN.test(paragraph)) {
      return { kind: 'heading', text: paragraph }
    }
    if (DIVIDER_PATTERN.test(paragraph)) {
      return { kind: 'divider', text: paragraph }
    }
    return { kind: 'paragraph', text: paragraph }
  })
}
