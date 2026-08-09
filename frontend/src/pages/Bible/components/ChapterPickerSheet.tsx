import { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useAuth } from '../../../hooks/useAuth'
import { useBookReadingProgress } from '../../../hooks/useBibleReading'
import { useMyBookmarks } from '../../../hooks/useBibleBookmark'
import { useModalBackButton } from '../../../hooks/useModalBackButton'

interface ChapterPickerSheetProps {
  bookNameKo: string
  /** BibleBook.id — 장별 읽기 진행도 조회용 */
  bookId: number
  /** 성경 권 번호(1~66) — 북마크 필터용 */
  bookNumber: number
  totalChapters: number
  currentChapter: number
  /** 이 책에서 마지막으로 펼쳤던 장 */
  resumeChapter?: number
  onPick: (chapter: number) => void
  onClose: () => void
}

/** 50장이 넘는 책(시편·이사야·예레미야)만 구간을 나눈다 — 그 아래는 한 화면 스크롤로 충분 */
const RANGE_SIZE = 50
const RANGE_THRESHOLD = 60

/**
 * 장 선택 바텀시트 — 네이티브 <select> 대체.
 *
 * 왜 바꿨나: OS 드롭다운은 (1) 앱 테마를 벗어난 회색 팝업으로 뜨고, (2) 150장짜리
 * 시편에서는 끝없는 목록을 굴려야 하며, (3) "어디까지 읽었는지"를 하나도 못 준다.
 * 통독 진행이 앱의 중심인데 정작 장을 고르는 순간에는 그 맥락이 사라졌다.
 *
 * 대신 검색 탭이 이미 쓰고 있는 장 그리드 문법(5열 = 두 줄이 정확히 10장,
 * 완독 ✓ · 읽는 중 하단바 · 밑줄/메모 점)을 그대로 시트에 옮겨,
 * 책 격자의 "도장 통독표"가 장 단위로 이어지게 만든다.
 */
