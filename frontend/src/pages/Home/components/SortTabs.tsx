import { useEffect, useId, useRef, useState } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import type { SortType } from '../../../types/prayer'
import { FEED_TEXT_SCALES, setFeedTextScale, useFeedTextScale, type FeedTextScale } from '../../../utils/feedTextScale'

interface SortTabsProps {
  currentSort: SortType
  onSortChange: (sort: SortType) => void
}

const SortTabs = ({ currentSort, onSortChange }: SortTabsProps) => {
  const { t } = useLanguage()
  
  // z-30: 그룹 필터 드롭다운의 딤막(z-40)보다 아래에 있어야 한다.
  // 동률이면 DOM 순서상 이 흰 sticky 바가 딤막 위로 올라와 흰 줄처럼 비친다.
  // lg+에선 렌더하지 않는다 — 세그먼트 탭 줄 오른쪽의 DesktopSortToggle이 대신한다.
  return (
    <section className="bg-[var(--app-canvas)] py-2 px-4 flex items-center sticky top-14 z-30 lg:hidden">
      {/* 메인 탭(GroupFilter, 굵은 언더라인)과 시각적으로 명확히 구분되도록
          정렬은 작은 pill 칩 스타일로 처리 — 위계상 보조 컨트롤임을 드러냄. */}
      <div className="flex gap-1.5">
        <button
          onClick={() => onSortChange('popular')}
          className={`text-[12px] font-medium px-3 py-1 rounded-full transition-all duration-150 ${
            currentSort === 'popular'
              ? 'bg-[var(--brand-soft-strong)] text-brand'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          {t('popular')}
        </button>
        <button
          onClick={() => onSortChange('latest')}
          className={`text-[12px] font-medium px-3 py-1 rounded-full transition-all duration-150 ${
            currentSort === 'latest'
              ? 'bg-[var(--brand-soft-strong)] text-brand'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          {t('latest')}
        </button>
      </div>
    </section>
  )
}

// PC 전용 정렬 메뉴 — 탭 줄 오른쪽 끝 "따뜻한 관심순 ▾" 글자 드롭다운. 기도 글씨 크기도 이 안에서 고른다
// (피드 위에 따로 있던 글씨 크기 줄을 없애려는 것 — 헤더 '가'와 같은 저장소라 어디서 바꿔도 함께 따라간다).
// 아이콘 2칸(하트·시계)은 정렬이라는 게 읽히지 않았다. 글자 수 차이로 폭이 출렁여 옆 탭 트랙을
// 밀지 않도록, 버튼 안에 모든 라벨을 같은 칸에 겹쳐 두고 가장 긴 라벨 폭으로 고정한다.
const SORT_OPTIONS: { sort: SortType; descKey: 'popularDesc' | 'latestDesc'; icon: React.ReactNode }[] = [
  {
    sort: 'popular',
    descKey: 'popularDesc',
    icon: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />,
  },
  {
    sort: 'latest',
    descKey: 'latestDesc',
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7.5V12l3 2" />
      </>
    ),
  },
]

// 버튼 글자 자체가 단계별로 커져 "누르면 이만큼 커진다"가 설명 없이 보인다 (FeedTextScaleToggle과 같은 문법)
const GLYPH_PX: Record<FeedTextScale, number> = { base: 13, large: 16, xlarge: 19 }

const LineIcon = ({ className, children }: { className: string; children: React.ReactNode }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {children}
  </svg>
)

export const DesktopSortToggle = ({ currentSort, onSortChange }: SortTabsProps) => {
  const { t, language } = useLanguage()
  const textScale = useFeedTextScale()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="hidden lg:block relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className={`h-10 pl-3.5 pr-2.5 rounded-full flex items-center gap-1 text-[13px] font-semibold whitespace-nowrap transition-colors duration-150 ${
          open
            ? 'bg-black/[0.07] text-ink-strong dark:bg-white/[0.1]'
            : 'text-gray-500 dark:text-gray-400 hover:bg-black/[0.05] hover:text-gray-700 dark:hover:bg-white/[0.06] dark:hover:text-gray-200'
        }`}
      >
        {/* 라벨을 한 칸에 겹쳐 가장 긴 폭을 차지 — 선택이 바뀌어도 버튼 폭이 그대로 */}
        <span className="grid text-right">
          {SORT_OPTIONS.map(({ sort }) => (
            <span
              key={sort}
              className={`[grid-area:1/1] ${currentSort === sort ? '' : 'invisible'}`}
              aria-hidden={currentSort !== sort}
            >
              {t(sort)}
            </span>
          ))}
        </span>
        <LineIcon className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>
          <path d="m6 9 6 6 6-6" />
        </LineIcon>
      </button>

      {open && (
        <div
          id={menuId}
          role="dialog"
          aria-label={t('sortMenuLabel')}
          className="absolute right-0 top-full mt-1.5 z-50 min-w-[220px] p-1.5 rounded-2xl bg-[var(--surface-container)] border border-[var(--card-border)] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)]"
        >
          <p className="px-2.5 pt-1.5 pb-1 text-[11.5px] font-medium text-gray-400 dark:text-gray-500">
            {t('sortMenuLabel')}
          </p>
          {SORT_OPTIONS.map(({ sort, descKey, icon }) => {
            const active = currentSort === sort
            return (
              <button
                key={sort}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  onSortChange(sort)
                  setOpen(false)
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors duration-150 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] ${
                  active ? 'text-brand' : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                <LineIcon className="w-4 h-4 shrink-0">{icon}</LineIcon>
                <span className="flex-1 min-w-0">
                  <span className={`block text-[13.5px] ${active ? 'font-bold' : 'font-medium'}`}>{t(sort)}</span>
                  <span className="block text-[11.5px] text-gray-500 dark:text-gray-400 mt-0.5">{t(descKey)}</span>
                </span>
                {active && (
                  <LineIcon className="w-4 h-4 shrink-0">
                    <path d="m5 12.5 4.5 4.5L19 7.5" />
                  </LineIcon>
                )}
              </button>
            )
          })}

          <div className="mx-1.5 my-1.5 border-t border-[var(--card-border)]" />
          <p className="px-2.5 pt-0.5 pb-1.5 text-[11.5px] font-medium text-gray-400 dark:text-gray-500">
            {language === 'ko' ? '글씨 크기' : 'Text size'}
          </p>
          {/* 고른 뒤에도 메뉴를 닫지 않는다 — 피드 글씨가 바뀌는 걸 보면서 맞출 수 있게 */}
          <div
            role="group"
            aria-label={language === 'ko' ? '기도 글씨 크기' : 'Prayer text size'}
            className="flex gap-1 px-1.5 pb-1"
          >
            {FEED_TEXT_SCALES.map((s) => {
              const active = textScale === s
              const name =
                language === 'ko'
                  ? { base: '보통', large: '크게', xlarge: '아주 크게' }[s]
                  : { base: 'Normal', large: 'Large', xlarge: 'Extra large' }[s]
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFeedTextScale(s)}
                  aria-pressed={active}
                  aria-label={name}
                  title={name}
                  className={`flex-1 h-10 rounded-xl flex items-center justify-center font-bold leading-none transition-colors duration-150 ${
                    active
                      ? 'bg-[var(--brand-soft-strong)] text-brand'
                      : 'bg-black/[0.04] text-gray-500 hover:text-gray-700 dark:bg-white/[0.06] dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                  style={{ fontSize: GLYPH_PX[s] }}
                >
                  {language === 'ko' ? '가' : 'A'}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default SortTabs
