// PC 전용 좌측 내비 레일 (lg+) — 모바일 하단 도크(BottomNavigation)의 데스크톱 대응물.
// lg에선 아이콘만, xl부터 라벨이 함께 보인다 (인스타그램 데스크톱 문법).
// 하단 도크의 FAB 스피드 다이얼은 데스크톱에선 펼쳐서 CTA(기도) + 보조 버튼(감사·말씀카드)으로 평탄화한다.

interface DesktopNavRailProps {
  onProfileClick: () => void
  onComposeClick: () => void
  onThanksClick: () => void
  onVerseCardClick: () => void
  onScrollToTop: () => void
  onFocusModeClick: () => void
  onBibleClick: () => void
  /** lazy 청크를 받는 중인 목적지 경로 — 해당 아이콘 자리에 스피너 */
  pendingPath?: string | null
}

const RailSpinner = () => (
  <span className="w-[22px] h-[22px] rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
)

const DesktopNavRail = ({
  onProfileClick,
  onComposeClick,
  onThanksClick,
  onVerseCardClick,
  onScrollToTop,
  onFocusModeClick,
  onBibleClick,
  pendingPath = null,
}: DesktopNavRailProps) => {
  // 하단 도크와 같은 스트로크 1.8 아이콘 언어 유지
  const itemClass =
    'flex items-center justify-center xl:justify-start gap-3.5 h-12 rounded-xl px-0 xl:px-3 text-gray-600 dark:text-white/75 hover:text-brand hover:bg-[var(--brand-soft)] active:scale-[0.97] transition-[color,background-color,transform] duration-150'
  const labelClass = 'hidden xl:inline text-[15px] font-semibold whitespace-nowrap'

  return (
    <aside
      className="hidden lg:flex fixed left-0 top-14 bottom-0 z-40 w-[76px] xl:w-[248px] flex-col bg-background-light dark:bg-background-dark border-r border-black/[0.05] dark:border-white/[0.06] px-3 xl:px-4 pt-6 pb-5"
      aria-label="주요 메뉴"
    >
      <nav className="flex flex-col gap-1">
        {/* 홈 — 현재 화면. 인스타처럼 활성 항목만 굵게 */}
        <button onClick={onScrollToTop} aria-label="홈" className={`${itemClass} text-ink-strong`}>
          <svg
            className="w-[26px] h-[26px] shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M3 11.5 12 3l9 8.5" />
            <path d="M5 10v10a1 1 0 0 0 1 1h4v-7h4v7h4a1 1 0 0 0 1-1V10" />
          </svg>
          <span className={`${labelClass} font-bold`}>홈</span>
        </button>

        {/* 성경 */}
        <button
          onClick={onBibleClick}
          aria-label="성경"
          aria-busy={pendingPath === '/bible'}
          className={itemClass}
        >
          {pendingPath === '/bible' ? (
            <RailSpinner />
          ) : (
            <span className="material-icons-outlined text-[26px] shrink-0">menu_book</span>
          )}
          <span className={labelClass}>성경</span>
        </button>

        {/* 집중 기도 — 하단 도크와 동일한 스톱워치 아이콘 */}
        <button
          onClick={onFocusModeClick}
          aria-label="집중 기도"
          aria-busy={pendingPath === '/prayer-focus'}
          className={itemClass}
        >
          {pendingPath === '/prayer-focus' ? (
            <RailSpinner />
          ) : (
            <svg
              className="w-[26px] h-[26px] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 2.5h4" />
              <circle cx="12" cy="14" r="7.5" />
              <path d="M12 14l2.7-2.7" />
            </svg>
          )}
          <span className={labelClass}>집중 기도</span>
        </button>

        {/* 말씀 사진 카드 만들기 */}
        <button
          onClick={onVerseCardClick}
          aria-label="말씀 카드 만들기"
          aria-busy={pendingPath === '/bible/photo-verse'}
          className={itemClass}
        >
          {pendingPath === '/bible/photo-verse' ? (
            <RailSpinner />
          ) : (
            <svg
              className="w-[26px] h-[26px] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
              <circle cx="9" cy="10" r="1.6" />
              <path d="M4 17.5l4.8-4.8 3.2 3.2 3.5-3.5 4.5 4.5" />
            </svg>
          )}
          <span className={labelClass}>말씀 카드</span>
        </button>

        {/* 프로필 */}
        <button
          onClick={onProfileClick}
          aria-label="프로필"
          aria-busy={pendingPath === '/profile'}
          className={itemClass}
        >
          {pendingPath === '/profile' ? (
            <RailSpinner />
          ) : (
            <svg
              className="w-[26px] h-[26px] shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
            </svg>
          )}
          <span className={labelClass}>프로필</span>
        </button>
      </nav>

      {/* 나눔 액션 — 도크 FAB 다이얼을 펼친 형태. 주 액션(기도)만 브랜드 채움 */}
      <div className="mt-6 flex flex-col gap-2 items-center xl:items-stretch">
        <button
          onClick={onComposeClick}
          aria-label="기도제목 나누기"
          className="brand-gradient w-12 h-12 xl:w-auto xl:h-auto xl:px-4 xl:py-3 rounded-full flex items-center justify-center gap-2 shadow-[0_6px_16px_-4px_var(--brand-glow)] hover:shadow-[0_8px_20px_-4px_var(--brand-glow)] active:scale-[0.96] transition-[box-shadow,transform] duration-150"
        >
          {/* 도크 FAB와 같은 스파클 얼굴 */}
          <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M11 6.5 C11.65 10.4 13.8 12.55 17.7 13.2 C13.8 13.85 11.65 16 11 19.9 C10.35 16 8.2 13.85 4.3 13.2 C8.2 12.55 10.35 10.4 11 6.5 Z" />
            <path d="M17.8 4.6 C18.08 6.06 18.94 6.92 20.4 7.2 C18.94 7.48 18.08 8.34 17.8 9.8 C17.52 8.34 16.66 7.48 15.2 7.2 C16.66 6.92 17.52 6.06 17.8 4.6 Z" />
          </svg>
          <span className="hidden xl:inline text-[14.5px] font-bold whitespace-nowrap">
            기도제목 나누기
          </span>
        </button>

        <button
          onClick={onThanksClick}
          aria-label="감사 한 줄 남기기"
          className="w-12 h-12 xl:w-auto xl:h-auto xl:px-4 xl:py-2.5 rounded-full flex items-center justify-center gap-2 border border-[var(--card-border)] text-gray-600 dark:text-white/75 hover:text-brand hover:border-brand hover:bg-[var(--brand-soft)] active:scale-[0.96] transition-[color,background-color,border-color,transform] duration-150"
        >
          <span className="text-[17px] leading-none" aria-hidden>
            🌼
          </span>
          <span className="hidden xl:inline text-[13.5px] font-bold whitespace-nowrap">
            감사 한 줄
          </span>
        </button>
      </div>
    </aside>
  )
}

export default DesktopNavRail
