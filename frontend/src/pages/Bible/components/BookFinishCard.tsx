import { useMemo } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { useBookReadingProgress } from '../../../hooks/useBibleReading'
import './BookFinishCard.css'

/**
 * 책 마지막 장 끝 — "한 권 완주" 카드 (bfin- 접두사).
 * 장 끝 도장 바로 아래에서 책 단위 성취를 보여 주고, 다음 책 이어 읽기 / 성경 목록으로 길을 연다.
 * 마지막 장 끝에서 › 가 꺼져 막다른 길이던 자리를 대신한다.
 */

// 장 구슬로 보여 줄 최대 장 수 — 넘으면(시편·이사야 등) 진행 막대로 바꾼다
const MAX_BEADS = 50
const RING_R = 26
const RING_C = 2 * Math.PI * RING_R

/** 목적격 조사 — 받침 있으면 '을'(요한복음을), 없으면 '를'(창세기를) */
const eulReul = (word: string) => {
  const last = word.charCodeAt(word.length - 1)
  if (last < 0xac00 || last > 0xd7a3) return '를'
  return (last - 0xac00) % 28 === 0 ? '를' : '을'
}

interface NextBook {
  name: string
  chapterCount: number
  testament: 'OLD' | 'NEW'
}

interface Props {
  bookId: number
  bookName: string
  totalChapters: number
  currentChapter: number
  /** 지금 장을 다 읽었는지 — 서버 책 진행률보다 최신이라 덮어쓴다. null = 모름(비로그인) */
  currentChapterDone: boolean | null
  nextBook: NextBook | null
  onNextBook: () => void
  onPickBook: () => void
  onChapterChange: (chapter: number) => void
}

const BookFinishCard = ({
  bookId,
  bookName,
  totalChapters,
  currentChapter,
  currentChapterDone,
  nextBook,
  onNextBook,
  onPickBook,
  onChapterChange,
}: Props) => {
  const { isLoggedIn } = useAuth()
  const loggedIn = isLoggedIn()
  const { data: bookProgress } = useBookReadingProgress(bookId, loggedIn)

  const doneSet = useMemo(() => {
    const set = new Set<number>()
    bookProgress?.chapters?.forEach(c => {
      if (c.completed) set.add(c.chapter)
    })
    if (currentChapterDone === true) set.add(currentChapter)
    if (currentChapterDone === false) set.delete(currentChapter)
    return set
  }, [bookProgress, currentChapter, currentChapterDone])

  const hasProgress = loggedIn && !!bookProgress
  const done = doneSet.size
  const complete = hasProgress && done >= totalChapters
  const firstUnread = useMemo(() => {
    for (let ch = 1; ch <= totalChapters; ch++) if (!doneSet.has(ch)) return ch
    return null
  }, [doneSet, totalChapters])

  const title = complete
    ? `${bookName}${eulReul(bookName)} 다 읽었어요`
    : `${bookName} 마지막 장까지 왔어요`
  const sub = !hasProgress
    ? `총 ${totalChapters}장 · 마지막 장이에요`
    : complete
      ? `${totalChapters}장 모두 읽음 · 한 권을 마쳤어요`
      : `${totalChapters}장 중 ${done}장 읽음`

  return (
    <section className={`bfin${complete ? ' bfin--complete' : ''}`} aria-label={title}>
      <div className="bfin__head">
        {hasProgress && (
          <div className="bfin__ring" aria-hidden>
            <svg viewBox="0 0 64 64">
              <circle className="bfin__ring-track" cx="32" cy="32" r={RING_R} />
              <circle
                className="bfin__ring-fill"
                cx="32"
                cy="32"
                r={RING_R}
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * (1 - Math.min(1, done / totalChapters))}
              />
            </svg>
            {complete ? (
              <svg className="bfin__ring-check" viewBox="0 0 24 24">
                <path d="M5 12.5l4.2 4.2L19 7" />
              </svg>
            ) : (
              <span className="bfin__ring-num">
                {done}
                <small>/{totalChapters}</small>
              </span>
            )}
          </div>
        )}
        <div className="bfin__titles">
          <span className="bfin__eyebrow">{complete ? '한 권 완주' : '책의 끝'}</span>
          <h3 className="bfin__title">{title}</h3>
          <p className="bfin__sub">{sub}</p>
        </div>
      </div>

      {/* 장 구슬 — 안 읽은 장을 누르면 그 장으로 바로 간다 */}
      {hasProgress && !complete && (
        totalChapters <= MAX_BEADS ? (
          <div className="bfin__beads" role="list">
            {Array.from({ length: totalChapters }, (_, i) => i + 1).map(ch => {
              const read = doneSet.has(ch)
              return (
                <button
                  key={ch}
                  type="button"
                  role="listitem"
                  className={`bfin__bead${read ? ' is-read' : ''}${ch === currentChapter ? ' is-here' : ''}`}
                  onClick={() => onChapterChange(ch)}
                  aria-label={`${ch}장 ${read ? '읽음' : '안 읽음'}`}
                >
                  {ch}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="bfin__bar" aria-hidden>
            <i style={{ width: `${(done / totalChapters) * 100}%` }} />
          </div>
        )
      )}

      {hasProgress && !complete && firstUnread !== null && (
        <button type="button" className="bfin__fill-gap" onClick={() => onChapterChange(firstUnread)}>
          안 읽은 {firstUnread}장부터 채우기
        </button>
      )}

      <div className="bfin__actions">
        {nextBook && (
          <button type="button" className="bfin__next" onClick={onNextBook}>
            <span className="bfin__next-text">
              <span className="bfin__next-kicker">이어서 읽기</span>
              <span className="bfin__next-name">{nextBook.name} 1장</span>
              <span className="bfin__next-meta">
                {nextBook.testament === 'NEW' ? '신약' : '구약'} · {nextBook.chapterCount}장
              </span>
            </span>
            <span className="bfin__next-arrow" aria-hidden>
              <svg viewBox="0 0 24 24">
                <path d="M5 12h13M13 6l6 6-6 6" />
              </svg>
            </span>
          </button>
        )}
        <button
          type="button"
          className={`bfin__list${nextBook ? '' : ' bfin__list--solo'}`}
          onClick={onPickBook}
        >
          <svg viewBox="0 0 24 24" aria-hidden>
            <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" />
            <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" />
            <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" />
            <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" />
          </svg>
          {nextBook ? '다른 책 고르기' : '성경 목록으로'}
        </button>
      </div>
    </section>
  )
}

export default BookFinishCard
