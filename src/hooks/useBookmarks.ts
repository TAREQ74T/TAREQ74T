import { useCallback, useEffect, useState } from 'react'

export interface Bookmark {
  surahNumber: number
  ayahNumber: number
  timestamp: number
}

const STORAGE_KEY = 'mushaf-al-huda:bookmarks'

function readBookmarks(): Bookmark[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter(
      (item): item is Bookmark =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Bookmark).surahNumber === 'number' &&
        typeof (item as Bookmark).ayahNumber === 'number' &&
        typeof (item as Bookmark).timestamp === 'number',
    )
  } catch {
    return []
  }
}

export interface UseBookmarksResult {
  bookmarks: Bookmark[]
  isBookmarked: (surahNumber: number, ayahNumber: number) => boolean
  toggleBookmark: (surahNumber: number, ayahNumber: number) => void
  removeBookmark: (index: number) => void
  clearBookmarks: () => void
}

export function useBookmarks(): UseBookmarksResult {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(readBookmarks)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
    } catch {
      // تجاهل أخطاء التخزين المحلي
    }
  }, [bookmarks])

  const isBookmarked = useCallback(
    (surahNumber: number, ayahNumber: number): boolean =>
      bookmarks.some(
        (item) => item.surahNumber === surahNumber && item.ayahNumber === ayahNumber,
      ),
    [bookmarks],
  )

  const toggleBookmark = useCallback((surahNumber: number, ayahNumber: number) => {
    setBookmarks((previous) => {
      const exists = previous.some(
        (item) => item.surahNumber === surahNumber && item.ayahNumber === ayahNumber,
      )
      if (exists) {
        return previous.filter(
          (item) => !(item.surahNumber === surahNumber && item.ayahNumber === ayahNumber),
        )
      }
      return [...previous, { surahNumber, ayahNumber, timestamp: Date.now() }]
    })
  }, [])

  const removeBookmark = useCallback((index: number) => {
    setBookmarks((previous) => previous.filter((_, i) => i !== index))
  }, [])

  const clearBookmarks = useCallback(() => {
    setBookmarks([])
  }, [])

  return { bookmarks, isBookmarked, toggleBookmark, removeBookmark, clearBookmarks }
}
