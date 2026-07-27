interface BottomNavigationProps {
  onProfileClick: () => void
  onComposeClick: () => void
  onScrollToTop: () => void
  onFocusModeClick: () => void
  onBibleClick: () => void
  /** lazy 청크를 받는 중인 목적지 경로 — 해당 아이콘 자리에 스피너를 띄운다 */
  pendingPath?: string | null
}

// 청크 대기 중 표시 — 아이콘과 같은 크기라 눌린 자리가 흔들리지 않는다
const NavSpinner = () => (
  <span className="w-[22px] h-[22px] rounded-full border-2 border-current border-t-transparent animate-spin" />
)

const BottomNavigation = ({
  onProfileClick,
  onComposeClick,
  onScrollToTop,
  onFocusModeClick,
  onBibleClick,
  pendingPath = null,
}: BottomNavigationProps) => {
  // 모바일엔 hover가 없어 탭 피드백이 전혀 없었음 — active로 즉각 반응을 준다
  const navItemClass =
    'relative z-10 flex items-center justify-center w-12 h-12 rounded-xl text-gray-500 dark:text-white/70 hover:text-brand hover:bg-[var(--brand-soft)] active:text-brand active:bg-[var(--brand-soft)] active:scale-90 transition-[color,background-color,transform] duration-150'

  return (
    <div className="relative px-3 pb-3 pt-7">
      {/* Glass dock — 카드 시스템과 동일한 #1c1c26/80 + 상단 1px 빛줄 + soft purple shadow.
          상단 중앙은 dock-notch 마스크(S-커브 SVG)로 부드럽게 깎아내려 FAB가 안기게 한다 */}
      <nav
        className="dock-notch relative backdrop-blur-xl bg-white/80 dark:bg-[#201f1f]/90 border border-black/[0.04] dark:border-white/[0.08] rounded-2xl px-5 py-2 flex items-center justify-between shadow-[0_4px_16px_rgba(0,0,0,0.08),0_8px_24px_var(--brand-soft)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.5),0_12px_28px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)]"
      >
        {/* 다크모드 카드 표면 그라데이션 — 카드 시스템과 동일 */}
        <div className="hidden dark:block absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />

        {/* Home */}
        <button
          onClick={onScrollToTop}
          aria-label="홈"
          className={navItemClass}
        >
          <svg
            className="w-[26px] h-[26px]"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M3 11.5 12 3l9 8.5" />
            <path d="M5 10v10a1 1 0 0 0 1 1h4v-7h4v7h4a1 1 0 0 0 1-1V10" />
          </svg>
        </button>

        {/* Bible — FAB 왼쪽 '말씀' 자리. 책 아이콘은 성경 전용으로 두고 집중기도는 기도 아이콘으로 분리 */}
        <button
          onClick={onBibleClick}
          aria-label="성경"
          aria-busy={pendingPath === '/bible'}
          className={navItemClass}
        >
          {pendingPath === '/bible' ? (
            <NavSpinner />
          ) : (
            <span className="material-icons-outlined text-[26px]">menu_book</span>
          )}
        </button>

        {/* 중앙 자리 비움 — 떠 있는 FAB(아래 형제 요소)가 이 위에 얹힌다 */}
        <div aria-hidden className="w-12 h-12" />

        {/* Focus — 집중 기도 모드. 촛불·두 손 같은 구상적 은유는 유치하다는 피드백으로,
            '정해진 시간 동안 집중'을 그대로 말하는 스톱워치로 확정.
            상단 버튼 + 바늘 하나뿐인 최소 형태(Lucide timer 계열) */}
        <button
          onClick={onFocusModeClick}
          aria-label="집중 기도 모드"
          aria-busy={pendingPath === '/prayer-focus'}
          className={navItemClass}
        >
          {pendingPath === '/prayer-focus' ? (
            <NavSpinner />
          ) : (
            <svg
              className="w-[26px] h-[26px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* 상단 누름 버튼 */}
              <path d="M10 2.5h4" />
              {/* 몸통 다이얼 */}
              <circle cx="12" cy="14" r="7.5" />
              {/* 바늘 — 1~2시 방향 한 개만 */}
              <path d="M12 14l2.7-2.7" />
            </svg>
          )}
        </button>

        {/* Profile — saturated 원형 금지, outline으로 평탄화 */}
        <button
          onClick={onProfileClick}
          aria-label="프로필"
          aria-busy={pendingPath === '/profile'}
          className={navItemClass}
        >
          {pendingPath === '/profile' ? (
            <NavSpinner />
          ) : (
            <svg
              className="w-[26px] h-[26px]"
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
        </button>
      </nav>

      {/* Compose FAB — 노치 위에 떠 있는 원형 + 버튼. 바(mask)와 분리된 형제 요소라 잘리지 않는다.
          원 중심이 바 상단 모서리에 오도록 배치해 절반은 위로 솟고 절반은 노치에 안긴다 */}
      <button
        onClick={onComposeClick}
        aria-label="기도 작성"
        className="absolute left-1/2 -translate-x-1/2 top-0 z-20 flex items-center justify-center w-14 h-14 rounded-full text-white bg-gradient-to-br from-[#69a8ff] via-[var(--brand)] to-[#3f5efb] shadow-[0_6px_16px_-2px_var(--brand-glow)] ring-1 ring-white/20 dark:ring-white/15 active:scale-90 transition-transform duration-150"
      >
        {/* 위쪽 절반 유리 광택 — 평면 채움이 아니라 살짝 부푼 버튼처럼 보이게 */}
        <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 via-white/5 to-transparent pointer-events-none" />
        <svg
          className="relative w-7 h-7"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  )
}

export default BottomNavigation
