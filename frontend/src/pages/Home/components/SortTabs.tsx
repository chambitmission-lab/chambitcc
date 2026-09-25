import { useLanguage } from '../../../contexts/LanguageContext'
import type { SortType } from '../../../types/prayer'

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

// PC 전용 정렬 스위치 — 탭 줄 오른쪽 끝의 아이콘 2칸 미니 세그먼트.
// 라벨을 품은 토글은 "따뜻한 관심순"↔"최신순" 글자 수 차이로 폭이 출렁여 옆 탭 트랙까지 밀었다.
// 아이콘 칸은 폭이 고정이고 두 선택지가 항상 보인다. 이름은 호버 툴팁·aria-label로 전달.
const SORT_OPTIONS: { sort: SortType; icon: React.ReactNode }[] = [
  {
    sort: 'popular',
    icon: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />,
  },
  {
    sort: 'latest',
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7.5V12l3 2" />
      </>
    ),
  },
]

export const DesktopSortToggle = ({ currentSort, onSortChange }: SortTabsProps) => {
  const { t } = useLanguage()

  return (
    <div
      role="group"
      className="hidden lg:flex shrink-0 items-center gap-0.5 p-1 rounded-full bg-black/[0.05] dark:bg-white/[0.06]"
    >
      {SORT_OPTIONS.map(({ sort, icon }) => {
        const active = currentSort === sort
        return (
          <button
            key={sort}
            type="button"
            onClick={() => onSortChange(sort)}
            aria-label={t(sort)}
            aria-pressed={active}
            className={`group relative w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-150 ${
              active
                ? 'text-brand bg-[var(--surface-container)] shadow-sm dark:bg-white/[0.12]'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              {icon}
            </svg>
            {/* 호버 툴팁 — 오른쪽 끝 칸이 컬럼 밖으로 넘치지 않게 우측 정렬 */}
            <span className="pointer-events-none absolute top-full right-0 mt-2 px-2 py-1 rounded-md bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150">
              {t(sort)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default SortTabs
