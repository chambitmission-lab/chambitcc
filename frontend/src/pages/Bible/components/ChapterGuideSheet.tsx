import { createPortal } from 'react-dom'
import { genreStyle } from '../../../components/bible/bookGenre'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { SheetGrabber } from '../../../components/common/SheetGrabber'
import type { ChapterBrief } from '../data/chapterBriefs'
import type { ChapterKeyword } from '../data/chapterKeywords'
import { actIndexOf, type BookStoryline } from '../data/bookStorylines'
import { BookStoryMap } from './BookStory'
import './ChapterGuideSheet.css'

/** 보조사 — 받침 있으면 '은'(시편은), 없으면 '는'(창세기는) */
const eunNeun = (word: string) => {
  const last = word.charCodeAt(word.length - 1)
  if (last < 0xac00 || last > 0xd7a3) return '는'
  return (last - 0xac00) % 28 === 0 ? '는' : '은'
}

interface ChapterGuideSheetProps {
  bookNumber: number
  bookName: string
  chapter: number
  brief: ChapterBrief | null
  labels: readonly [string, string, string] | null
  catchUpLines: { chapter: number; text: string }[]
  keywords: ChapterKeyword[]
  activeKeyword: ChapterKeyword | null
  story: BookStoryline | null
  /** 권 개관 한 줄 소개 — 있으면 시트 맨 위에 "창세기는 어떤 책인가요?" 입구 */
  introOneLiner: string | null
  onOpenIntro: () => void
  onPickKeyword: (kw: ChapterKeyword) => void
  onJumpToChapter: (chapter: number) => void
  onClose: () => void
}

/**
 * 이 장 길잡이 시트 (cgs-) — 장 머리말의 '길잡이' 버튼 하나 뒤에 모은 읽기 도움.
 * Kindle X-Ray·Logos Passage Guide 처럼 본문 위엔 제목 한 줄만 두고, 도움은 원할 때만.
 * 모바일은 바텀시트, PC(lg+)는 오른쪽 서랍.
 *   권 개관 입구 → 지난 이야기(오랜만일 때) → 지금까지·이 장에서·눈여겨보기 → 열쇠말 → 책 줄거리 지도
 */
const ChapterGuideSheet = ({
  bookNumber,
  bookName,
  chapter,
  brief,
  labels,
  catchUpLines,
  keywords,
  activeKeyword,
  story,
  introOneLiner,
  onOpenIntro,
  onPickKeyword,
  onJumpToChapter,
  onClose,
}: ChapterGuideSheetProps) => {
  useModalBackButton(onClose)

  const nowIdx = story ? actIndexOf(story.acts, chapter) : -1
  const unit = story?.unit ?? '막'
  const rows =
    brief && labels
      ? [
          { label: labels[0], text: brief.recap },
          { label: labels[1], text: brief.now },
          { label: labels[2], text: brief.watch },
        ]
      : []

  return createPortal(
    <div className="cgs-backdrop sheet-backdrop" onClick={onClose}>
      <aside
        className="cgs sheet-rise bg-background-light dark:bg-card-dark"
        data-sheet-root
        style={genreStyle(bookNumber)}
        role="dialog"
        aria-modal="true"
        aria-label={`${bookName} ${chapter}장 길잡이`}
        onClick={(e) => e.stopPropagation()}
      >
        <SheetGrabber
          onClose={onClose}
          className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/15 absolute left-1/2 -translate-x-1/2 top-2 lg:hidden"
        />
        <header className="cgs-head">
          <div className="min-w-0">
            <p className="cgs-kicker">이 장 길잡이</p>
            <h2 className="cgs-title">
              {bookName} {chapter}장
            </h2>
          </div>
          <button type="button" className="cgs-close" onClick={onClose} aria-label="닫기">
            <span className="material-icons-round" aria-hidden>close</span>
          </button>
        </header>

        <div className="cgs-body">
          {introOneLiner && (
            <button type="button" className="cgs-intro" onClick={onOpenIntro} aria-haspopup="dialog">
              <span className="material-icons-round cgs-intro__icon" aria-hidden>menu_book</span>
              <span className="cgs-intro__body">
                <b>
                  {bookName}
                  {eunNeun(bookName)} 어떤 책인가요?
                </b>
                <span>{introOneLiner}</span>
              </span>
              <span className="material-icons-round cgs-intro__chev" aria-hidden>chevron_right</span>
            </button>
          )}

          {catchUpLines.length > 0 && (
            <section className="cgs-catchup">
              <p className="cgs-label">오랜만이에요 · 지난 이야기</p>
              {catchUpLines.map(({ chapter: c, text }) => (
                <p key={c} className="cgs-text">
                  <b className="cgs-catchup__ch">{c}장</b>
                  {text}
                </p>
              ))}
            </section>
          )}

          {rows.map(({ label, text }) => (
            <section key={label}>
              <p className="cgs-label">{label}</p>
              <p className="cgs-text">{text}</p>
            </section>
          ))}

          {/* 이 장의 열쇠말 — 탭하면 뜻풀이 시트, 시트에서 본문 밝히기 */}
          {keywords.length > 0 && (
            <section>
              <p className="cgs-label">열쇠말 · 이 장에 자주 나오는 말</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {keywords.map((kw) => (
                  <button
                    key={kw.word}
                    type="button"
                    onClick={() => onPickKeyword(kw)}
                    aria-pressed={activeKeyword === kw}
                    className={`keyword-chip${activeKeyword === kw ? ' is-on' : ''}`}
                  >
                    <span className="material-icons-round text-[14px] keyword-chip-icon">key</span>
                    <span className="font-bold break-keep">{kw.word}</span>
                    <span className="keyword-chip-count">{kw.count}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {story && nowIdx >= 0 && (
            <section className="cgs-story">
              <p className="cgs-label">
                {bookName} {story.label ?? '줄거리'}
                {story.acts.length > 1 && ` · ${story.acts.length}${unit} 중 ${nowIdx + 1}${unit}`}
              </p>
              <BookStoryMap
                story={story}
                chapter={chapter}
                onJump={(ch) => {
                  onClose()
                  if (ch !== chapter) onJumpToChapter(ch)
                }}
              />
            </section>
          )}
        </div>
      </aside>
    </div>,
    document.body
  )
}

export default ChapterGuideSheet
