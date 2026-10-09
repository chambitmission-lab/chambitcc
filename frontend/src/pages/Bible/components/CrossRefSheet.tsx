import { type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { useBibleChapter } from '../../../hooks/useBible'
import { useFeedTextScale, type FeedTextScale } from '../../../utils/feedTextScale'
import { SheetGrabber } from '../../../components/common/SheetGrabber'
import { formatRef, type CrossLink } from '../data/crossRefs'

// 포털 시트라 <main data-text-scale> 를 상속받지 못한다 — GlossarySheet 와 같은 값으로 직접 세팅
const TEXT_MUL: Record<FeedTextScale, number> = { base: 1, large: 1.1, xlarge: 1.2 }

const KIND_LABEL: Record<CrossLink['kind'], string> = {
  quotes: '이 말씀이 인용한 구약',
  quotedBy: '이 말씀을 인용한 신약',
  parallel: '같은 이야기, 다른 복음서',
}

const KIND_ICON: Record<CrossLink['kind'], string> = {
  quotes: 'history_edu',
  quotedBy: 'east',
  parallel: 'view_column',
}

/**
 * 연결 구절 칩을 탭하면 열리는 하단 시트 — 건너가지 않고도 그 본문을 바로 읽어 보게 하고,
 * 더 읽고 싶으면 그 자리로 이동한다. 대상 장은 읽기 화면과 같은 장 캐시(useBibleChapter)를 쓴다.
 */
const CrossRefSheet = ({ link, onClose }: { link: CrossLink; onClose: () => void }) => {
  useModalBackButton(onClose)
  const navigate = useNavigate()
  const textScale = useFeedTextScale()
  const { target } = link
  const { data, isLoading } = useBibleChapter(target.b, target.c)
  const verses = (data?.verses ?? []).filter((v) => v.verse >= target.v && v.verse <= target.to && v.text)

  const goToPassage = () => {
    onClose()
    navigate(`/bible/${target.b}/${target.c}?verse=${target.v}`)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 sheet-backdrop sm:p-4"
      style={{ '--text-mul': TEXT_MUL[textScale] } as CSSProperties}
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md lg:max-w-lg sheet-rise bg-background-light dark:bg-card-dark rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <SheetGrabber onClose={onClose} className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/15 absolute left-1/2 -translate-x-1/2 top-2 sm:hidden" />

        <div className="relative z-10 px-5 pt-6 pb-5 lg:px-6 lg:pt-7 lg:pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center bg-[var(--brand-soft)] text-brand shrink-0">
              <span className="material-icons-round text-[22px] lg:text-[26px]">{KIND_ICON[link.kind]}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-brand text-[10.5px] lg:text-[length:calc(13px*var(--text-mul,1))] font-bold tracking-[0.06em]">
                {KIND_LABEL[link.kind]}
              </p>
              <h3 className="text-ink-strong text-[18px] lg:text-[length:calc(21px*var(--text-mul,1))] font-bold tracking-[-0.015em] truncate">
                {formatRef(target)}
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

          {link.label && (
            <p className="mt-3 text-[13px] lg:text-[length:calc(15px*var(--text-mul,1))] font-semibold text-ink-muted break-keep">
              {link.kind === 'parallel' ? link.label : `“${link.label}”`}
            </p>
          )}

          {/* 대상 본문 — 길면(평행 본문은 10절 넘기도) 시트 안에서만 스크롤 */}
          <div className="mt-3 max-h-[min(45vh,22rem)] overflow-y-auto rounded-xl bg-[var(--ig-secondary-background)] px-4 py-3">
            {isLoading ? (
              <p className="text-[13px] text-ink-muted">본문을 불러오는 중…</p>
            ) : verses.length ? (
              verses.map((v) => (
                <p
                  key={v.id}
                  className="text-[14.5px] lg:text-[length:calc(17px*var(--text-mul,1))] leading-[1.8] text-ink break-keep [&+&]:mt-1.5"
                >
                  <sup className="mr-1 text-[10.5px] font-bold text-brand">{v.verse}</sup>
                  {v.text}
                </p>
              ))
            ) : (
              <p className="text-[13px] text-ink-muted">본문을 불러오지 못했어요.</p>
            )}
          </div>

          <button
            type="button"
            onClick={goToPassage}
            className="mt-4 w-full flex items-center gap-2 rounded-xl bg-[var(--brand-soft)] px-3.5 py-3 lg:min-h-[52px] lg:px-4 text-left transition-colors hover:bg-[var(--brand-soft-strong)]"
          >
            <span className="material-icons-round text-[17px] text-brand shrink-0">auto_stories</span>
            <span className="min-w-0 flex-1 text-[12.5px] lg:text-[length:calc(15px*var(--text-mul,1))] font-bold text-brand">
              {formatRef(target)} 앞뒤로 읽으러 가기
            </span>
            <span className="material-icons-round text-[18px] text-brand shrink-0">chevron_right</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default CrossRefSheet
