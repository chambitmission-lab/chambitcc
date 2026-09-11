import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDailyVerse } from '../../../hooks/useDailyVerse'
import SideDigestRow from './SideDigestRow'
import './AnnualThemeVerse.css'

// "에스겔 37장 5,10절" → "에스겔 37:5,10" (형식이 다르면 원문 그대로)
const compactReference = (ref: string) =>
  ref.replace(/(\d+)\s*장\s*/, '$1:').replace(/\s*절$/, '')

// 핵심 어절 강조 — 마지막 어절(문장의 결론, "살아나리라!")에 금박 밑줄을 긋는다.
// 어절이 하나뿐이면 전체를 강조한다.
const splitHighlight = (text: string): { head: string; mark: string } => {
  const trimmed = text.trim()
  const idx = trimmed.lastIndexOf(' ')
  if (idx < 0) return { head: '', mark: trimmed }
  return { head: trimmed.slice(0, idx + 1), mark: trimmed.slice(idx + 1) }
}

// 접힌 상태는 기기에 기억한다 — 기도 목록을 보러 온 사람이 매번 다시 접지 않도록.
const OPEN_KEY = 'chambit.annualVerse.open'

const readOpen = (): boolean => {
  try {
    return localStorage.getItem(OPEN_KEY) !== 'false'
  } catch {
    return true
  }
}

type PreviewVerse = { verse_text: string; verse_reference: string }

/** card = 모바일 명판 카드(기본), row = PC 사이드바 압축 행(탭하면 아래로 펼침) */
type Variant = 'card' | 'row'

const AnnualThemeVerse = ({
  preview,
  variant = 'card',
}: {
  preview?: PreviewVerse
  variant?: Variant
}) => {
  const navigate = useNavigate()
  const query = useDailyVerse()
  const verse = preview ?? query.data
  const isLoading = preview ? false : query.isLoading
  const error = preview ? undefined : query.error

  // 압축 행은 접힌 상태로 시작한다 — PC 사이드 컬럼이 한 화면을 넘지 않아야
  // sticky 로 고정되기 때문. 펼침 여부도 기억하지 않는다(그 자리에서만 유효).
  const [open, setOpen] = useState(variant === 'row' ? false : readOpen)

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev
      if (variant === 'row') return next
      try {
        localStorage.setItem(OPEN_KEY, String(next))
      } catch {
        /* 사파리 프라이빗 모드 등 — 기억만 못 할 뿐 동작은 그대로 */
      }
      return next
    })
  }, [variant])

  if (error?.message === 'NOT_FOUND' || (!isLoading && !verse)) {
    return null
  }

  const ref = verse?.verse_reference ? compactReference(verse.verse_reference) : ''
  const full = verse?.verse_text?.trim() ?? ''
  const { head, mark } = full ? splitHighlight(full) : { head: '', mark: '' }
  const year = new Date().getFullYear()

  // 말씀 카드 만들기 — 이 구절을 미리 실어 사진 카드 화면으로 (인스타 스토리·카톡 공유 유도)
  const openVerseCard = () => {
    if (!full) return
    navigate('/bible/photo-verse', {
      state: { presetVerse: { text: full, refLabel: ref || '올해의 말씀' } },
    })
  }

  if (variant === 'row') {
    return (
      <div>
        <SideDigestRow
          icon={
            <svg width="12" height="12" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
              <path d="M5 0 L6.1 3.9 L10 5 L6.1 6.1 L5 10 L3.9 6.1 L0 5 L3.9 3.9 Z" />
            </svg>
          }
          label={`${year} 올해의 말씀`}
          sub={isLoading ? '' : full}
          accent="gold"
          expanded={open}
          onClick={toggle}
          ariaLabel={open ? '올해의 말씀 접기' : '올해의 말씀 펼치기'}
        />
        {open && !isLoading && full && (
          <div className="px-4 pb-4 -mt-1">
            <blockquote className="text-[14px] leading-[1.7] text-[var(--text-body)]">
              {head}
              <em className="not-italic font-bold text-ink-strong">{mark}</em>
            </blockquote>
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <span className="text-[12px] font-bold text-[var(--brand-muted)]">{ref}</span>
              <button
                type="button"
                onClick={openVerseCard}
                className="text-[12px] font-bold text-brand"
                aria-label="말씀 카드 만들어 공유하기"
              >
                말씀 카드
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <section className="annual-theme-section">
      {/* 명판(plaque) 문법: 금박 헤어라인 프레임 → 작은 자간 넓은 라벨 → 가운데 명조 → 금박 구분선 → 출처·공유 */}
      <figure className="verse-plate" data-open={open}>
        <span className="verse-plate__frame" aria-hidden />

        <button
          type="button"
          className="verse-plate__head"
          onClick={toggle}
          aria-expanded={open}
          aria-controls="annual-verse-body"
          aria-label={open ? '올해의 말씀 접기' : '올해의 말씀 펼치기'}
        >
          <span className="verse-plate__label">
            {year} 올해의 말씀
          </span>
          {!open && <span className="verse-plate__peek">{isLoading ? '' : full}</span>}
          <svg
            className="verse-plate__chev"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        <div className="verse-plate__body" id="annual-verse-body">
          <div className="verse-plate__inner">
            {isLoading ? (
              <div className="verse-plate__skeleton" aria-hidden>
                <span />
                <span />
              </div>
            ) : (
              <blockquote className="verse-plate__quote">
                <p className="verse-plate__text">
                  {head}
                  <em className="verse-plate__mark">{mark}</em>
                </p>
              </blockquote>
            )}

            <span className="verse-plate__rule" aria-hidden />

            <figcaption className="verse-plate__foot">
              <span className="verse-plate__ref">{ref}</span>
              {!isLoading && full && (
                <button
                  type="button"
                  onClick={openVerseCard}
                  className="verse-plate__share"
                  aria-label="말씀 카드 만들어 공유하기"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M12 3v12" />
                    <path d="M7.5 7.5L12 3l4.5 4.5" />
                    <path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
                  </svg>
                  말씀 카드
                </button>
              )}
            </figcaption>
          </div>
        </div>
      </figure>
    </section>
  )
}

export default AnnualThemeVerse
