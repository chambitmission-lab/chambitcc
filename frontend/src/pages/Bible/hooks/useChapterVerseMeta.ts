// 절마다 따로 묻지 않고 장 단위로 한 번에 받아 절별로 나눠 주는 부가 데이터 —
// 해석 유무·단어 노트·북마크·묵상 수. 절(VerseItem)은 "이 절" 것만 받고,
// 어떤 쿼리가 어떻게 폴백하는지는 여기서만 안다.
import { useMemo } from 'react'
import type { VerseBookmark } from '../../../api/bibleBookmark'
import type { WordNote } from '../../../api/bibleWordNote'
import { useChapterBookmarks } from '../../../hooks/useBibleBookmark'
import { useChapterCommentarySummaries, usePrefetchChapterCommentaries } from '../../../hooks/useBibleCommentary'
import { useChapterWordNotes, groupWordNotesByVerse } from '../../../hooks/useBibleWordNote'
import { useChapterReflectionSummary } from '../../../hooks/useReadingTogether'

export interface ChapterVerseMeta {
  /** 이 장에 해석이 하나라도 있는지 — 장 전체 해석 FAB·패널 청크 선로딩 조건 */
  hasCommentaries: boolean
  hasCommentaryAt: (verseNo: number) => boolean
  wordNotesOf: (verseId: number) => WordNote[] | undefined
  /**
   * 이 절의 북마크.
   * - undefined: 장 배치 조회가 실패(백엔드 미배포 404)해 절별 조회로 폴백해야 함
   * - null: 장 데이터는 있는데(또는 아직 로딩 중) 이 절엔 북마크 없음
   * 로딩 중까지 undefined 로 두면 첫 페이지 20절이 각자 북마크 요청을 쏘아 본문 응답과 경쟁한다.
   */
  bookmarkOf: (verseId: number) => VerseBookmark | null | undefined
  /** 함께 읽기 — 이 절에 남은 공개 묵상 수 */
  reflectionCountAt: (verseNo: number) => number
}

export const useChapterVerseMeta = (bookNumber: number, chapter: number, loggedIn: boolean): ChapterVerseMeta => {
  const chapterReady = bookNumber > 0 && chapter > 0

  // 해당 장의 해석 목록 (절별 indicator 표시용)
  const { data: chapterCommentaries } = useChapterCommentarySummaries(bookNumber, chapter, chapterReady)
  const hasCommentaries = (chapterCommentaries?.items.length ?? 0) > 0
  // 해석이 있는 장이면 패널 본문을 idle 에 미리 받아 둔다 — 누른 뒤에야
  // "청크 왕복 → API 왕복"이 직렬로 이어지던 지연 제거
  usePrefetchChapterCommentaries(bookNumber, chapter, hasCommentaries)
  const commentaryVerses = useMemo(() => {
    const set = new Set<number>()
    for (const c of chapterCommentaries?.items ?? []) {
      for (let v = c.verse_start; v <= c.verse_end; v++) set.add(v)
    }
    return set
  }, [chapterCommentaries])

  // 이 장의 내 단어 노트 전체 (절마다 개별 요청하지 않도록 배치 조회)
  const { data: chapterWordNotes } = useChapterWordNotes(bookNumber, chapter, loggedIn)
  const wordNotesByVerse = useMemo(() => groupWordNotesByVerse(chapterWordNotes), [chapterWordNotes])

  // 이 장의 내 북마크 전체 (절마다 개별 요청하던 N+1 제거 — 단어 노트와 동일 패턴)
  const { data: chapterBookmarks, isError: chapterBookmarksError } = useChapterBookmarks(bookNumber, chapter, loggedIn)
  const bookmarksByVerse = useMemo(() => {
    if (!chapterBookmarks) return null
    const map = new Map<number, VerseBookmark>()
    for (const b of chapterBookmarks) map.set(b.verse_id, b)
    return map
  }, [chapterBookmarks])

  // 함께 읽기 묵상 요약 — 본문을 기다리지 않고 바로 받는다. 본문과 같은 프레임에 그려져야
  // 묵상 칩이 뒤늦게 끼어들며 본문을 미는 일이 줄어든다 (장 진입 때 한 번, 이후엔 SSE 가 갱신)
  const { data: reflectionSummary } = useChapterReflectionSummary(bookNumber, chapter)

  return useMemo(
    () => ({
      hasCommentaries,
      hasCommentaryAt: (verseNo) => commentaryVerses.has(verseNo),
      wordNotesOf: (verseId) => wordNotesByVerse.get(verseId),
      bookmarkOf: (verseId) =>
        bookmarksByVerse ? (bookmarksByVerse.get(verseId) ?? null) : chapterBookmarksError ? undefined : null,
      reflectionCountAt: (verseNo) => reflectionSummary?.verse_counts[String(verseNo)] ?? 0,
    }),
    [hasCommentaries, commentaryVerses, wordNotesByVerse, bookmarksByVerse, chapterBookmarksError, reflectionSummary],
  )
}
