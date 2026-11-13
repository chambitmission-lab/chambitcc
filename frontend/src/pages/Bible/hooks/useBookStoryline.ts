import { useEffect, useState } from 'react'
import { hasBookStoryline, loadBookStoryline, peekBookStoryline, type BookStoryline } from '../data/bookStorylines'

/** 책 줄거리 로드 — 캐시에 있으면 첫 렌더부터 바로 준다(장 이동 때 깜빡임 없음) */
export const useBookStoryline = (bookNumber: number) => {
  const [loadedFor, setLoadedFor] = useState<{ book: number; story: BookStoryline | null } | null>(null)
  const available = hasBookStoryline(bookNumber)

  useEffect(() => {
    if (!available || peekBookStoryline(bookNumber)) return
    let alive = true
    loadBookStoryline(bookNumber).then((story) => {
      if (alive) setLoadedFor({ book: bookNumber, story })
    })
    return () => {
      alive = false
    }
  }, [bookNumber, available])

  const story = peekBookStoryline(bookNumber) ?? (loadedFor?.book === bookNumber ? loadedFor.story : null)
  return { story, pending: available && !story }
}
