import { useEffect, useRef, useState } from 'react'
import { Markdown } from '../../utils/markdown'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { getBookGenre, genreStyle, parseBookStructure } from './bookGenre'
import type { BibleBookIntro } from '../../types/bibleBookIntro'

interface BookIntroSheetProps {
  intro: BibleBookIntro
  bookNameKo: string
  totalChapters: number
  /** 지금 읽고 있는 장 — 구조 타임라인에서 '현재 위치'로 표시한다 */
  currentChapter: number
  /** 구조 단락을 탭했을 때 그 장으로 이동. 없으면 단락은 읽기 전용 */
  onJumpToChapter?: (chapter: number) => void
  admin?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onClose: () => void
}

/**
 * 권 개관 읽기 시트.
 *
 * 읽기 화면 안에 큰 카드로 눌러앉는 대신, 슬림 바를 탭했을 때만 열리는
 * 별도 지면으로 분리했다. 성경 본문이 먼저 보이고, 소개는 "읽고 싶을 때"
 * 넉넉한 타이포로 읽는 콘텐츠가 된다.
 *
 * 읽힘을 만드는 규칙:
 *  - 본문에 색을 쓰지 않는다 (금빛 볼드 대신 emphasis="plain")
 *  - 색은 장르 액센트 하나로 통일하고, 아이브로우/구조 막대/규칙선에만 얹는다
 *  - 메타(주제·저자·핵심 장)는 칩이 아니라 라벨-값 행 — 문장이 pill 안에서 갇히지 않게
 */
