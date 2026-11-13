import { useMemo, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { parseBibleReference } from '../../Sermon/utils/sermonMeta'
import { useFeedTextScale, type FeedTextScale } from '../../../utils/feedTextScale'
import { SheetGrabber } from '../../../components/common/SheetGrabber'
import type { ChapterKeyword } from '../data/chapterKeywords'

// 시트는 body 포털이라 --text-mul 을 상속받지 못한다 — GlossarySheet 와 같은 값으로 직접 세팅
const TEXT_MUL: Record<FeedTextScale, number> = { base: 1, large: 1.1, xlarge: 1.2 }
const LANG_LABEL = { he: '히브리어', gr: '헬라어' } as const

interface KeywordSheetProps {
  keyword: ChapterKeyword
  /** "창세기 9장" */
  where: string
  active: boolean
  onToggleHighlight: () => void
  onClose: () => void
}

/**
 * 열쇠말 칩을 탭하면 열리는 뜻풀이 시트.
 * 뜻 한 줄 → 원어 → 왜 반복될까 → 다른 곳에서도 → "본문에서 밝혀 보기" 순.
 * 밝히기가 이 기능의 핵심이라 맨 아래 큰 버튼 하나로 둔다.
 */
const KeywordSheet = ({ keyword, where, active, onToggleHighlight, onClose }: KeywordSheetProps) => {
  useModalBackButton(onClose)
  const navigate = useNavigate()
  const textScale = useFeedTextScale()

  const links = useMemo(
    () =>
      (keyword.alsoIn ?? []).map((l) => {
        const parsed = parseBibleReference(l.ref)
        return { ...l, target: parsed?.bookNumber ? parsed : null }
      }),
    [keyword.alsoIn]
  )

  const go = (t: NonNullable<(typeof links)[number]['target']>) => {
    onClose()
    navigate(`/bible/${t.bookNumber}/${t.chapter}${t.verse ? `?verse=${t.verse}` : ''}`)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 sheet-backdrop sm:p-4"
      style={{ '--text-mul': TEXT_MUL[textScale] } as CSSProperties}
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-sm lg:max-w-md max-h-[88dvh] flex flex-col sheet-rise bg-background-light dark:bg-card-dark rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-6 -right-6 w-36 h-36 rounded-full blur-3xl pointer-events-none bg-[rgba(250,196,40,0.22)]" />
        <SheetGrabber
          onClose={onClose}
          className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/15 absolute left-1/2 -translate-x-1/2 top-2 sm:hidden"
        />

        <div className="relative z-10 overflow-y-auto overscroll-contain px-5 pt-6 pb-5 lg:px-6 lg:pt-7 lg:pb-6">
          {/* 머리 — 열쇠 아이콘 · 어디의 열쇠말인지 · 말 · 횟수 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shrink-0 bg-[rgba(250,196,40,0.18)] text-[#b7791f] dark:text-[#f6c544]">
              <span className="material-icons-round text-[22px] lg:text-[26px]">key</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-[10.5px] lg:text-[length:calc(13px*var(--text-mul,1))] font-bold tracking-[0.08em] text-[#b7791f] dark:text-[#f6c544]`}>
                {where} · 열쇠말
              </p>
              <h3 className={`text-[19px] lg:text-[length:calc(22px*var(--text-mul,1))] text-ink-strong font-bold tracking-[-0.02em] break-keep`}>
                {keyword.word}
                <span className={`ml-1.5 align-middle text-[12px] lg:text-[length:calc(14px*var(--text-mul,1))] font-bold text-ink-muted`}>
                  {keyword.count}번
                </span>
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="w-9 h-9 lg:w-11 lg:h-11 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors shrink-0"
            >
              <span className="material-icons-round text-[20px]">close</span>
            </button>
          </div>

          <p className={`mt-4 text-[15px] lg:text-[length:calc(18px*var(--text-mul,1))] leading-relaxed text-ink-strong font-semibold break-keep`}>
            {keyword.meaning}
          </p>

          {/* 원어 — 글자는 크게, 발음과 결은 한 줄로 */}
          {keyword.original && (
            <div className="mt-3.5 rounded-2xl px-4 py-3 bg-[var(--surface-container)] border border-[var(--card-border)] flex items-center gap-3.5">
              <span
                dir={keyword.original.lang === 'he' ? 'rtl' : 'ltr'}
                lang={keyword.original.lang === 'he' ? 'he' : 'el'}
                className="shrink-0 text-[26px] lg:text-[30px] leading-none text-ink-strong"
                style={{ fontFamily: '"SBL Hebrew", "Noto Serif Hebrew", "Times New Roman", serif' }}
              >
                {keyword.original.script}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-[10.5px] lg:text-[length:calc(12.5px*var(--text-mul,1))] font-bold text-ink-muted tracking-wide`}>
                  {LANG_LABEL[keyword.original.lang]} · {keyword.original.sound}
                </span>
                <span className={`block mt-0.5 text-[13px] lg:text-[length:calc(15.5px*var(--text-mul,1))] text-ink leading-snug break-keep`}>
                  {keyword.original.gloss}
                </span>
              </span>
            </div>
          )}

          <p className={`mt-4 text-[11px] lg:text-[length:calc(13px*var(--text-mul,1))] font-bold tracking-wide text-ink-muted`}>왜 반복될까요</p>
          <p className={`mt-1 text-[14px] lg:text-[length:calc(16.5px*var(--text-mul,1))] leading-relaxed text-ink break-keep`}>{keyword.why}</p>

          {links.length > 0 && (
            <>
              <p className={`mt-4 text-[11px] lg:text-[length:calc(13px*var(--text-mul,1))] font-bold tracking-wide text-ink-muted`}>다른 곳에서도</p>
              <div className="mt-1.5 space-y-1.5">
                {links.map((l) =>
                  l.target ? (
                    <button
                      key={l.ref}
                      type="button"
                      onClick={() => go(l.target!)}
                      className="w-full flex items-center gap-2 rounded-xl bg-[var(--brand-soft)] px-3.5 py-2.5 lg:min-h-[52px] text-left transition-colors hover:bg-[var(--brand-soft-strong)]"
                    >
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[12px] lg:text-[length:calc(14px*var(--text-mul,1))] font-bold text-brand`}>{l.ref}</span>
                        <span className={`block text-[12.5px] lg:text-[length:calc(14.5px*var(--text-mul,1))] text-ink leading-snug break-keep`}>{l.note}</span>
                      </span>
                      <span className="material-icons-round text-[18px] text-brand shrink-0">chevron_right</span>
                    </button>
                  ) : (
                    <p key={l.ref} className={`text-[12.5px] lg:text-[length:calc(14.5px*var(--text-mul,1))] text-ink`}>
                      <b className="text-brand">{l.ref}</b> {l.note}
                    </p>
                  )
                )}
              </div>
            </>
          )}

          <button
            type="button"
            onClick={onToggleHighlight}
            className={`mt-5 w-full h-12 lg:h-14 rounded-2xl flex items-center justify-center gap-2 font-bold text-[15px] lg:text-[length:calc(17px*var(--text-mul,1))] transition-colors ${
              active
                ? 'bg-[var(--surface-container)] text-ink border border-[var(--card-border)]'
                : 'bg-[#f6c544] text-[#3d2c00] hover:bg-[#f1bb2a]'
            }`}
          >
            {/* 아이콘은 1em 칸에 가둔다 — 리가처가 안 붙으면(옛 폰트 캐시 등) 이름 18글자가 1em씩
                투명한 폭을 차지해 문구가 오른쪽 끝으로 밀려 세로로 한 글자씩 꺾였다 */}
            <span aria-hidden className="material-icons-round text-[20px] w-[1em] overflow-hidden shrink-0">
              {active ? 'format_color_reset' : 'highlight'}
            </span>
            <span className="whitespace-nowrap">{active ? '밝히기 끄기' : `본문에서 밝혀 보기 · ${keyword.count}곳`}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default KeywordSheet