const ChapterPickerSheet = ({
  bookNameKo,
  bookId,
  bookNumber,
  totalChapters,
  currentChapter,
  resumeChapter,
  onPick,
  onClose,
}: ChapterPickerSheetProps) => {
  const { language } = useLanguage()
  const { isLoggedIn } = useAuth()
  const loggedIn = isLoggedIn()
  useModalBackButton(onClose)

  const { data: bookProgress } = useBookReadingProgress(bookId, loggedIn && bookId > 0)
  const { data: bookmarks } = useMyBookmarks({ book_number: bookNumber, page_size: 100 }, loggedIn)

  const t =
    language === 'ko'
      ? {
          title: (name: string) => `${name} 장 선택`,
          close: '닫기',
          totalOnly: (total: number) => `총 ${total}장`,
          progress: (done: number, total: number) => `${total}장 중 ${done}장 읽음`,
          resume: (ch: number) => `이어읽기 ${ch}장`,
          first: '처음',
          last: '마지막',
          range: (from: number, to: number) => `${from}–${to}장`,
          read: '읽음',
          reading: '읽는 중',
          marked: '밑줄·메모',
          now: '지금',
          cell: (ch: number) => `${ch}장`,
          readSuffix: ' · 읽음',
          currentSuffix: ' · 지금 보는 장',
        }
      : {
          title: (name: string) => `${name} — select chapter`,
          close: 'Close',
          totalOnly: (total: number) => `${total} chapters`,
          progress: (done: number, total: number) => `${done} of ${total} chapters read`,
          resume: (ch: number) => `Resume ch. ${ch}`,
          first: 'First',
          last: 'Last',
          range: (from: number, to: number) => `${from}–${to}`,
          read: 'Read',
          reading: 'Reading',
          marked: 'Notes',
          now: 'Now',
          cell: (ch: number) => `Chapter ${ch}`,
          readSuffix: ' · read',
          currentSuffix: ' · current',
        }

  // 장 번호 → 진행 상태
  const chapterInfo = useMemo(() => {
    const map = new Map<number, { completed: boolean; progress: number }>()
    bookProgress?.chapters?.forEach(c =>
      map.set(c.chapter, { completed: c.completed, progress: c.progress })
    )
    return map
  }, [bookProgress])

  const markedChapters = useMemo(() => {
    const set = new Set<number>()
    bookmarks?.items?.forEach(b => {
      if (b.book_number === bookNumber) set.add(b.chapter)
    })
    return set
  }, [bookmarks, bookNumber])

  const readCount = useMemo(
    () => Array.from(chapterInfo.values()).filter(c => c.completed).length,
    [chapterInfo]
  )
  const hasAnyMarker =
    readCount > 0 ||
    markedChapters.size > 0 ||
    Array.from(chapterInfo.values()).some(c => c.progress > 0)

  // 긴 책은 50장 구간으로 나눠 라벨을 달고, 상단 칩으로 그 구간까지 한 번에 내려간다
  const ranges = useMemo(() => {
    if (totalChapters <= RANGE_THRESHOLD) return [{ from: 1, to: totalChapters }]
    const list: { from: number; to: number }[] = []
    for (let from = 1; from <= totalChapters; from += RANGE_SIZE) {
      list.push({ from, to: Math.min(from + RANGE_SIZE - 1, totalChapters) })
    }
    return list
  }, [totalChapters])
  const isSplit = ranges.length > 1

  const bodyRef = useRef<HTMLDivElement | null>(null)
  const currentRef = useRef<HTMLButtonElement | null>(null)
  const rangeRefs = useRef<Map<number, HTMLDivElement | null>>(new Map())

  // 열자마자 지금 보는 장이 가운데 오도록 — 150장짜리 책에서도 현재 위치가 기준점이 된다
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center' })
  }, [])

  const scrollToRange = (from: number) => {
    rangeRefs.current.get(from)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return createPortal(
    <div className="chapter-sheet-backdrop" onClick={onClose}>
      <div
        className="chapter-sheet"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t.title(bookNameKo)}
      >
        <span className="chapter-sheet__grip" aria-hidden="true" />

        <div className="chapter-sheet__head">
          <div className="chapter-sheet__head-body">
            <h3 className="chapter-sheet__title">{bookNameKo}</h3>
            <p className="chapter-sheet__sub">
              {loggedIn && readCount > 0
                ? t.progress(readCount, totalChapters)
                : t.totalOnly(totalChapters)}
            </p>
          </div>
          <button
            type="button"
            className="chapter-sheet__close"
            onClick={onClose}
            aria-label={t.close}
          >
            <span className="material-icons-round">close</span>
          </button>
        </div>

        {/* 책 전체 진행 게이지 — 그리드의 ✓들이 합쳐 어디까지 왔는지 한 줄로 */}
        {loggedIn && readCount > 0 && (
          <span className="chapter-sheet__track" aria-hidden="true">
            <span
              className="chapter-sheet__fill"
              style={{ width: `${Math.min(100, (readCount / totalChapters) * 100)}%` }}
            />
          </span>
        )}

        {/* 빠른 이동 — 그리드를 훑기 전에 가장 자주 쓰는 세 지점 */}
        <div className="chapter-sheet__jump">
          {resumeChapter && resumeChapter !== currentChapter && (
            <button
              type="button"
              className="chapter-jump chapter-jump--resume"
              onClick={() => onPick(resumeChapter)}
            >
              <span className="material-icons-round">bookmark</span>
              {t.resume(resumeChapter)}
            </button>
          )}
          <button type="button" className="chapter-jump" onClick={() => onPick(1)}>
            {t.first}
          </button>
          <button type="button" className="chapter-jump" onClick={() => onPick(totalChapters)}>
            {t.last}
          </button>
          {isSplit &&
            ranges.map(r => (
              <button
                key={r.from}
                type="button"
                className="chapter-jump"
                onClick={() => scrollToRange(r.from)}
              >
                {t.range(r.from, r.to)}
              </button>
            ))}
        </div>

        <div className="chapter-sheet__body" ref={bodyRef}>
          {ranges.map(r => (
            <div
              key={r.from}
              className="chapter-range"
              ref={el => {
                rangeRefs.current.set(r.from, el)
              }}
            >
              {isSplit && <p className="chapter-range__label">{t.range(r.from, r.to)}</p>}
              <div className="chapter-sheet__grid">
                {Array.from({ length: r.to - r.from + 1 }, (_, i) => r.from + i).map(ch => {
                  const info = chapterInfo.get(ch)
                  const completed = !!info?.completed
                  const partial = !completed && (info?.progress ?? 0) > 0
                  const marked = markedChapters.has(ch)
                  const isCurrent = ch === currentChapter
                  const isResume = !isCurrent && ch === resumeChapter
                  return (
                    <button
                      key={ch}
                      type="button"
                      ref={isCurrent ? currentRef : undefined}
                      className={`ch-cell${completed ? ' is-read' : ''}${
                        isCurrent ? ' is-current' : ''
                      }${isResume ? ' is-resume' : ''}`}
                      aria-current={isCurrent ? 'true' : undefined}
                      aria-label={`${t.cell(ch)}${completed ? t.readSuffix : ''}${
                        isCurrent ? t.currentSuffix : ''
                      }`}
                      onClick={() => onPick(ch)}
                    >
                      <span className="ch-cell__num">{ch}</span>
                      {completed && !isCurrent && (
                        <span className="material-icons-round ch-cell__check" aria-hidden="true">
                          check
                        </span>
                      )}
                      {partial && (
                        // 최소 25% — 조금만 읽은 장도 "읽는 중"임이 한눈에 보이게
                        <span
                          className="ch-cell__bar"
                          style={{ width: `${Math.max(25, info!.progress)}%` }}
                          aria-hidden="true"
                        />
                      )}
                      {marked && <span className="ch-cell__dot" aria-hidden="true" />}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {loggedIn && hasAnyMarker && (
          <div className="chapter-sheet__legend" aria-hidden="true">
            <span className="chapter-sheet__legend-item">
              <span className="material-icons-round chapter-sheet__legend-check">check</span>
              {t.read}
            </span>
            <span className="chapter-sheet__legend-item">
              <span className="chapter-sheet__legend-bar" />
              {t.reading}
            </span>
            <span className="chapter-sheet__legend-item">
              <span className="chapter-sheet__legend-dot" />
              {t.marked}
            </span>
            <span className="chapter-sheet__legend-item">
              <span className="chapter-sheet__legend-now" />
              {t.now}
            </span>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export default ChapterPickerSheet