const BookIntroSheet = ({
  intro,
  bookNameKo,
  totalChapters,
  currentChapter,
  onJumpToChapter,
  admin,
  onEdit,
  onDelete,
  onClose,
}: BookIntroSheetProps) => {
  const genre = getBookGenre(intro.book_number)
  const sections = parseBookStructure(intro.structure, totalChapters)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useModalBackButton(onClose)

  // 시트가 열린 동안 뒤 화면(성경 본문)이 같이 스크롤되지 않게 잠근다
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const handleJump = (chapter: number) => {
    if (!onJumpToChapter) return
    onJumpToChapter(chapter)
    onClose()
  }

  const metaRows = [
    { label: '주제', value: intro.theme },
    { label: '저자 · 시대', value: intro.author_period },
    { label: '핵심 장', value: intro.key_chapters },
  ].filter((row) => !!row.value?.trim())

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/55 backdrop-blur-[2px] flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full sm:max-w-[560px] bg-surface-container rounded-t-[28px] sm:rounded-[28px] overflow-hidden border-t sm:border border-[var(--card-border)] shadow-[0_-16px_48px_rgba(0,0,0,0.35)] flex flex-col"
        style={{ ...genreStyle(intro.book_number), maxHeight: 'calc(var(--vvh, 100dvh) * 0.92)' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${bookNameKo} 책 소개`}
      >
        {/* 그래버 + 스크롤 시 나타나는 미니 헤더 — 어느 책을 읽는 중인지 잃지 않게 */}
        <div className="relative shrink-0 pt-2.5 pb-1">
          <div className="mx-auto w-9 h-1 rounded-full bg-[var(--text-muted)]/40" />
          <div
            className={`flex items-center gap-2 px-5 h-9 transition-opacity duration-200 ${
              scrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <span
              className="material-icons-round text-[17px]"
              style={{ color: 'var(--genre)' }}
            >
              {genre.icon}
            </span>
            <p className="text-[14px] font-bold text-ink-strong truncate">{bookNameKo}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center text-ink-muted hover:bg-[var(--surface-inset)] transition-colors"
          >
            <span className="material-icons-round text-[20px]">close</span>
          </button>
        </div>

        <div
          ref={scrollRef}
          onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 24)}
          className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6"
        >
          {/* 표제 */}
          <p
            className="text-[11.5px] font-bold tracking-[0.14em]"
            style={{ color: 'var(--genre)' }}
          >
            {genre.label}
          </p>
          <h2 className="mt-1 text-[27px] font-bold tracking-[-0.03em] leading-[1.2] text-ink-strong">
            {bookNameKo}
          </h2>
          <p className="mt-1.5 text-[15.5px] leading-[1.55] text-ink">{intro.one_liner}</p>

          {/* 책의 흐름 — 장 범위 막대 + 단락 목록. 탭하면 그 장으로 이동한다 */}
          {sections.length > 0 && totalChapters > 0 && (
            <section className="mt-6">
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-[12.5px] font-bold text-ink-strong">책의 흐름</p>
                <p className="text-[11.5px] text-ink-muted tabular-nums">전체 {totalChapters}장</p>
              </div>

              <div className="flex gap-[3px] h-2.5" aria-hidden="true">
                {sections.map((s, i) => {
                  const isCurrent = currentChapter >= s.from && currentChapter <= s.to
                  return (
                    <div
                      key={`bar-${s.from}-${i}`}
                      className="rounded-full transition-opacity"
                      style={{
                        flexGrow: s.to - s.from + 1,
                        background: 'var(--genre)',
                        opacity: isCurrent ? 1 : 0.28,
                      }}
                    />
                  )
                })}
              </div>

              <ul className="mt-2.5 -mx-2">
                {sections.map((s, i) => {
                  const isCurrent = currentChapter >= s.from && currentChapter <= s.to
                  const range = s.from === s.to ? `${s.from}장` : `${s.from}–${s.to}장`
                  return (
                    <li key={`row-${s.from}-${i}`}>
                      <button
                        type="button"
                        onClick={() => handleJump(s.from)}
                        disabled={!onJumpToChapter}
                        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-left transition-colors enabled:hover:bg-[var(--surface-inset)] disabled:cursor-default"
                      >
                        <span
                          className="shrink-0 w-[68px] text-[12px] font-bold tabular-nums"
                          style={{ color: isCurrent ? 'var(--genre)' : 'var(--text-muted)' }}
                        >
                          {range}
                        </span>
                        <span
                          className={`min-w-0 flex-1 text-[14px] leading-snug ${
                            isCurrent ? 'font-bold text-ink-strong' : 'text-ink'
                          }`}
                        >
                          {s.label}
                        </span>
                        {isCurrent && (
                          <span
                            className="shrink-0 text-[10.5px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--genre-soft)', color: 'var(--genre)' }}
                          >
                            지금 여기
                          </span>
                        )}
                        {onJumpToChapter && (
                          <span className="material-icons-round text-[18px] text-ink-muted shrink-0">
                            chevron_right
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {/* 메타 — 칩이 아니라 라벨-값 행이라 긴 문장도 자연스럽게 줄바꿈된다 */}
          {metaRows.length > 0 && (
            <dl className="mt-6 space-y-2.5">
              {metaRows.map((row) => (
                <div key={row.label} className="flex gap-3">
                  <dt className="shrink-0 w-[62px] pt-[1px] text-[12px] font-semibold text-ink-muted">
                    {row.label}
                  </dt>
                  <dd className="min-w-0 flex-1 text-[14px] leading-[1.6] text-ink">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <hr className="my-6 border-0 h-px bg-[var(--genre-line)]" />

          {/* 개관 본문 — 색 없이 크기·행간으로만 읽힘을 만든다 */}
          <div className="book-intro-prose text-[15.5px] leading-[1.85] text-ink">
            <Markdown source={intro.overview} emphasis="plain" />
          </div>

          {intro.christ_connection && (
            <section
              className="mt-6 rounded-2xl px-4 py-3.5 border-l-[3px]"
              style={{
                background: 'var(--genre-soft)',
                borderLeftColor: 'var(--genre)',
              }}
            >
              <p
                className="flex items-center gap-1.5 text-[12px] font-bold mb-1.5"
                style={{ color: 'var(--genre)' }}
              >
                <span className="material-icons-round text-[16px]">auto_awesome</span>
                그리스도와의 연결
              </p>
              <div className="book-intro-prose text-[14.5px] leading-[1.8] text-ink">
                <Markdown source={intro.christ_connection} emphasis="plain" />
              </div>
            </section>
          )}

          {admin && (
            <div className="flex gap-1.5 justify-end mt-7 pt-4 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1 px-3 h-9 rounded-full text-[12.5px] font-bold bg-[var(--brand-soft)] text-brand border border-[var(--brand-soft-strong)] hover:bg-[var(--brand-soft-strong)] transition-colors"
              >
                <span className="material-icons-round text-[15px]">edit</span>
                수정
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1 px-3 h-9 rounded-full text-[12.5px] font-bold bg-red-500/8 dark:bg-red-500/10 text-red-600 dark:text-red-300 border border-red-500/20 dark:border-red-400/30 hover:bg-red-500/15 transition-colors"
              >
                <span className="material-icons-round text-[15px]">delete_outline</span>
                삭제
              </button>
            </div>
          )}
        </div>

        {/* 푸터 — 소개를 다 읽었으면 바로 본문으로 */}
        <div className="shrink-0 px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-[var(--card-border)] bg-surface-container">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-2xl bg-brand text-white text-[15px] font-bold active:scale-[0.99] transition-transform"
          >
            {bookNameKo} {currentChapter}장 읽기
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookIntroSheet
